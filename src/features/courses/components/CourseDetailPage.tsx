import { reportError } from "@/lib/sentry";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { Header } from "@/components/layout/Header";
import { VineDecoration } from "@/components/garden/VineDecoration";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { fetchPassChance } from "@/features/test/services/passChanceService";
import { generateQuiz } from "@/features/test/services/quizAttemptService";
import { retryDocumentProcessing } from "@/features/documents/services/documentService";
import { QuizActivationCard } from "@/features/test/components/QuizActivationCard";
import { updateCourse } from "@/features/courses/services/courseService";
import { EditCourseDialog } from "@/features/dashboard/components/EditCourseDialog";
import { courseQueryKeys, testQueryKeys, profileQueryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "@/features/settings";
import { getGradeLabel, fromDbCurriculum } from "@/lib/curricula";
import type { CourseQuiz } from "@/features/test/types";
import { QuizDetailModal } from "@/features/test/components/QuizDetailModal";
import { CourseHero } from "./course-detail/CourseHero";
import { MaterialsProcessingCard } from "./course-detail/MaterialsProcessingCard";
import { MaterialsFailedBanner } from "./course-detail/MaterialsFailedBanner";
import { FirstQuizBanner } from "./course-detail/FirstQuizBanner";
import { QuizzesList } from "./course-detail/QuizzesList";

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [retryingUpload, setRetryingUpload] = useState(false);
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

  // Readiness for the activation card's "growing" state: derived for free
  // from document status (a document only reaches 'completed' once concepts
  // exist — see extraction_service.py), no separate quiz-generation signal
  // needed. Polls while anything is still pending/processing, whether or not
  // the course already has a completed document — a second upload onto a
  // finished course is still an upload the screen has to keep asking about.
  const { data: docStatusSummary } = useQuery({
    queryKey: ["courses", "doc-status-summary", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, status, error_message, processing_stage, processing_started_at")
        .eq("course_id", courseId!);
      if (error) throw error;
      const rows = data ?? [];
      return {
        totalDocs: rows.length,
        completedDocs: rows.filter((r) => r.status === "completed"),
        processingDocs: rows.filter(
          (r) => r.status === "pending" || r.status === "processing",
        ),
        hasCompleted: rows.some((r) => r.status === "completed"),
        hasProcessing: rows.some(
          (r) => r.status === "pending" || r.status === "processing",
        ),
        failedDocs: rows.filter((r) => r.status === "failed"),
      };
    },
    enabled: !!courseId,
    refetchInterval: (query) => (query.state.data?.hasProcessing ? 4000 : false),
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

  // The activation moment. On first upload (no completed document yet),
  // materials processing beats a quiz waiting to be started — there's
  // nothing to generate from yet either way. Once the course already has
  // completed materials, a fresh quiz waiting to be started is the more
  // useful thing to surface than a second/third upload still processing in
  // the background — that in-flight upload still gets a lightweight inline
  // signal next to the document count (see the hero meta row) rather than
  // competing for the one big CTA slot. If nothing is waiting either way,
  // fall back to showing the processing card so an incremental upload isn't
  // silently invisible. On-demand generation failures surface directly on
  // TestPage now (it's a fast, user-triggered action), not as a pre-emptive
  // dashboard state, so there's no "failed" case to compute here anymore.
  const activationState =
    docStatusSummary?.hasProcessing && !docStatusSummary?.hasCompleted
      ? ("materials_processing" as const)
      : freshQuiz
        ? ("ready" as const)
        : docStatusSummary?.hasProcessing
          ? ("materials_processing" as const)
          : null;

  // A failed document should surface a retry regardless of what else is
  // happening in the course — a second upload can fail while a third is
  // still extracting, and the student needs the retry either way. Retrying
  // clears error_message and resets the row to pending, so the banner goes
  // on its own once the retry lands.
  const materialsFailed = (docStatusSummary?.failedDocs?.length ?? 0) > 0;

  const handleRetryFailedMaterials = async () => {
    const failedDocs = docStatusSummary?.failedDocs ?? [];
    if (retryingUpload || failedDocs.length === 0) return;
    setRetryingUpload(true);
    try {
      await Promise.all(
        failedDocs.map((doc) => retryDocumentProcessing(doc.id)),
      );
      queryClient.invalidateQueries({
        queryKey: ["courses", "doc-status-summary", courseId],
      });
    } catch (err) {
      reportError("Failed to retry document processing:", err);
    } finally {
      setRetryingUpload(false);
    }
  };

  // While the activation card is showing it owns the only button on screen.
  // The hero's four equal-weight CTAs are what the student bounced off, so
  // they drop to text links until the quiz has been started.
  const demoteHeroCtas = activationState !== null || materialsFailed;

  const handleGenerateQuiz = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const result = await generateQuiz(user.id, courseId);
      queryClient.invalidateQueries({
        queryKey: testQueryKeys.quizzes(courseId, user.id),
      });
      // Navigate to TestPage — it polls course_quizzes.status itself and
      // shows the "growing" loader until generation actually completes.
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
    return <GardenVideoLoader message="Tending the garden..." />;
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

        <CourseHero
          courseId={courseId}
          title={course.title}
          description={course.description}
          docCount={docCount ?? 0}
          showProcessingHint={
            activationState !== "materials_processing" &&
            !!docStatusSummary?.hasProcessing
          }
          processingCount={docStatusSummary?.processingDocs.length ?? 0}
          completedCount={completedCount}
          targetLabel={targetLabel}
          passPercent={passPercent}
          quizzesCount={quizzes.length}
          demoteHeroCtas={demoteHeroCtas}
          onEditClick={() => setEditOpen(true)}
          onGenerateQuiz={handleGenerateQuiz}
        />

        {activationState === "materials_processing" && (
          <MaterialsProcessingCard
            completed={docStatusSummary?.completedDocs.length ?? 0}
            total={docStatusSummary?.totalDocs ?? 0}
            processing={docStatusSummary?.processingDocs ?? []}
          />
        )}

        {activationState === "ready" && (
          <QuizActivationCard
            state="ready"
            totalQuestions={freshQuiz?.total_questions}
            onBegin={() =>
              freshQuiz && navigate(`/test/${courseId}?quiz=${freshQuiz.id}`)
            }
            onRetry={handleGenerateQuiz}
            retrying={generating}
          />
        )}

        {materialsFailed && (
          <MaterialsFailedBanner
            errorMessage={docStatusSummary?.failedDocs?.[0]?.error_message}
            retrying={retryingUpload}
            onRetry={handleRetryFailedMaterials}
          />
        )}

        {/* First-quiz banner — only when nothing has been generated at all */}
        {!activationState && !materialsFailed && docCount && docCount > 0 && quizzes.length === 0 && (
          <FirstQuizBanner onGenerateQuiz={handleGenerateQuiz} />
        )}

        <QuizzesList
          quizzes={quizzes}
          loading={quizzesLoading}
          onQuizClick={handleOpenQuizModal}
        />
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
