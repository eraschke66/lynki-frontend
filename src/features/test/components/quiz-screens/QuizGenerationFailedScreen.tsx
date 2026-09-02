import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizMessageScreen } from "./QuizMessageScreen";

export function QuizGenerationFailedScreen({
  errorMessage,
  onExit,
}: {
  errorMessage: string | null | undefined;
  onExit: () => void;
}) {
  return (
    <QuizMessageScreen onExit={onExit} maxWidth="max-w-sm">
      <AlertCircle className="w-10 h-10 text-destructive" />
      <div>
        <h2 className="font-serif text-lg font-semibold mb-1">
          That batch didn&rsquo;t finish growing
        </h2>
        <p className="text-sm text-ghibli-bark">
          {errorMessage ||
            "Generation didn't finish. Nothing you did — give it another go."}
        </p>
      </div>
      <Button variant="outline" className="rounded-parchment" onClick={onExit}>
        Back to Garden
      </Button>
    </QuizMessageScreen>
  );
}
