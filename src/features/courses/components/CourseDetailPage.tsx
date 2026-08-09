import { reportError } from "@/lib/sentry";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { Header } from "@/components/layout/Header";
import { VineDecoration } from "@/components/garden/VineDecoration";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  ArrowLeft,
  ClipboardCheck,
  CheckCircle2,
  FileText,
  Play,
  Leaf,
  CalendarDays,
  Sparkles,
  ChevronRight,
  FilePlus,
  Pencil,
} from "lucide-react";
import {
  fetchPassChance,
  generateQuiz,
  fetchLatestQuizGeneration,
} from "@/features/test/services/testService";
import { QuizActivationCard } from "@/features/test/components/QuizActivationCard";
import { updateCourse } from "@/features/courses/services/courseService";
import { EditCourseDialog } from "@/features/dashboard/components/EditCourseDialog";
import { courseQueryKeys, testQueryKeys, profileQueryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "@/features/settings";
import { getGradeLabel, fromDbCurriculum } from "@/lib/curricula";
import type { CourseQuiz } from "@/features/test/types";
import { QuizDetailModal } from "@/features/test/components/QuizDetailModal";

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<CourseQuiz | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: courseQueryKeys.detail(courseId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, created_at, target_grade, curriculum_type")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: docCount } = useQuery({
    queryKey: ["courses", "docs", courseId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!courseId,
  });

  const { data: passChanceData } = useQuery({
    queryKey: testQueryKeys.passChance(courseId ?? "", user?.id ?? ""),
    queryFn: () => fetchPassChance(user!.id, courseId!),
    enabled: !!user && !!courseId,
  });

  const { data: profileData } = useQuery({
    queryKey: profileQueryKeys.detail(user?.id ?? ""),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: testQueryKeys.quizzes(courseId ?? "", user?.id ?? ""),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("course_quizzes")
        .select(
          "id, name, total_questions, created_at, quiz_attempts(id, status, answered_count, correct_count, pass_chance, started_at, completed_at)",
        )
        .eq("course_id", courseId!)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CourseQuiz[];
    },
    enabled: !!user && !!courseId,
  });

  // Latest question-bank build. Polls only while it is still working, so a
  // student watching the screen sees it flip to ready without a manual reload.
  const { data: generation } = useQuery({
    queryKey: testQueryKeys.generation(courseId ?? "", user?.id ?? ""),
    queryFn: () => fetchLatestQuizGeneration(user!.id, courseId!),
    enabled: !!user && !!courseId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "generating" ? 4000 : false;
    },
  });

  if (!user || !courseId) {
    navigate("/home");
    return null;
  }

  const passPercent =
    passChanceData?.avg_mastery != null
      ? Math.round(passChanceData.avg_mastery * 100)
      : null;
  const curriculum =
    fromDbCurriculum(course?.curriculum_type) ??
    profileData?.curriculum ??
    "percentage";
  const targetGrade = course?.target_grade ?? 1.0;
  const targetLabel = getGradeLabel(curriculum, targetGrade);
  const completedCount = quizzes.filter((q) =>
    q.quiz_attempts.some((a) => a.status === "completed"),
  ).length;

  // The sitting a student generated but never opened. `quizzes` comes back
  // newest-first, so the first one with no attempts at all is the one they
  // were left staring at.
  const freshQuiz = quizzes.find((q) => (q.quiz_attempts ?? []).length === 0);

  // The activation moment. Ordered by urgency: something in flight beats a
  // failure to report, which beats a quiz waiting to be started.
  const activationState =
    generation?.status === "pending" || generation?.status === "generating"
      ? ("growing" as const)
      : generation?.status === "failed"
        ? ("failed" as const)
        : freshQuiz
          ? ("ready" as const)
          : null;

  // While the activation card is showing it owns the only button on screen.
  // The hero's four equal-weight CTAs are what the student bounced off, so
  // they drop to text links until the quiz has been started.
  const demoteHeroCtas = activationState !== null;

  const handleGenerateQuiz = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const result = await generateQuiz(user.id, courseId);
      queryClient.invalidateQueries({
        queryKey: testQueryKeys.quizzes(courseId, user.id),
      });
      queryClient.invalidateQueries({
        queryKey: testQueryKeys.generation(courseId, user.id),
      });
      // Navigate to TestPage to start the quiz immediately
      navigate(`/test/${courseId}?quiz=${result.quiz_id}`);
    } catch (err) {
      reportError("Quiz generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartQuiz = (quizId: string) => {
    navigate(`/test/${courseId}?quiz=${quizId}`);
  };

  const handleResumeQuiz = (quizId: string, attemptId: string) => {
    navigate(`/test/${courseId}?quiz=${quizId}&attempt=${attemptId}`);
  };

  const handleOpenQuizModal = (quiz: CourseQuiz) => {
    setSelectedQuiz(quiz);
    setModalOpen(true);
  };

  const handleSaveCourse = async (
    id: string,
    title: string,
    description: string,
    targetGrade?: number,
    curriculumType?: string | null,
  ) => {
    await updateCourse(id, { title, description, targetGrade, curriculumType });
    queryClient.invalidateQueries({ queryKey: courseQueryKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: courseQueryKeys.curriculum(id) });
    queryClient.invalidateQueries({ queryKey: testQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  if (generating) {
    return <GardenVideoLoader message="Growing your questions..." />;
  }

  if (courseLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden">
        <video
          src="/garden-loader.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-ghibli-canopy/20" />
        <div className="relative z-10 text-center pb-16 space-y-3">
          <p className="text-white text-base font-medium tracking-wide text-shadow-hero">
            Tending the garden...
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <>
        <GhibliBackground />
        <Header />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
            <p className="text-sm text-ghibli-bark">Course not found</p>
            <Button variant="outline" onClick={() => navigate("/home")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <GhibliBackground />
      <Header />
      <VineDecoration />
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-6 md:pt-8 pb-8 md:pb-16">
        {/* Back link */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-1.5 text-sm font-sans text-ghibli-forest hover:text-ghibli-forest transition-colors mb-4 md:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Hero — oasis two-column pattern */}
        <ParchmentCard className="p-5 md:p-12 mb-6 md:mb-10 overflow-hidden" glow>
          <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
            <div className="text-center md:text-left order-2 md:order-1">
              <span className="inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest mb-3 px-3 py-1 rounded-full bg-ghibli-mist/60">
                Your Garden
              </span>
              <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                <h1 className="font-serif text-4xl md:text-5xl font-semibold text-ghibli-canopy leading-tight">
                  {course.title}
                </h1>
                <button
                  onClick={() => setEditOpen(true)}
                  aria-label="Edit course settings"
                  className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full text-ghibli-forest hover:text-ghibli-forest hover:bg-ghibli-ivory/60 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              {course.description && (
                <p className="font-sans text-base text-ghibli-bark leading-relaxed mb-4 max-w-md mx-auto md:mx-0">
                  {course.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm font-sans text-ghibli-bark mb-4 md:mb-6 justify-center md:justify-start">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {docCount ?? 0}{" "}
                  {(docCount ?? 0) === 1 ? "document" : "documents"}
                </span>
                <span className="flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4" />
                  {completedCount} {completedCount === 1 ? "quiz" : "quizzes"}{" "}
                  completed
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Target: {targetLabel}
                </span>
              </div>
              {demoteHeroCtas ? (
                /* Activation moment — the card below carries the only button.
                   These stay reachable, but as links, so nothing competes. */
                <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center md:justify-start font-sans text-sm">
                  <button
                    onClick={() => navigate(`/course/${courseId}/garden`)}
                    disabled={!docCount || docCount === 0}
                    className="inline-flex items-center gap-1.5 py-1 text-ghibli-forest hover:text-ghibli-canopy hover:underline transition-colors disabled:opacity-40 disabled:hover:no-underline"
                  >
                    <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
                    Knowledge Garden
                  </button>
                  <button
                    onClick={() => navigate(`/course/${courseId}/study-plan`)}
                    disabled={!docCount || docCount === 0}
                    className="inline-flex items-center gap-1.5 py-1 text-ghibli-forest hover:text-ghibli-canopy hover:underline transition-colors disabled:opacity-40 disabled:hover:no-underline"
                  >
                    <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                    Study Plan
                  </button>
                  <button
                    onClick={() => navigate(`/documents?courseId=${courseId}`)}
                    className="inline-flex items-center gap-1.5 py-1 text-ghibli-forest hover:text-ghibli-canopy hover:underline transition-colors"
                  >
                    <FilePlus className="w-3.5 h-3.5" aria-hidden="true" />
                    Add materials
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Button
                    size="lg"
                    onClick={handleGenerateQuiz}
                    disabled={!docCount || docCount === 0}
                    className="gap-2 rounded-full px-8 py-6 text-base font-semibold bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-lg hover:shadow-glow transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    {quizzes.length > 0 ? "Generate New Quiz" : "Begin Growing"}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate(`/course/${courseId}/garden`)}
                    disabled={!docCount || docCount === 0}
                    className="gap-2 rounded-full px-6 py-6 border-ghibli-moss/40 text-ghibli-canopy hover:border-ghibli-forest hover:text-ghibli-forest hover:bg-ghibli-ivory/60"
                  >
                    <Leaf className="w-4 h-4" />
                    Knowledge Garden
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate(`/course/${courseId}/study-plan`)}
                    disabled={!docCount || docCount === 0}
                    className="gap-2 rounded-full px-6 py-6 border-ghibli-moss/40 text-ghibli-canopy hover:border-ghibli-forest hover:text-ghibli-forest hover:bg-ghibli-ivory/60"
                  >
                    <CalendarDays className="w-4 h-4" />
                    Study Plan
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate(`/documents?courseId=${courseId}`)}
                    className="gap-2 rounded-full px-6 py-6 border-ghibli-moss/40 text-ghibli-canopy hover:border-ghibli-forest hover:text-ghibli-forest hover:bg-ghibli-ivory/60"
                  >
                    <FilePlus className="w-4 h-4" />
                    Add materials
                  </Button>
                </div>
              )}
            </div>
            <div className="order-1 md:order-2 flex flex-col items-center gap-2">
              {passPercent !== null ? (
                <>
                  <PlantIndicator
                    probability={passPercent}
                    size="xl"
                    glow
                    showPercent
                  />
                  <p className="font-sans text-xs text-ghibli-bark italic">
                    growing toward {targetLabel}
                  </p>
                </>
              ) : (
                <>
                  <PlantIndicator
                    probability={0}
                    size="xl"
                    showPercent={false}
                  />
                  <p className="font-sans text-xs text-ghibli-bark italic max-w-56 text-center leading-relaxed">
                    Generate a quiz to see your garden
                  </p>
                </>
              )}
            </div>
          </div>
        </ParchmentCard>

        {/* Activation moment — quiz generated, not yet started. One action. */}
        {activationState && (
          <QuizActivationCard
            state={activationState}
            totalQuestions={freshQuiz?.total_questions}
            onBegin={() =>
              freshQuiz && navigate(`/test/${courseId}?quiz=${freshQuiz.id}`)
            }
            onRetry={handleGenerateQuiz}
            retrying={generating}
          />
        )}

        {/* First-quiz banner — only when nothing has been generated at all */}
        {!activationState && docCount && docCount > 0 && quizzes.length === 0 && (
          <ParchmentCard className="p-5 md:p-6 mb-4 md:mb-6 flex flex-col sm:flex-row items-center gap-5">
            <img
              src="/plant-stage-1.webp"
              alt=""
              className="w-14 h-14 object-contain shrink-0 animate-pulse-soft"
              style={{ mixBlendMode: "darken" }}
            />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-serif text-lg font-semibold text-ghibli-canopy">
                Your garden soil is ready
              </p>
              <p className="font-sans text-sm text-ghibli-bark mt-0.5">
                Your material has been processed. Generate your first quiz to
                start tracking mastery.
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleGenerateQuiz}
              className="gap-2 shrink-0 rounded-full px-6 py-5 font-semibold bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-md hover:shadow-glow transition-all"
            >
              <Play className="w-4 h-4" />
              Generate First Quiz
            </Button>
          </ParchmentCard>
        )}

        {/* Quizzes list */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles
              className="w-5 h-5 text-ghibli-jungle"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold text-ghibli-canopy">
              Quizzes
            </h2>
          </div>

          {quizzesLoading ? (
            <div className="flex items-center justify-center py-6 md:py-12">
              <p className="text-sm text-ghibli-bark animate-pulse">
                Reading the garden path…
              </p>
            </div>
          ) : quizzes.length === 0 ? (
            <Card className="rounded-2xl border-t-2 border-ghibli-moss/15">
              <CardContent className="py-6 md:py-12 text-center">
                <img
                  src="/plant-stage-1.webp"
                  alt=""
                  className="w-16 h-16 object-contain mx-auto mb-3"
                  style={{ mixBlendMode: "darken" }}
                />
                <p className="text-sm text-ghibli-bark">
                  No quizzes yet. Generate your first one above!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onClick={() => handleOpenQuizModal(quiz)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quiz detail modal */}
      <QuizDetailModal
        quiz={selectedQuiz}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStart={handleStartQuiz}
        onResume={handleResumeQuiz}
      />

      <EditCourseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        course={{
          id: course.id,
          title: course.title,
          description: course.description ?? null,
          targetGrade: course.target_grade ?? 1.0,
          curriculumType: fromDbCurriculum(course.curriculum_type),
        }}
        curriculum={profileData?.curriculum ?? "percentage"}
        onSave={handleSaveCourse}
      />
    </>
  );
}

function QuizCard({
  quiz,
  onClick,
}: {
  quiz: CourseQuiz;
  onClick: () => void;
}) {
  const completedAttempts = (quiz.quiz_attempts ?? []).filter(
    (a) => a.status === "completed",
  );
  const hasCompleted = completedAttempts.length > 0;

  // Best score across all completed attempts
  const bestScore = hasCompleted
    ? Math.max(
        ...completedAttempts.map((a) =>
          quiz.total_questions > 0
            ? Math.round((a.correct_count / quiz.total_questions) * 100)
            : 0,
        ),
      )
    : null;

  const formattedDate = new Date(quiz.created_at).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    },
  );

  return (
    <Card
      className={`group rounded-xl overflow-hidden transition-all duration-200 hover:shadow-[0_4px_20px_hsl(var(--ghibli-canopy)/0.10)] hover:border-ghibli-moss/45 cursor-pointer border-l-[3px] ${
        hasCompleted ? "border-l-ghibli-moss/55" : "border-l-ghibli-moss/20"
      }`}
      onClick={onClick}
    >
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-4">
          {/* Status icon */}
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
              hasCompleted
                ? "bg-ghibli-moss/12 text-ghibli-jungle group-hover:bg-ghibli-moss/20"
                : "bg-ghibli-moss/8 text-ghibli-forest group-hover:bg-ghibli-moss/12"
            }`}
          >
            {hasCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{quiz.name}</p>
            <p className="text-xs text-ghibli-bark mt-0.5">
              {formattedDate} &middot; {quiz.total_questions} questions
              {hasCompleted && (
                <>
                  {" "}
                  &middot; {completedAttempts.length}{" "}
                  {completedAttempts.length === 1 ? "attempt" : "attempts"}
                </>
              )}
            </p>
          </div>

          {/* Best score + chevron */}
          <div className="flex items-center gap-2 shrink-0">
            {bestScore !== null && (
              <span className="text-sm font-bold text-ghibli-jungle">
                {bestScore}%
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-ghibli-forest transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ghibli-canopy" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
