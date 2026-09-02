import { Play } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";

export function FirstQuizBanner({ onGenerateQuiz }: { onGenerateQuiz: () => void }) {
  return (
    <ParchmentCard className="p-5 md:p-6 mb-4 md:mb-6 flex flex-col sm:flex-row items-center gap-5">
      <img
        src="/plant-stage-1.webp"
        alt=""
        className="w-14 h-14 object-contain shrink-0 animate-pulse-soft"
        style={{ mixBlendMode: "darken" }}
      />
      <div className="flex-1 text-center sm:text-left">
        <p className="font-serif text-lg font-semibold text-ghibli-canopy">
          Your garden soil is ready
        </p>
        <p className="font-sans text-sm text-ghibli-bark mt-0.5">
          Your material has been processed. Generate your first quiz to
          start tracking mastery.
        </p>
      </div>
      <Button
        size="lg"
        onClick={onGenerateQuiz}
        className="gap-2 shrink-0 rounded-full px-6 py-5 font-semibold bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-md hover:shadow-glow transition-all"
      >
        <Play className="w-4 h-4" />
        Generate First Quiz
      </Button>
    </ParchmentCard>
  );
}
