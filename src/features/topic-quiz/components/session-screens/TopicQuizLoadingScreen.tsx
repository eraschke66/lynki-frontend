import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { ParchmentCard } from "@/components/garden/ParchmentCard";

export function TopicQuizLoadingScreen({
  embedded,
  showSlowLink,
  onRetry,
}: {
  embedded: boolean;
  showSlowLink: boolean;
  onRetry: () => void;
}) {
  if (embedded) {
    return (
      <div className="max-w-md mx-auto w-full">
        <ParchmentCard className="p-5 md:p-8 text-center" hover={false}>
          <p className="font-serif text-ghibli-canopy">Preparing fresh soil for this topic…</p>
          {showSlowLink && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 text-xs text-ghibli-bark hover:text-ghibli-canopy hover:underline"
            >
              This is taking longer than usual — try again?
            </button>
          )}
        </ParchmentCard>
      </div>
    );
  }
  return <GardenVideoLoader message="Preparing fresh soil for this topic..." />;
}
