import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { Header } from "@/components/layout/Header";
import { VineDecoration } from "@/components/garden/VineDecoration";
import { Neko } from "@/components/garden/Neko";
import { GardenInlineIcon } from "@/components/garden/GardenIcons";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import GhibliBackground from "@/components/garden/GhibliBackground";
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
} from "lucide-react";
import { fetchPassChance, generateQuiz } from "@/features/test/services/testService";
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
        .select("id, name, total_questions, created_at, quiz_attempts(id, status, answered_count, correct_count, pass_chance, started_at, completed_at)")
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
    q.quiz_attempts.some((a) => a.status === "completed")
  ).length;

  const handleGenerateQuiz = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const result = await generateQuiz(user.id, courseId);
      queryClient.invalidateQueries({ queryKey: testQueryKeys.quizzes(courseId, user.id) });
      // Navigate to TestPage to start the quiz immediately
      navigate(`/test/${courseId}?quiz=${result.quiz_id}`);
    } catch (err) {
      console.error("Quiz generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartQuiz = (quizId: string) => {
    navigate(`/test/${courseId}?quiz=${quizId}`);
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
        <div
          className="absolute inset-0"
          style={{ background: "rgba(27,67,50,0.18)" }}
        />
        <div className="relative z-10 text-center pb-16 space-y-3">
          <p
            className="text-white text-base font-medium tracking-wide"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
          >
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
            <p className="text-sm text-muted-foreground">Course not found</p>
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
      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          {/* Back link */}
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#2D6A4F] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          {/* Course header */}
          <div
            className="mb-8 p-5 rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(64,145,108,0.06) 0%, rgba(250,243,224,0) 70%)",
              border: "1px solid rgba(64,145,108,0.12)",
            }}
          >
            <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
            {course.description && (
              <p className="text-muted-foreground">{course.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                {docCount ?? 0}{" "}
                {(docCount ?? 0) === 1 ? "document" : "documents"}
              </span>
              <span className="flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4" />
                {completedCount}{" "}
                {completedCount === 1 ? "quiz" : "quizzes"} completed
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-[rgba(64,145,108,0.3)] hover:border-[#40916C] hover:text-[#1B4332]"
                onClick={() => navigate(`/course/${courseId}/garden`)}
                disabled={!docCount || docCount === 0}
              >
                <Leaf className="w-4 h-4" />
                View Knowledge Garden
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-[rgba(64,145,108,0.3)] hover:border-[#40916C] hover:text-[#1B4332]"
                onClick={() => navigate(`/course/${courseId}/study-plan`)}
                disabled={!docCount || docCount === 0}
              >
                <CalendarDays className="w-4 h-4" />
                Study Plan
              </Button>
            </div>
          </div>

          {/* First-quiz banner */}
          {docCount && docCount > 0 && quizzes.length === 0 && (
            <div
              className="rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center gap-5"
              style={{
                background: "linear-gradient(135deg, rgba(64,145,108,0.10) 0%, rgba(250,243,224,0.4) 100%)",
                border: "1.5px solid rgba(64,145,108,0.25)",
              }}
            >
              <img
                src="/plant-stage-1.png"
                alt=""
                className="w-14 h-14 object-contain shrink-0"
                style={{ mixBlendMode: "darken" }}
              />
              <div className="flex-1 text-center sm:text-left">
                <p className="font-serif text-base font-semibold text-[#1B4332]">
                  Your garden soil is ready
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your material has been processed. Generate your first quiz to start tracking mastery.
                </p>
              </div>
              <Button
                size="lg"
                className="gap-2 shrink-0 shadow-[0_4px_12px_rgba(13,115,119,0.2)]"
                onClick={handleGenerateQuiz}
              >
                <Play className="w-4 h-4" />
                Generate First Quiz
              </Button>
            </div>
          )}

          {/* Pass chance + Generate quiz */}
          <Card
            className="rounded-2xl overflow-hidden mb-8"
            style={{ borderTop: "3px solid rgba(64,145,108,0.3)" }}
          >
            <CardContent className="pt-8 pb-8 px-8">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="flex flex-col items-center text-center shrink-0">
                  <p className="text-xs font-semibold text-[#40916C] uppercase tracking-wider mb-3">
                    Your Garden
                  </p>
                  {passPercent !== null ? (
                    <>
                      <PlantIndicator probability={passPercent} size="lg" showPercent={true} />
                      <p className="text-xs text-muted-foreground mt-2">
                        growing toward {targetLabel}
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <PlantIndicator probability={0} size="lg" showPercent={false} />
                      <p className="text-xs text-muted-foreground text-center leading-tight max-w-30">
                        Generate a quiz to see your garden
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center sm:items-start gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {quizzes.length > 0 ? "Keep Tending" : "Plant Your First Seeds"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {quizzes.length > 0
                        ? "Each quiz generates 10 fresh questions tailored to your weakest areas."
                        : "Generate a quiz to plant seeds and see what grows."}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="gap-2 shadow-[0_4px_12px_rgba(13,115,119,0.2)]"
                    onClick={handleGenerateQuiz}
                    disabled={!docCount || docCount === 0}
                  >
                    <Sparkles className="w-4 h-4" />
                    {quizzes.length > 0 ? "Generate New Quiz" : "Begin Growing"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quizzes list */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GardenInlineIcon type="blossom" size={22} />
              <h2 className="text-lg font-semibold">Quizzes</h2>
            </div>

            {quizzesLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground animate-pulse">
                  Reading the garden path…
                </p>
              </div>
            ) : quizzes.length === 0 ? (
              <Card
                className="rounded-2xl"
                style={{ borderTop: "2px solid rgba(64,145,108,0.12)" }}
              >
                <CardContent className="py-12 text-center">
                  <img
                    src="/plant-stage-1.png"
                    alt=""
                    className="w-16 h-16 object-contain mx-auto mb-3"
                    style={{ mixBlendMode: "darken" }}
                  />
                  <p className="text-sm text-muted-foreground">
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

          <div className="flex justify-end mt-10 mb-4 pr-2 opacity-50 hover:opacity-80 transition-opacity duration-500">
            <div style={{ transform: "scaleX(-1) rotate(-8deg)" }}>
              <Neko />
            </div>
          </div>
        </div>
      </div>

      {/* Quiz detail modal */}
      <QuizDetailModal
        quiz={selectedQuiz}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStart={handleStartQuiz}
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

  const formattedDate = new Date(quiz.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <Card
      className="group rounded-xl overflow-hidden transition-all duration-200 hover:shadow-[0_4px_20px_rgba(27,67,50,0.10)] hover:border-[rgba(64,145,108,0.3)] cursor-pointer"
      style={{
        borderLeft: hasCompleted
          ? "3px solid rgba(64,145,108,0.4)"
          : "3px solid rgba(64,145,108,0.15)",
      }}
      onClick={onClick}
    >
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-4">
          {/* Status icon */}
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
              hasCompleted
                ? "bg-[rgba(64,145,108,0.1)] text-[#2D6A4F] group-hover:bg-[rgba(64,145,108,0.18)]"
                : "bg-[rgba(64,145,108,0.05)] text-[#40916C] group-hover:bg-[rgba(64,145,108,0.10)]"
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
            <p className="text-xs text-muted-foreground mt-0.5">
              {formattedDate} &middot; {quiz.total_questions} questions
              {hasCompleted && (
                <>
                  {" "}&middot;{" "}
                  {completedAttempts.length}{" "}
                  {completedAttempts.length === 1 ? "attempt" : "attempts"}
                </>
              )}
            </p>
          </div>

          {/* Best score + chevron */}
          <div className="flex items-center gap-2 shrink-0">
            {bestScore !== null && (
              <span className="text-sm font-bold text-[#2D6A4F]">{bestScore}%</span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
