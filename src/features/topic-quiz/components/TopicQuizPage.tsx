import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "@/features/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { TopicQuizSession } from "./TopicQuizSession";

/**
 * URL-driven entry point for the topic quiz.
 *
 * Owns the page-level chrome (background, X button, leave-quiz dialog) and
 * delegates the question flow to TopicQuizSession. Embedded usages (e.g. the
 * Tending Flow Practice Quiz stage) mount TopicQuizSession directly with their
 * own outer chrome and onComplete callback.
 */
export function TopicQuizPage() {
  const { courseId, topicId } = useParams<{
    courseId: string;
    topicId: string;
  }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleExit = useCallback(() => {
    if (!courseId) {
      navigate("/home");
      return;
    }
    navigate(`/course/${courseId}/garden`);
  }, [courseId, navigate]);

  const handleExitRequest = useCallback(() => {
    if (completed) {
      handleExit();
    } else {
      setShowExitConfirm(true);
    }
  }, [completed, handleExit]);

  // Ensure users are warned if they try to close or refresh the window mid-quiz
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if the quiz is not complete
      if (!completed) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [completed]);

  if (!user || !courseId || !topicId) {
    navigate("/home");
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <GhibliBackground />
      <button
        onClick={handleExitRequest}
        className="absolute top-5 right-5 z-30 p-2.5 rounded-full text-ghibli-canopy bg-ghibli-cream/85 backdrop-blur-sm border border-ghibli-moss/40 shadow-sm hover:bg-ghibli-cream hover:border-ghibli-jungle hover:shadow-md transition-all"
        aria-label="Exit quiz"
      >
        <X className="w-5 h-5" strokeWidth={2.5} />
      </button>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause and leave?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress is saved and you can resume this quiz later!
              However, it's highly recommended to finish what you started to
              lock in those concepts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Going</AlertDialogCancel>
            <AlertDialogAction
              className="bg-ghibli-amber text-primary-foreground hover:bg-ghibli-amber/90"
              onClick={handleExit}
            >
              Save & Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TopicQuizSession
        courseId={courseId}
        topicId={topicId}
        onExit={handleExit}
        onComplete={() => setCompleted(true)}
      />
    </div>
  );
}
