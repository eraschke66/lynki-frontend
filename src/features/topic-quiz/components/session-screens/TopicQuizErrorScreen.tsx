import { AlertCircle, RefreshCw } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { CenteredCard } from "./CenteredCard";

export function TopicQuizErrorScreen({
  embedded,
  errorMessage,
  onRetry,
}: {
  embedded: boolean;
  errorMessage: string;
  onRetry: () => void;
}) {
  return (
    <CenteredCard embedded={embedded}>
      <ParchmentCard className="p-6 md:p-10 text-center flex flex-col items-center gap-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <div>
          <p className="font-serif font-semibold mb-1">The seeds are resting</p>
          <p className="text-sm text-ghibli-bark">
            {errorMessage || "Failed to load quiz. Please try again."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </ParchmentCard>
    </CenteredCard>
  );
}
