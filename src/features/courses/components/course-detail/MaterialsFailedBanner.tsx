import { Loader2, RefreshCw } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";

export function MaterialsFailedBanner({
  errorMessage,
  retrying,
  onRetry,
}: {
  errorMessage: string | null | undefined;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <ParchmentCard className="p-5 md:p-6 mb-4 md:mb-6">
      <div
        className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5"
        role="alert"
      >
        <img
          src="/plant-stage-1.webp"
          alt=""
          className="w-14 h-14 object-contain shrink-0 opacity-60 grayscale"
          style={{ mixBlendMode: "darken" }}
        />
        <div className="flex-1 text-center sm:text-left">
          <p className="font-serif text-lg font-semibold text-ghibli-canopy">
            That upload didn&rsquo;t take root
          </p>
          <p className="font-sans text-sm text-ghibli-bark mt-0.5">
            {errorMessage ||
              "We couldn't process that file. Give it another try, or upload a different version."}
          </p>
        </div>
        <Button
          size="lg"
          onClick={onRetry}
          disabled={retrying}
          className="w-full sm:w-auto shrink-0 gap-2 rounded-full px-8 py-6 text-base font-semibold bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-lg hover:shadow-glow transition-all"
        >
          {retrying ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          )}
          {retrying ? "Retrying…" : "Retry"}
        </Button>
      </div>
    </ParchmentCard>
  );
}
