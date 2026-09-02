import { Loader2 } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { useElapsedTime } from "@/features/documents/hooks/useElapsedTime";
import {
  getProcessingProgressPercent,
  getProcessingStageMessage,
  type DocumentProcessingStage,
} from "@/lib/garden";

interface ProcessingDoc {
  id: string;
  title: string;
  status: "pending" | "processing" | "completed" | "failed";
  processing_stage?: DocumentProcessingStage;
  processing_started_at?: string | null;
}

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
  processing: ProcessingDoc[];
}) {
  // A retried document is reset to status "pending" but keeps its previous
  // processing_stage/processing_started_at until the backend restarts it —
  // only trust those fields while the backend is actually mid-run on it.
  const normalizedProcessing = processing.map((d) =>
    d.status === "processing" ? d : { ...d, processing_stage: null, processing_started_at: null },
  );
  const visibleProcessing = normalizedProcessing.slice(0, 3);
  const extraCount = normalizedProcessing.length - visibleProcessing.length;

  // The furthest-along document sets the headline message/progress — once
  // any document reaches "analyzing" that's the more informative thing to
  // say, even if others are still queued.
  const leadDoc =
    normalizedProcessing.find((d) => d.processing_stage === "analyzing") ??
    normalizedProcessing.find((d) => d.processing_stage === "extracting") ??
    normalizedProcessing[0];
  const elapsedMs = useElapsedTime(leadDoc?.processing_started_at);
  const headline = getProcessingStageMessage(leadDoc?.processing_stage, elapsedMs);
  const progressPercent = getProcessingProgressPercent(
    leadDoc?.status ?? "pending",
    leadDoc?.processing_stage,
  );

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
            {headline.title}
          </p>
          <p className="font-sans text-sm text-ghibli-bark mt-0.5">
            {total > 0
              ? `${completed} of ${total} ${total === 1 ? "document" : "documents"} processed. ${headline.detail}`
              : headline.detail}
          </p>
          <div className="mt-3 h-1.5 w-full max-w-[280px] mx-auto sm:mx-0 rounded-full bg-ghibli-moss/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-ghibli-moss transition-[width] duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
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
                  <span className="text-ghibli-bark/70 shrink-0">
                    {doc.status !== "processing"
                      ? "queued"
                      : doc.processing_stage === "analyzing"
                        ? "analyzing"
                        : "extracting"}
                  </span>
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
