import { TendingLoading } from "../TendingLoading";
import { TopBar } from "./TopBar";

interface TendingSetupScreenProps {
  generateError: string | null;
  onRetry: () => void;
  onExit: () => void;
}

/** Shown before the machine has initialized — either the loading spinner, or a generation error with a retry link. */
export function TendingSetupScreen({ generateError, onRetry, onExit }: TendingSetupScreenProps) {
  if (generateError) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopBar topicTitle="Tending session" currentStage="loading" stagesSkipped={[]} onExit={onExit} />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <p className="font-serif text-ghibli-canopy mb-4">{generateError}</p>
            <button type="button" className="text-sm text-ghibli-forest hover:underline" onClick={onRetry}>
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar topicTitle="Loading…" currentStage="loading" stagesSkipped={[]} onExit={onExit} />
      <main className="flex-1 flex flex-col">
        <TendingLoading onRetry={onRetry} />
      </main>
    </div>
  );
}
