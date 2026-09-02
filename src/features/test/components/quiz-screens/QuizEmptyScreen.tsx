import { PlantIndicator } from "@/components/garden/PlantIndicator";
import { Button } from "@/components/ui/button";
import { QuizMessageScreen } from "./QuizMessageScreen";

export function QuizEmptyScreen({
  message,
  onExit,
}: {
  message: string | undefined;
  onExit: () => void;
}) {
  return (
    <QuizMessageScreen onExit={onExit} maxWidth="max-w-sm">
      <PlantIndicator probability={20} size="lg" />
      <div>
        <h2 className="font-serif text-lg font-semibold mb-1">
          No Questions Available
        </h2>
        <p className="text-sm text-ghibli-bark">
          {message || "Your documents may still be processing. Check back in a moment."}
        </p>
      </div>
      <Button variant="outline" className="rounded-parchment" onClick={onExit}>
        Back to Garden
      </Button>
    </QuizMessageScreen>
  );
}
