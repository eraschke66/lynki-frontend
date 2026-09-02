import { Upload } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";

export function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
      <ParchmentCard glow className="p-6 md:p-12 flex flex-col items-center gap-6">
        <div className="space-y-3">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ghibli-canopy">Your garden is ready.</h1>
          <p className="text-ghibli-bark font-sans leading-relaxed">
            Plant your first seed — upload your study materials and we'll show you where you stand before the exam does.
          </p>
        </div>
        <Button
          size="lg"
          onClick={onUpload}
          className="gap-2 rounded-full px-8 py-6 text-base font-semibold bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-lg hover:shadow-glow transition-all"
        >
          <Upload className="w-5 h-5" />
          Plant a Seed
        </Button>
      </ParchmentCard>
    </div>
  );
}
