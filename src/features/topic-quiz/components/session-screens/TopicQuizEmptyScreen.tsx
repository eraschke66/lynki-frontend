import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { CenteredCard } from "./CenteredCard";

export function TopicQuizEmptyScreen({
  embedded,
  onExit,
}: {
  embedded: boolean;
  onExit?: () => void;
}) {
  return (
    <CenteredCard embedded={embedded}>
      <ParchmentCard className="p-6 md:p-10 text-center flex flex-col items-center gap-4 max-w-sm">
        <p className="font-serif text-lg font-semibold">No questions could be grown</p>
        <p className="text-sm text-ghibli-bark">
          This topic may not have enough material yet.
        </p>
        {onExit && (
          <Button variant="outline" className="rounded-parchment" onClick={onExit}>
            Return
          </Button>
        )}
      </ParchmentCard>
    </CenteredCard>
  );
}
