import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizMessageScreen } from "./QuizMessageScreen";

export function QuizErrorScreen({
  onExit,
  onRetry,
}: {
  onExit: () => void;
  onRetry: () => void;
}) {
  return (
    <QuizMessageScreen onExit={onExit}>
      <AlertCircle className="w-10 h-10 text-destructive" />
      <p className="text-sm text-ghibli-bark">Failed to load quiz</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 mr-2" /> Retry
      </Button>
    </QuizMessageScreen>
  );
}
