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
  Clock,
  CheckCircle2,
  FileText,
  Play,
  Leaf,
  CalendarDays,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { fetchPassChance, generateQuiz } from "@/features/test/services/testService";
import { testQueryKeys, profileQueryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "@/features/settings";
import { getGradeLabel } from "@/lib/curricula";
import { getGardenStatus } from "@/lib/garden";
import type { CourseQuiz, QuizAttemptSummary } from "@/features/test/types";

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

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

  const handleResumeQuiz = (quizId: string, attemptId: string) => {
    navigate(`/test/${courseId}?quiz=${quizId}&attempt=${attemptId}`);
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
      <div className="relative z-10 min-h-screen pt-24 pb-16">
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
                    onStart={handleStartQuiz}
                    onResume={handleResumeQuiz}
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
    </>
  );
}

function QuizCard({
  quiz,
  onStart,
  onResume,
}: {
  quiz: CourseQuiz;
  onStart: (quizId: string) => void;
  onResume: (quizId: string, attemptId: string) => void;
}) {
  const attempts = quiz.quiz_attempts ?? [];
  const inProgressAttempt = attempts.find((a) => a.status === "in_progress");
  const completedAttempts = attempts.filter((a) => a.status === "completed");
  const latestCompleted = completedAttempts[0] ?? null;

  const hasAttempts = attempts.length > 0;
  const scorePercent =
    latestCompleted && quiz.total_questions > 0
      ? Math.round((latestCompleted.correct_count / quiz.total_questions) * 100)
      : null;

  const date = new Date(quiz.created_at);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <Card
      className="rounded-xl overflow-hidden transition-all duration-150 hover:shadow-[0_4px_16px_rgba(27,67,50,0.08)] cursor-pointer"
      style={{
        borderLeft: inProgressAttempt
          ? "3px solid rgba(245,158,11,0.4)"
          : latestCompleted
          ? "3px solid rgba(64,145,108,0.4)"
          : "3px solid rgba(64,145,108,0.15)",
      }}
      onClick={() => {
        if (inProgressAttempt) {
          onResume(quiz.id, inProgressAttempt.id);
        } else {
          onStart(quiz.id);
        }
      }}
    >
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
              inProgressAttempt
                ? "bg-amber-500/10 text-amber-600"
                : latestCompleted
                ? "bg-[rgba(64,145,108,0.1)] text-[#2D6A4F]"
                : "bg-[rgba(64,145,108,0.05)] text-[#40916C]"
            }`}
          >
            {inProgressAttempt ? (
              <Clock className="w-5 h-5" />
            ) : latestCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold truncate">{quiz.name}</p>
              {inProgressAttempt && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium shrink-0">
                  In Progress
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formattedDate} &middot; {quiz.total_questions} questions
              {completedAttempts.length > 0 && (
                <> &middot; {completedAttempts.length} {completedAttempts.length === 1 ? "attempt" : "attempts"}</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {inProgressAttempt && (
              <p className="text-xs text-muted-foreground">
                {inProgressAttempt.answered_count}/{quiz.total_questions} answered
              </p>
            )}
            {scorePercent !== null && !inProgressAttempt && (
              <div className="text-right">
                <p className="text-sm font-bold">
                  {latestCompleted!.correct_count}/{quiz.total_questions}
                </p>
                <p className={`text-xs font-medium ${getGardenStatus(scorePercent).color}`}>
                  {getGardenStatus(scorePercent).label}
                </p>
              </div>
            )}
            <Button
              size="sm"
              variant={inProgressAttempt ? "outline" : hasAttempts ? "ghost" : "default"}
              className={
                inProgressAttempt
                  ? "gap-1.5 border-[rgba(64,145,108,0.3)] hover:border-[#40916C] hover:text-[#1B4332]"
                  : hasAttempts
                  ? "gap-1.5"
                  : "gap-1.5"
              }
              onClick={(e) => {
                e.stopPropagation();
                if (inProgressAttempt) {
                  onResume(quiz.id, inProgressAttempt.id);
                } else {
                  onStart(quiz.id);
                }
              }}
            >
              {inProgressAttempt ? (
                <><Play className="w-3.5 h-3.5" />Resume</>
              ) : hasAttempts ? (
                <><RotateCcw className="w-3.5 h-3.5" />Retake</>
              ) : (
                <><Play className="w-3.5 h-3.5" />Start</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
