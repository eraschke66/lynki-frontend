import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { VineDecoration } from "@/components/garden/VineDecoration";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Target,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCourseGardenData,
  updateCourseTestDate,
} from "@/features/courses/services/courseService";
import { fetchPassChance } from "@/features/test/services/testService";
import { fetchProfile } from "@/features/settings";
import { getGradeLabel } from "@/lib/curricula";
import { getGardenStatus } from "@/lib/garden";
import {
  gardenQueryKeys,
  testQueryKeys,
  profileQueryKeys,
  studyPlanQueryKeys,
} from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import { generateStudyPlan, getWeakTopics } from "../services/studyPlanService";
import type { StructuredPlan, StudySession } from "../types";

// ---------------------------------------------------------------------------
// DateSetupCard
// ---------------------------------------------------------------------------

function DateSetupCard({
  onSave,
  isPending,
}: {
  onSave: (date: string) => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState("");
  const today = new Date().toISOString().split("T")[0];

  return (
    <ParchmentCard className="p-8 text-center flex flex-col items-center gap-5 max-w-sm mx-auto">
      <div className="w-14 h-14 rounded-full bg-[rgba(64,145,108,0.1)] flex items-center justify-center">
        <Calendar className="w-7 h-7 text-[#2D6A4F]" />
      </div>
      <div>
        <h2 className="font-serif text-lg font-semibold mb-1">
          When is your exam?
        </h2>
        <p className="text-sm text-muted-foreground">
          Set your exam date so the garden can map the path ahead.
        </p>
      </div>
      <input
        type="date"
        min={today}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full max-w-xs border border-[rgba(64,145,108,0.3)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#40916C] bg-transparent"
      />
      <Button
        onClick={() => onSave(value)}
        disabled={!value || isPending}
        className="w-full max-w-xs shadow-[0_2px_8px_rgba(13,115,119,0.2)]"
      >
        {isPending ? "Saving…" : "Set Exam Date"}
      </Button>
    </ParchmentCard>
  );
}

// ---------------------------------------------------------------------------
// SessionCard
// ---------------------------------------------------------------------------

function SessionCard({
  session,
  sessionIndex,
  courseId,
}: {
  session: StudySession;
  sessionIndex: number;
  courseId: string;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const conceptIds = session.activities
    .map((a) => a.concept_id)
    .filter(Boolean)
    .join(",");

  return (
    <ParchmentCard className="p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-[rgba(64,145,108,0.1)] flex items-center justify-center text-xs font-bold text-[#2D6A4F] shrink-0">
          {sessionIndex + 1}
        </div>
        <div>
          <p className="text-xs font-semibold text-[#40916C] uppercase tracking-wide">
            {session.label}
          </p>
          <p className="font-semibold text-sm">{session.theme}</p>
        </div>
      </div>

      {/* Activity list */}
      <div className="space-y-3 mb-5">
        {session.activities.map((activity, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-base shrink-0 mt-0.5">🌱</span>
            <div>
              <p className="text-sm font-medium leading-snug">
                {activity.concept_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {activity.topic_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 italic leading-relaxed">
                {activity.guidance}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Test My Understanding */}
      {conceptIds && (
        <div className="border-t border-[rgba(64,145,108,0.1)] pt-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              A short adaptive quiz on these concepts — answers count toward
              your mastery and pass chance.
            </p>
            <Button
              size="sm"
              className="shrink-0 gap-1.5 shadow-[0_2px_8px_rgba(13,115,119,0.15)]"
              onClick={() => {
                queryClient.removeQueries({
                  queryKey: testQueryKeys.quiz(courseId, user?.id ?? ""),
                });
                navigate(`/test/${courseId}?conceptIds=${conceptIds}`);
              }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Test My Understanding
            </Button>
          </div>
        </div>
      )}
    </ParchmentCard>
  );
}

// ---------------------------------------------------------------------------
// TopicBreakdownRow
// ---------------------------------------------------------------------------

function TopicBreakdownRow({
  topic,
  courseId,
}: {
  topic: ReturnType<typeof getWeakTopics>[number];
  courseId: string;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const status = getGardenStatus(topic.overall_progress);
  const unmasteredConcepts = topic.concepts.filter((c) => !c.is_mastered);

  return (
    <div className="border border-[rgba(64,145,108,0.12)] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[rgba(64,145,108,0.03)] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{topic.topic_name}</p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${status.bgColor} ${status.color}`}
            >
              {status.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {topic.mastered_concepts} of {topic.total_concepts} concepts
            mastered
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-[rgba(64,145,108,0.3)] hover:border-[#40916C] hover:text-[#1B4332]"
            onClick={(e) => {
              e.stopPropagation();
              queryClient.removeQueries({
                queryKey: testQueryKeys.quiz(courseId, user?.id ?? ""),
              });
              navigate(`/test/${courseId}?topicId=${topic.topic_id}`);
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Study
          </Button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-1.5 border-t border-[rgba(64,145,108,0.08)] pt-3">
          {unmasteredConcepts.map((concept) => {
            const m = Math.round(concept.p_mastery * 100);
            const s = getGardenStatus(m);
            return (
              <div
                key={concept.concept_id}
                className="flex items-center gap-2.5 py-1"
              >
                <span className="text-base shrink-0">
                  {concept.status === "in_progress" ? "🌿" : "🌱"}
                </span>
                <span className="text-sm flex-1 min-w-0 truncate">
                  {concept.concept_name}
                </span>
                {concept.n_attempts > 0 ? (
                  <span className={`text-xs font-medium shrink-0 ${s.color}`}>
                    {m}%
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">
                    Not yet explored
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StudyPlanPage
// ---------------------------------------------------------------------------

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
  const { data: passChanceData } = useQuery({
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
    testDate !== null &&
    new Date(testDate) < new Date(new Date().toDateString());

  // ── Saved plan (direct Supabase read) ─────────────────────────────────────
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
      return data as {
        id: string;
        plan_json: StructuredPlan;
        generated_at: string;
      } | null;
    },
    enabled:
      !!user && !!courseId && hasDocuments && !!testDate && !isTestDatePast,
    staleTime: 5 * 60_000,
  });

  // ── Test date mutation ─────────────────────────────────────────────────────
  const testDateMutation = useMutation({
    mutationFn: (date: string) => updateCourseTestDate(courseId!, date),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courses", "detail", courseId],
      });
      toast.success("Exam date saved");
    },
    onError: () => toast.error("Failed to save exam date"),
  });

  // ── Generate / regenerate mutation ────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: () => generateStudyPlan(user!.id, courseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studyPlanQueryKeys.detail(courseId ?? "", user?.id ?? ""),
      });
      toast.success("Your study plan has been grown!");
    },
    onError: () =>
      toast.error("Something went wrong. The garden needs a moment."),
  });

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!user || !courseId) {
    navigate("/home");
    return null;
  }

  if (courseLoading || gardenLoading) {
    return <GardenVideoLoader message="Mapping the path ahead..." />;
  }

  const curriculum = profileData?.curriculum ?? "percentage";
  const targetGrade = course?.target_grade ?? 1.0;
  const targetLabel = getGradeLabel(curriculum, targetGrade);
  const passPercent =
    passChanceData?.pass_probability != null
      ? Math.round(passChanceData.pass_probability * 100)
      : null;
  const daysRemaining = testDate
    ? Math.max(
        0,
        Math.round(
          (new Date(testDate).getTime() -
            new Date(new Date().toDateString()).getTime()) /
            86_400_000,
        ),
      )
    : 0;
  const weakTopics = gardenData ? getWeakTopics(gardenData.topics) : [];
  const plan: StructuredPlan | null = savedPlan?.plan_json ?? null;

  return (
    <>
      <GhibliBackground />
      <Header />
      <VineDecoration />
      <div className="relative z-10 min-h-screen pt-24 pb-16">
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
              background:
                "linear-gradient(135deg, rgba(64,145,108,0.06) 0%, rgba(250,243,224,0) 70%)",
              border: "1px solid rgba(64,145,108,0.12)",
            }}
          >
            <p className="text-xs font-semibold text-[#40916C] uppercase tracking-wider mb-1">
              Study Plan
            </p>
            <h1 className="text-2xl font-bold">
              {course?.title ?? "Your Course"}
            </h1>
            {targetLabel && (
              <p className="text-sm text-muted-foreground mt-1">
                Target: {targetLabel}
              </p>
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
                  Your previous exam date (
                  {new Date(testDate).toLocaleDateString()}) has passed. Set a
                  new one to update your plan.
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
              {/* Hero row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ParchmentCard className="p-6 flex flex-col items-center text-center gap-2">
                  <Calendar className="w-6 h-6 text-[#40916C]" />
                  <p className="text-4xl font-bold text-[#1B4332]">
                    {daysRemaining}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {daysRemaining === 1 ? "day" : "days"} until your exam
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(testDate).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <button
                    className="text-xs text-muted-foreground hover:text-[#2D6A4F] mt-1 underline underline-offset-2"
                    onClick={() => {
                      queryClient.setQueryData(
                        ["courses", "detail", courseId],
                        (old: typeof course) =>
                          old ? { ...old, test_date: null } : old,
                      );
                    }}
                  >
                    Change date
                  </button>
                </ParchmentCard>

                <ParchmentCard className="p-6 flex flex-col items-center text-center gap-2">
                  <Target className="w-6 h-6 text-[#40916C]" />
                  {passPercent !== null ? (
                    <>
                      <PlantIndicator
                        probability={passPercent}
                        size="lg"
                        showPercent={true}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        growing toward {targetLabel}
                      </p>
                    </>
                  ) : (
                    <>
                      <PlantIndicator
                        probability={0}
                        size="lg"
                        showPercent={false}
                      />
                      <p className="text-xs text-muted-foreground text-center max-w-35">
                        Take your first quiz to see your pass chance
                      </p>
                    </>
                  )}
                </ParchmentCard>
              </div>

              {/* Plan header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#40916C]" />
                  <h2 className="text-base font-semibold">Your Study Plan</h2>
                </div>
                {plan && !generateMutation.isPending && (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      Generated{" "}
                      {new Date(savedPlan!.generated_at).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs text-muted-foreground hover:text-[#2D6A4F]"
                      onClick={() => generateMutation.mutate()}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Regenerate
                    </Button>
                  </div>
                )}
              </div>

              {/* Generating spinner */}
              {(generateMutation.isPending || planLoading) && (
                <ParchmentCard className="p-10 flex flex-col items-center gap-3 text-center">
                  <Loader2 className="w-7 h-7 text-[#40916C] animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Growing your plan… this takes a few seconds.
                  </p>
                </ParchmentCard>
              )}

              {/* No plan yet */}
              {!generateMutation.isPending && !planLoading && !plan && (
                <ParchmentCard className="p-10 flex flex-col items-center gap-4 text-center">
                  <img
                    src="/plant-stage-2.png"
                    alt=""
                    className="w-14 h-14 object-contain"
                    style={{ mixBlendMode: "darken" }}
                  />
                  <div>
                    <p className="text-sm font-semibold mb-1">
                      Ready to map your path?
                    </p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Claude will look at your quiz history and weak areas to
                      write a personalised plan — with quizzes for each session.
                    </p>
                  </div>
                  <Button
                    className="gap-2 shadow-[0_2px_8px_rgba(13,115,119,0.2)]"
                    onClick={() => generateMutation.mutate()}
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate My Study Plan
                  </Button>
                </ParchmentCard>
              )}

              {/* Plan: overview + sessions + tip */}
              {!generateMutation.isPending && !planLoading && plan && (
                <>
                  {/* Overview */}
                  <ParchmentCard className="p-5">
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      {plan.overview}
                    </p>
                  </ParchmentCard>

                  {/* Session cards */}
                  {plan.sessions.map((session, i) => (
                    <SessionCard
                      key={i}
                      session={session}
                      sessionIndex={i}
                      courseId={courseId}
                    />
                  ))}

                  {/* Tip */}
                  {plan.tip && (
                    <ParchmentCard className="p-5 flex gap-3 items-start">
                      <span className="text-xl shrink-0">🌸</span>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        {plan.tip}
                      </p>
                    </ParchmentCard>
                  )}
                </>
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
    </>
  );
}
