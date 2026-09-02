import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { fromDbCurriculum } from "@/lib/curricula";
import { useQuizAttempt } from "../hooks/useQuizAttempt";
import { QuizGenerationFailedScreen } from "./quiz-screens/QuizGenerationFailedScreen";
import { QuizErrorScreen } from "./quiz-screens/QuizErrorScreen";
import { QuizEmptyScreen } from "./quiz-screens/QuizEmptyScreen";
import { QuizResultsScreen } from "./quiz-screens/QuizResultsScreen";
import { QuizQuestionScreen } from "./quiz-screens/QuizQuestionScreen";

export function TestPage() {
  const quiz = useQuizAttempt();

  if (!quiz.user || !quiz.courseId) {
    return null;
  }

  if (quiz.quizStillGenerating) {
    return <GardenVideoLoader message="Growing your questions..." />;
  }

  // Only surface a generation failure before the session has data — under the
  // backend's "failed ⇔ zero questions" invariant a started session can't
  // flip to failed, but guard anyway.
  if (quiz.quizGenerationFailed && !quiz.testData) {
    return (
      <QuizGenerationFailedScreen
        errorMessage={quiz.generationStatus?.error_message}
        onExit={quiz.handleExit}
      />
    );
  }

  if (quiz.isLoading) {
    return <GardenVideoLoader message={quiz.loadingMessage} />;
  }

  if (quiz.error) {
    return <QuizErrorScreen onExit={quiz.handleExit} onRetry={() => quiz.refetch()} />;
  }

  if (!quiz.questions.length) {
    return <QuizEmptyScreen message={quiz.testData?.message} onExit={quiz.handleExit} />;
  }

  if (quiz.quizComplete) {
    const curriculum =
      fromDbCurriculum(quiz.courseCurriculumRow?.curriculum_type) ??
      quiz.profileData?.curriculum ??
      "percentage";

    return (
      <QuizResultsScreen
        totalQuestions={quiz.totalQuestions}
        correctCount={quiz.correctCount}
        passChance={quiz.passChance}
        loadingPassChance={quiz.loadingPassChance}
        passChanceBefore={quiz.passChanceBefore}
        targetGrade={quiz.targetGrade}
        curriculum={curriculum}
        topicId={quiz.topicId}
        onRetake={quiz.handleRetake}
        onExit={quiz.handleExit}
        onReturnToGarden={() => quiz.navigate(`/course/${quiz.courseId}/garden`)}
      />
    );
  }

  return (
    <QuizQuestionScreen
      courseName={quiz.testData?.course_name ?? "Quiz"}
      currentIndex={quiz.currentIndex}
      totalQuestions={quiz.totalQuestions}
      correctCount={quiz.correctCount}
      currentQuestion={quiz.currentQuestion}
      selectedOption={quiz.selectedOption}
      feedback={quiz.feedback}
      showExitConfirm={quiz.showExitConfirm}
      onShowExitConfirmChange={quiz.setShowExitConfirm}
      onExitRequest={quiz.handleExitRequest}
      onConfirmExit={quiz.handleExit}
      onSelectOption={quiz.handleSelectOption}
      onNext={quiz.handleNext}
    />
  );
}
