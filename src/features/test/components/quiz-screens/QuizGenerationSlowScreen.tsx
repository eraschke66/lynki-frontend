import { Clock, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizMessageScreen } from "./QuizMessageScreen";

/**
 * Backstop shown once quiz generation has been running long enough that a
 * silent, endless spinner would read as broken. Generation is still
 * happening on the backend — this just gives the student a way to check in
 * instead of staring at an animation with no sense of whether it's stuck.
 */
export function QuizGenerationSlowScreen({
  onCheckAgain,
  onExit,
}: {
  onCheckAgain: () => void;
  onExit: () => void;
}) {
  return (
    <QuizMessageScreen onExit={onExit} maxWidth="max-w-sm">
      <Clock className="w-10 h-10 text-ghibli-forest" />
      <div>
        <h2 className="font-serif text-lg font-semibold mb-1">
          Still growing your questions
        </h2>
        <p className="text-sm text-ghibli-bark">
          This is taking longer than usual. Your quiz is still being
          generated — check in, or come back to it in a moment.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="rounded-parchment" onClick={onExit}>
          Back to Garden
        </Button>
        <Button className="rounded-parchment gap-2" onClick={onCheckAgain}>
          <RotateCw className="w-4 h-4" />
          Check Again
        </Button>
      </div>
    </QuizMessageScreen>
  );
}
