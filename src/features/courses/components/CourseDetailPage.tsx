import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  FileText,
  Play,
} from "lucide-react";
import {
  fetchPassChance,
  fetchTestHistory,
} from "@/features/test/services/testService";
import { testQueryKeys, profileQueryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "@/features/settings";
import { getGradeLabel } from "@/lib/curricula";
import type { TestSession } from "@/features/test/types";

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch course info
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

  // Fetch document count
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

  // Fetch pass chance
  const { data: passChanceData } = useQuery({
    queryKey: testQueryKeys.passChance(courseId ?? "", user?.id ?? ""),
    queryFn: () => fetchPassChance(user!.id, courseId!),
    enabled: !!user && !!courseId,
  });

  // Fetch user profile for curriculum
  const { data: profileData } = useQuery({
    queryKey: profileQueryKeys.detail(user?.id ?? ""),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  // Fetch quiz history
  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: testQueryKeys.history(courseId ?? "", user?.id ?? ""),
    queryFn: () => fetchTestHistory(user!.id, courseId!),
    enabled: !!user && !!courseId,
  });

  if (!user || !courseId) {
    navigate("/home");
    return null;
  }

  const passPercent =
    passChanceData?.pass_probability != null
      ? Math.round(passChanceData.pass_probability * 100)
      : null;

  const curriculum = profileData?.curriculum ?? "percentage";
  const targetGrade = course?.target_grade ?? 1.0;
  const targetLabel = getGradeLabel(curriculum, targetGrade);

  const sessions = historyData?.sessions ?? [];
  const completedSessions = sessions.filter((s) => s.status === "completed");

  const handleStartQuiz = () => {
    // Clear cached quiz so a fresh one is generated
    queryClient.removeQueries({
      queryKey: testQueryKeys.quiz(courseId, user.id),
    });
    navigate(`/test/${courseId}`);
  };

  const handleResumeQuiz = (sessionId: string) => {
    navigate(`/test/${courseId}?session=${sessionId}`);
  };

  if (courseLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
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
      <Header />
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          {/* Back link */}
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          {/* Course header */}
          <div className="mb-8">
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
                {completedSessions.length}{" "}
                {completedSessions.length === 1 ? "quiz" : "quizzes"} completed
              </span>
            </div>
          </div>

          {/* Pass chance + Start quiz */}
          <Card className="rounded-2xl overflow-hidden mb-8">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Pass chance display */}
                <div className="flex flex-col items-center text-center">
                  {passPercent !== null ? (
                    <>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Passing Chance
                      </p>
                      <CircularProgress
                        value={passPercent}
                        size={120}
                        strokeWidth={10}
                        labelClassName="text-2xl font-bold"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        of hitting {targetLabel}
                      </p>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground italic">
                        Take a quiz to see your passing chance
                      </p>
                    </div>
                  )}
                </div>

                {/* Start quiz */}
                <div className="flex-1 flex flex-col items-center sm:items-start gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {sessions.length > 0
                        ? "Keep Practicing"
                        : "Start Testing"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {sessions.length > 0
                        ? "Each quiz helps improve your passing chance estimate. More quizzes = more accurate."
                        : "Take your first quiz to start tracking your mastery of this material."}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={handleStartQuiz}
                    disabled={!docCount || docCount === 0}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    {sessions.length > 0 ? "Start New Quiz" : "Take Quiz"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiz History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Quiz History</h2>
              {sessions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchHistory()}
                  className="gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
              )}
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="py-12 text-center">
                  <ClipboardCheck className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No quizzes taken yet. Start your first quiz above!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, idx) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    number={sessions.length - idx}
                    onResume={
                      session.status === "in_progress"
                        ? handleResumeQuiz
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SessionCard({
  session,
  number,
  onResume,
}: {
  session: TestSession;
  number: number;
  onResume?: (sessionId: string) => void;
}) {
  const isCompleted = session.status === "completed";
  const scorePercent =
    session.total_questions > 0
      ? Math.round((session.correct_count / session.total_questions) * 100)
      : 0;
  const passPercent =
    session.pass_chance != null ? Math.round(session.pass_chance * 100) : null;

  const date = new Date(session.created_at);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card className="rounded-xl overflow-hidden">
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-4">
          {/* Status icon */}
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Quiz #{number}</p>
              {!isCompleted && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                  In Progress
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formattedDate} at {formattedTime}
            </p>
          </div>

          {/* Score */}
          {isCompleted && (
            <div className="text-right shrink-0">
              <p className="text-sm font-bold">
                {session.correct_count}/{session.total_questions}
              </p>
              <p className="text-xs text-muted-foreground">
                {scorePercent}% score
              </p>
              {passPercent !== null && (
                <p
                  className={`text-xs font-medium ${
                    passPercent >= 70
                      ? "text-emerald-600 dark:text-emerald-400"
                      : passPercent >= 40
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {passPercent}% pass
                </p>
              )}
            </div>
          )}

          {/* In-progress score + resume */}
          {!isCompleted && (
            <div className="flex items-center gap-3 shrink-0">
              <p className="text-xs text-muted-foreground">
                {session.answered_count}/{session.total_questions} answered
              </p>
              {onResume && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => onResume(session.id)}
                >
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
