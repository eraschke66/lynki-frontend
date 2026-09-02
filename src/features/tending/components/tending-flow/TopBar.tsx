import { X } from "lucide-react";
import { StageProgressDots } from "../StageProgressDots";
import type { useTendingMachine } from "../../state/tendingMachine";

interface TopBarProps {
  topicTitle: string;
  currentStage: ReturnType<typeof useTendingMachine>["state"]["currentStage"];
  stagesSkipped: ReturnType<typeof useTendingMachine>["state"]["stagesSkipped"];
  onExit: () => void;
}

export function TopBar({ topicTitle, currentStage, stagesSkipped, onExit }: TopBarProps) {
  return (
    <header className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-ghibli-moss/15 bg-white/60 backdrop-blur-sm">
      <h1 className="font-serif text-base md:text-lg text-ghibli-canopy truncate min-w-0 flex-1">{topicTitle}</h1>
      <div className="hidden sm:block">
        <StageProgressDots currentStage={currentStage} stagesSkipped={stagesSkipped} />
      </div>
      <button
        type="button"
        onClick={onExit}
        aria-label="Leave session"
        className="w-9 h-9 rounded-full border border-ghibli-moss/30 bg-cream-100/80 text-ghibli-canopy flex items-center justify-center hover:bg-cream-100 hover:border-ghibli-moss/50 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </header>
  );
}
