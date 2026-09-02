import type { ReactNode } from "react";
import { X } from "lucide-react";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { ParchmentCard } from "@/components/garden/ParchmentCard";

/**
 * Shared full-screen chrome for the generation-failed, error and empty-quiz
 * states: background, exit button, and a centered ParchmentCard. Previously
 * duplicated verbatim across all three.
 */
export function QuizMessageScreen({
  onExit,
  maxWidth = "",
  children,
}: {
  onExit: () => void;
  maxWidth?: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <GhibliBackground />
      <button
        onClick={onExit}
        className="absolute top-5 right-5 p-2 rounded-full text-ghibli-forest hover:text-ghibli-canopy hover:bg-ghibli-mist/70 transition-colors z-30"
        aria-label="Exit quiz"
      >
        <X className="w-6 h-6" />
      </button>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <ParchmentCard
          className={`p-6 md:p-10 text-center flex flex-col items-center gap-4 ${maxWidth}`}
        >
          {children}
        </ParchmentCard>
      </div>
    </div>
  );
}
