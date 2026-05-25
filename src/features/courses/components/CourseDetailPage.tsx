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
} from "lucide-react";
import {
  fetchPassChance,
  generateQuiz,
} from "@/features/test/services/testService";
import { testQueryKeys, profileQueryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "@/features/settings";
import { getGradeLabel } from "@/lib/curricula";
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

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["courses", "detail", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, created_at, target_grade")
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

  if (!user || !courseId) {
    navigate("/home");
    return null;
  }

  const passPercent =
    passChanceData?.avg_mastery != null
      ? Math.round(passChanceData.avg_mastery * 100)
      : null;
  const curriculum = profileData?.curriculum ?? "percentage";
  const targetGrade = course?.target_grade ?? 1.0;
  const targetLabel = getGradeLabel(curriculum, targetGrade);
  const completedCount = quizzes.filter((q) =>
    q.quiz_attempts.some((a) => a.status === "completed"),
  ).length;

  const handleGenerateQuiz = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const result = await generateQuiz(user.id, courseId);
      queryClient.invalidateQueries({
        queryKey: testQueryKeys.quizzes(courseId, user.id),
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
          className="flex items-center gap-1.5 text-sm font-sans text-ghibli-canopy-medium hover:text-ghibli-forest transition-colors mb-4 md:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Hero — oasis two-column pattern */}
        <ParchmentCard className="p-5 md:p-12 mb-6 md:mb-10 overflow-hidden" glow>
          <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
            <div className="text-center md:text-left order-2 md:order-1">
              <span className="inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-moss mb-3 px-3 py-1 rounded-full bg-ghibli-mist/60">
                Your Garden
              </span>
              <h1 className="font-serif text-4xl md:text-5xl font-semibold text-ghibli-canopy leading-tight mb-4">
                {course.title}
              </h1>
              {course.description && (
                <p className="font-sans text-base text-ghibli-bark-strong leading-relaxed mb-4 max-w-md mx-auto md:mx-0">
                  {course.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm font-sans text-ghibli-bark-medium mb-4 md:mb-6 justify-center md:justify-start">
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
              </div>
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
                  <p className="font-sans text-xs text-ghibli-bark-strong italic">
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
                  <p className="font-sans text-xs text-ghibli-bark-medium italic max-w-56 text-center leading-relaxed">
                    Generate a quiz to see your garden
                  </p>
                </>
              )}
            </div>
          </div>
        </ParchmentCard>

        {/* First-quiz banner */}
        {docCount && docCount > 0 && quizzes.length === 0 && (
          <ParchmentCard className="p-5 md:p-6 mb-4 md:mb-6 flex flex-col sm:flex-row items-center gap-5">
            <img
              src="/plant-stage-1.png"
              alt=""
              className="w-14 h-14 object-contain shrink-0 animate-pulse-soft"
              style={{ mixBlendMode: "darken" }}
            />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-serif text-lg font-semibold text-ghibli-canopy">
                Your garden soil is ready
              </p>
              <p className="font-sans text-sm text-ghibli-bark-strong mt-0.5">
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
                  src="/plant-stage-1.png"
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
                : "bg-ghibli-moss/8 text-ghibli-moss group-hover:bg-ghibli-moss/12"
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
            <ChevronRight className="w-4 h-4 text-ghibli-canopy-medium transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ghibli-canopy" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
