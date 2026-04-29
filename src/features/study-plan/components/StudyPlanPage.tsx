import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { VineDecoration } from "@/components/garden/VineDecoration";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { PremiumGate } from "@/features/subscription/components/PremiumGate";
import { Button } from "@/components/ui/button";
import {
  fetchCourseGardenData,
  updateCourseTestDate,
} from "@/features/courses/services/courseService";
import { fetchPassChance } from "@/features/test/services/testService";
import { fetchProfile } from "@/features/settings";
import { getGradeLabel } from "@/lib/curricula";
import {
  gardenQueryKeys,
  testQueryKeys,
  profileQueryKeys,
  studyPlanQueryKeys,
} from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import { generateStudyPlan, getWeakTopics } from "../services/studyPlanService";
import { posthog } from "@/lib/posthog";
import { isMarkdownPlan, type PlanJson } from "../types";
import { DateSetupCard } from "./DateSetupCard";
import { StudyPlanHero } from "./StudyPlanHero";
import { StudyPlanHeader } from "./StudyPlanHeader";
import { OutdatedPlanBanner } from "./OutdatedPlanBanner";
import { MarkdownPlanRenderer } from "./MarkdownPlanRenderer";
import { TopicBreakdownRow } from "./TopicBreakdownRow";

export function StudyPlanPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Course ─────────────────────────────────────────────────────────────────
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["courses", "detail", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, target_grade, test_date")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // ── BKT garden data ────────────────────────────────────────────────────────
  const { data: gardenData, isLoading: gardenLoading } = useQuery({
    queryKey: gardenQueryKeys.progress(courseId ?? "", user?.id ?? ""),
    queryFn: () => fetchCourseGardenData(user!.id, courseId!),
    enabled: !!user && !!courseId,
    staleTime: 30_000,
  });

  // ── Pass probability ───────────────────────────────────────────────────────
  useQuery({
    queryKey: testQueryKeys.passChance(courseId ?? "", user?.id ?? ""),
    queryFn: () => fetchPassChance(user!.id, courseId!),
    enabled: !!user && !!courseId,
  });

  // ── Profile ────────────────────────────────────────────────────────────────
  const { data: profileData } = useQuery({
    queryKey: profileQueryKeys.detail(user?.id ?? ""),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  // ── Flags ──────────────────────────────────────────────────────────────────
  const hasDocuments = (gardenData?.total_concepts ?? 0) > 0;
  const testDate: string | null = course?.test_date ?? null;
  const isTestDatePast =
    testDate !== null && new Date(testDate) < new Date(new Date().toDateString());

  // ── Saved plan ─────────────────────────────────────────────────────────────
  const { data: savedPlan, isLoading: planLoading } = useQuery({
    queryKey: studyPlanQueryKeys.detail(courseId ?? "", user?.id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_plans")
        .select("id, plan_json, generated_at")
        .eq("user_id", user!.id)
        .eq("course_id", courseId!)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; plan_json: PlanJson; generated_at: string } | null;
    },
    enabled: !!user && !!courseId && hasDocuments && !!testDate && !isTestDatePast,
    staleTime: 5 * 60_000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const testDateMutation = useMutation({
    mutationFn: (date: string) => updateCourseTestDate(courseId!, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", "detail", courseId] });
      toast.success("Exam date saved");
    },
    onError: () => toast.error("Failed to save exam date"),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateStudyPlan(user!.id, courseId!),
    onSuccess: () => {
      posthog.capture("study_plan_generated", {
        course_id: courseId,
        regenerated: !!savedPlan,
      });
      queryClient.invalidateQueries({
        queryKey: studyPlanQueryKeys.detail(courseId ?? "", user?.id ?? ""),
      });
      toast.success("Your growth guide has been grown!");
    },
    onError: () => toast.error("Something went wrong. The garden needs a moment."),
  });

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!user || !courseId) {
    navigate("/home");
    return null;
  }

  if (courseLoading || gardenLoading) {
    return <GardenVideoLoader message="Mapping the path ahead..." />;
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const curriculum = profileData?.curriculum ?? "percentage";
  const targetGrade = course?.target_grade ?? 1.0;
  const targetLabel = getGradeLabel(curriculum, targetGrade);
  const passPercent =
    gardenData != null ? gardenData.overall_progress : null;
  const daysRemaining = testDate
    ? Math.max(
        0,
        Math.round(
          (new Date(testDate).getTime() - new Date(new Date().toDateString()).getTime()) /
            86_400_000,
        ),
      )
    : 0;
  const weakTopics = gardenData ? getWeakTopics(gardenData.topics) : [];

  const planJson = savedPlan?.plan_json ?? null;
  const isV2Plan = planJson ? isMarkdownPlan(planJson) : false;
  const isV1Plan = planJson !== null && !isV2Plan;
  const isGenerating = generateMutation.isPending;

  return (
    <>
      <GhibliBackground />
      <Header />
      <VineDecoration />
      <PremiumGate
        featureName="Study Plan"
        featureDescription="An AI growth guide tailored to your weakest areas, exam date, and pass probability."
      >
      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          {/* Back link */}
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#2D6A4F] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </button>

          {/* Page header */}
          <div
            className="mb-8 p-6 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(64,145,108,0.06) 0%, rgba(250,243,224,0) 70%)",
              border: "1px solid rgba(64,145,108,0.12)",
            }}
          >
            <p className="text-xs font-semibold text-[#40916C] uppercase tracking-wider mb-1">
              Study Plan
            </p>
            <h1 className="text-2xl font-bold">{course?.title ?? "Your Course"}</h1>
            {targetLabel && (
              <p className="text-sm text-muted-foreground mt-1">Target: {targetLabel}</p>
            )}
          </div>

          {/* ── State A: No documents ──────────────────────────────────────── */}
          {!hasDocuments && (
            <ParchmentCard className="p-10 text-center flex flex-col items-center gap-4">
              <img
                src="/plant-stage-1.png"
                alt=""
                className="w-16 h-16 object-contain"
                style={{ mixBlendMode: "darken" }}
              />
              <div>
                <h2 className="font-serif text-base font-semibold mb-1">
                  The garden needs seeds first
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Upload your study materials so the plan knows what to grow.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-[rgba(64,145,108,0.3)] hover:border-[#40916C]"
                onClick={() => navigate("/documents")}
              >
                Upload Materials
              </Button>
            </ParchmentCard>
          )}

          {/* ── State B: No test date (or past) ───────────────────────────── */}
          {hasDocuments && (!testDate || isTestDatePast) && (
            <>
              {isTestDatePast && testDate && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                  Your previous exam date ({new Date(testDate).toLocaleDateString()}) has passed.
                  Set a new one to update your plan.
                </div>
              )}
              <DateSetupCard
                onSave={(date) => testDateMutation.mutate(date)}
                isPending={testDateMutation.isPending}
              />
            </>
          )}

          {/* ── State C: Has documents + valid test date ───────────────────── */}
          {hasDocuments && testDate && !isTestDatePast && (
            <div className="space-y-6">
              <StudyPlanHero
                daysRemaining={daysRemaining}
                testDate={testDate}
                passPercent={passPercent}
                targetLabel={targetLabel}
                courseId={courseId}
              />

              <StudyPlanHeader
                hasPlan={!!planJson}
                isGenerating={isGenerating}
                generatedAt={savedPlan?.generated_at}
                onRegenerate={() => generateMutation.mutate()}
              />

              {/* Generating spinner */}
              {(isGenerating || planLoading) && (
                <ParchmentCard className="p-10 flex flex-col items-center gap-3 text-center">
                  <Loader2 className="w-7 h-7 text-[#40916C] animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Growing your plan… this takes a few seconds.
                  </p>
                </ParchmentCard>
              )}

              {/* No plan yet */}
              {!isGenerating && !planLoading && !planJson && (
                <ParchmentCard className="p-10 flex flex-col items-center gap-4 text-center">
                  <img
                    src="/plant-stage-2.png"
                    alt=""
                    className="w-14 h-14 object-contain"
                    style={{ mixBlendMode: "darken" }}
                  />
                  <div>
                    <p className="text-sm font-semibold mb-1">Ready to map your path?</p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Claude will look at your mastery levels and quiz history to write a
                      personalised growth guide — with time estimates and projected outcomes.
                    </p>
                  </div>
                  <Button
                    className="gap-2 shadow-[0_2px_8px_rgba(13,115,119,0.2)]"
                    onClick={() => generateMutation.mutate()}
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate My Growth Guide
                  </Button>
                </ParchmentCard>
              )}

              {/* Old v1 plan — prompt to regenerate */}
              {!isGenerating && !planLoading && isV1Plan && (
                <OutdatedPlanBanner onRegenerate={() => generateMutation.mutate()} />
              )}

              {/* v2 markdown plan */}
              {!isGenerating && !planLoading && isV2Plan && isMarkdownPlan(planJson!) && (
                <MarkdownPlanRenderer
                  markdown={planJson!.markdown}
                  courseId={courseId}
                  gardenTopics={gardenData?.topics ?? []}
                  onRegenerate={() => generateMutation.mutate()}
                />
              )}

              {/* Topic breakdown */}
              {weakTopics.length > 0 && (
                <div>
                  <h2 className="text-base font-semibold mb-3">All Topics</h2>
                  <div className="space-y-2">
                    {weakTopics.map((topic) => (
                      <TopicBreakdownRow
                        key={topic.topic_id}
                        topic={topic}
                        courseId={courseId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </PremiumGate>
    </>
  );
}
