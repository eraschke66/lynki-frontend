import { Loader2 } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";

/**
 * Shown while uploaded materials are still being read (text extraction +
 * concept extraction) and no quiz has been generated yet. Distinct from
 * QuizActivationCard's "ready"/quiz-generation copy — this is about the
 * documents themselves, so it surfaces per-document progress instead of a
 * bare spinner.
 */
export function MaterialsProcessingCard({
  completed,
  total,
  processing,
}: {
  completed: number;
  total: number;
  processing: { id: string; title: string }[];
}) {
  const visibleProcessing = processing.slice(0, 3);
  const extraCount = processing.length - visibleProcessing.length;

  return (
    <ParchmentCard className="p-5 md:p-6 mb-4 md:mb-6">
      <div
        className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5"
        role="status"
        aria-live="polite"
      >
        <img
          src="/plant-stage-1.webp"
          alt=""
          className="w-14 h-14 object-contain shrink-0 animate-pulse-soft"
          style={{ mixBlendMode: "darken" }}
        />
        <div className="flex-1 text-center sm:text-left min-w-0">
          <p className="font-serif text-lg font-semibold text-ghibli-canopy">
            Reading your materials...
          </p>
          <p className="font-sans text-sm text-ghibli-bark mt-0.5">
            {total > 0
              ? `${completed} of ${total} ${total === 1 ? "document" : "documents"} processed. This usually takes 1-2 minutes.`
              : "This usually takes 1-2 minutes."}
          </p>
          {visibleProcessing.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-left inline-block">
              {visibleProcessing.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-2 text-xs text-ghibli-bark"
                >
                  <Loader2
                    className="w-3.5 h-3.5 animate-spin text-ghibli-forest shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate max-w-[240px]">{doc.title}</span>
                </li>
              ))}
              {extraCount > 0 && (
                <li className="text-xs text-ghibli-bark italic pl-[22px]">
                  +{extraCount} more
                </li>
              )}
            </ul>
          )}
        </div>
        <Loader2
          className="w-5 h-5 shrink-0 animate-spin text-ghibli-forest"
          aria-hidden="true"
        />
      </div>
    </ParchmentCard>
  );
}
