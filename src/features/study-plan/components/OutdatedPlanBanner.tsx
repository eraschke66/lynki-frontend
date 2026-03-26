import { Sparkles } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";

export function OutdatedPlanBanner({ onRegenerate }: { onRegenerate: () => void }) {
  return (
    <ParchmentCard className="p-10 text-center flex flex-col items-center gap-4">
      <span className="text-4xl">🌱</span>
      <div>
        <p className="text-sm font-semibold mb-1">
          Your plan was made before the garden got an upgrade.
        </p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Generate a new one to see your personalized growth guide — with time
          estimates, projected outcomes, and your study rhythm.
        </p>
      </div>
      <Button
        className="gap-2 shadow-[0_2px_8px_rgba(13,115,119,0.2)]"
        onClick={onRegenerate}
      >
        <Sparkles className="w-4 h-4" />
        Grow a New Plan
      </Button>
    </ParchmentCard>
  );
}
