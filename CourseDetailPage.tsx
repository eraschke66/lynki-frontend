import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { VineDecoration } from "@/components/garden/VineDecoration";
import { Neko } from "@/components/garden/Neko";
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
import { fetchPassChance, fetchTestHistory } from "@/features/test/services/testService";
import { testQueryKeys, profileQueryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "@/features/settings";
import { getGradeLabel } from "@/lib/curricula";
import { getGardenStatus } from "@/lib/garden";
import type { TestSession } from "@/features/test/types";

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: testQueryKeys.history(courseId ?? "", user?.id ?? ""),
    queryFn: () => fetchTestHistory(user!.id, courseId!),
    enabled: !!user && !!courseId,
  });

  if (!user || !courseId) { navigate("/home"); return null; }

  const passPercent = passChanceData?.pass_probability != null
    ? Math.round(passChanceData.pass_probability * 100)
    : null;
  const curriculum = profileData?.curriculum ?? "percentage";
  const targetGrade = course?.target_grade ?? 1.0;
  const targetLabel = getGradeLabel(curriculum, targetGrade);
  const sessions = historyData?.sessions ?? [];
  const completedSessions = sessions.filter((s) => s.status === "completed");

  const handleStartQuiz = () => {
    queryClient.removeQueries({ queryKey: testQueryKeys.quiz(courseId, user.id) });
    navigate(`/test/${courseId}`);
  };

  const handleResumeQuiz = (sessionId: string) => {
    navigate(`/test/${courseId}?session=${sessionId}`);
  };

  if (courseLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden" style={{ background: "hsl(38 48% 87%)" }}>
        <video src="/garden-loader.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "rgba(27,67,50,0.18)" }} />
        <div className="relative z-10 text-center pb-16 space-y-3">
          <p className="text-white text-base font-medium tracking-wide" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            Tending the garden...
          </p>
        </div>
      </div>
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
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <VineDecoration />
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">

          {/* Back link */}
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#2D6A4F] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          {/* Course header with garden accent */}
          <div
            className="mb-8 p-5 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(64,145,108,0.06) 0%, rgba(250,243,224,0) 70%)",
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
                {docCount ?? 0} {(docCount ?? 0) === 1 ? "document" : "documents"}
              </span>
              <span className="flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4" />
                {completedSessions.length} {completedSessions.length === 1 ? "quiz" : "quizzes"} completed
              </span>
            </div>
          </div>

          {/* Pass chance + Start quiz */}
          <Card
            className="rounded-2xl overflow-hidden mb-8"
            style={{ borderTop: "3px solid rgba(64,145,108,0.3)" }}
          >
            <CardContent className="pt-8 pb-8 px-8">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Garden status ring */}
                <div className="flex flex-col items-center text-center">
                  {passPercent !== null ? (
                    <>
                      <p className="text-xs font-semibold text-[#40916C] uppercase tracking-wider mb-3">
                        Your Garden
                      </p>
                      <CircularProgress
                        value={passPercent}
                        size={120}
                        strokeWidth={10}
                        labelClassName="text-2xl font-bold"
                      />
                      <p className={`text-sm font-medium mt-2 ${getGardenStatus(passPercent).color}`}>
                        {getGardenStatus(passPercent).label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        growing toward {targetLabel}
                      </p>
                    </>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center w-24 h-24 rounded-full text-3xl"
                      style={{ background: "rgba(64,145,108,0.07)", border: "2px dashed rgba(64,145,108,0.2)" }}
                    >
                      <img src="/plant-seedling-raw.png" alt="" className="w-20 h-20 object-contain" style={{ mixBlendMode: "darken" }} />
                      <p className="text-xs text-muted-foreground mt-2 text-center leading-tight max-w-[120px]">
                        Walk the path to see your garden
                      </p>
                    </div>
                  )}
                </div>

                {/* Start quiz */}
                <div className="flex-1 flex flex-col items-center sm:items-start gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {sessions.length > 0 ? "Keep Tending" : "Plant Your First Seeds"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {sessions.length > 0
                        ? "Each time you walk the path, your garden reveals more."
                        : "Take your first quiz to plant seeds and see what grows."}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="gap-2 shadow-[0_4px_12px_rgba(13,115,119,0.2)]"
                    onClick={handleStartQuiz}
                    disabled={!docCount || docCount === 0}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    {sessions.length > 0 ? "Walk the Path" : "Begin Growing"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiz History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span>🌺</span>
                <h2 className="text-lg font-semibold">Quiz History</h2>
              </div>
              {sessions.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => refetchHistory()} className="gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
              )}
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <Card className="rounded-2xl" style={{ borderTop: "2px dashed rgba(64,145,108,0.2)" }}>
                <CardContent className="py-12 text-center">
                  <div className="text-3xl mb-3"><img src="/plant-seedling-raw.png" alt="" className="w-16 h-16 object-contain mx-auto" style={{ mixBlendMode: "darken" }} /></div>
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
                    onResume={session.status === "in_progress" ? handleResumeQuiz : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Neko cat - tucked into bottom-right corner of content */}
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

function SessionCard({ session, number, onResume }: {
  session: TestSession;
  number: number;
  onResume?: (sessionId: string) => void;
}) {
  const isCompleted = session.status === "completed";
  const scorePercent = session.total_questions > 0
    ? Math.round((session.correct_count / session.total_questions) * 100)
    : 0;
  const passPercent = session.pass_chance != null
    ? Math.round(session.pass_chance * 100)
    : null;

  const date = new Date(session.created_at);
  const formattedDate = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const formattedTime = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <Card
      className="rounded-xl overflow-hidden transition-all duration-150 hover:shadow-[0_4px_16px_rgba(27,67,50,0.08)]"
      style={{ borderLeft: isCompleted ? "3px solid rgba(64,145,108,0.4)" : "3px solid rgba(245,158,11,0.4)" }}
    >
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
            isCompleted
              ? "bg-[rgba(64,145,108,0.1)] text-[#2D6A4F]"
              : "bg-amber-500/10 text-amber-600"
          }`}>
            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Quiz #{number}</p>
              {!isCompleted && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
                  In Progress
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formattedDate} at {formattedTime}
            </p>
          </div>

          {isCompleted && (
            <div className="text-right shrink-0">
              <p className="text-sm font-bold">
                {session.correct_count}/{session.total_questions}
              </p>
              <p className="text-xs text-muted-foreground">{scorePercent}% score</p>
              {passPercent !== null && (
                <p className={`text-xs font-medium ${getGardenStatus(passPercent).color}`}>
                  {getGardenStatus(passPercent).label}
                </p>
              )}
            </div>
          )}

          {!isCompleted && (
            <div className="flex items-center gap-3 shrink-0">
              <p className="text-xs text-muted-foreground">
                {session.answered_count}/{session.total_questions} answered
              </p>
              {onResume && (
                <Button size="sm" variant="outline" className="gap-1.5 border-[rgba(64,145,108,0.3)] hover:border-[#40916C] hover:text-[#1B4332]" onClick={() => onResume(session.id)}>
                  <Play className="w-3.5 h-3.5" /> Resume
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
