import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudyPlanHeaderProps {
  hasPlan: boolean;
  isGenerating: boolean;
  generatedAt?: string;
  onRegenerate: () => void;
}

export function StudyPlanHeader({
  hasPlan,
  isGenerating,
  generatedAt,
  onRegenerate,
}: StudyPlanHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-ghibli-moss" />
        <h2 className="text-base font-semibold text-ghibli-canopy">Your Growth Guide</h2>
      </div>
      {hasPlan && !isGenerating && generatedAt && (
        <div className="flex items-center gap-3">
          <p className="text-xs text-ghibli-bark hidden sm:block">
            Generated{" "}
            {new Date(generatedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-ghibli-canopy-medium hover:text-ghibli-jungle"
            onClick={onRegenerate}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}
