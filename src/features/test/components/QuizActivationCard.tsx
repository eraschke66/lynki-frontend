import { ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParchmentCard } from "@/components/garden/ParchmentCard";

export type QuizActivationState = "growing" | "ready" | "failed";

interface QuizActivationCardProps {
  state: QuizActivationState;
  /** Question count for the waiting sitting — only meaningful when ready. */
  totalQuestions?: number;
  /** Drops the student straight into question 1. */
  onBegin: () => void;
  /** Re-runs generation after a failure. */
  onRetry: () => void;
  /** True while a retry request is in flight. */
  retrying?: boolean;
}

/**
 * The activation moment: a student has just generated a quiz.
 *
 * The beta's one metric is activation (upload -> complete a quiz -> see pass
 * probability) and the measured drop-off is between "quiz generated" and
 * "first question answered". So this card carries exactly ONE action. When it
 * is showing, CourseDetailPage demotes its other CTAs to text links —
 * competing buttons at this moment are what lost the user.
 *
 * "failed" must never render as a spinner or a dead card: a pg_cron sweep
 * marks generations stuck over 15 minutes as failed, so this state is reached
 * silently, with no error ever shown to the student.
 */
export function QuizActivationCard({
  state,
  totalQuestions,
  onBegin,
  onRetry,
  retrying = false,
}: QuizActivationCardProps) {
  if (state === "growing") {
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
          <div className="flex-1 text-center sm:text-left">
            <p className="font-serif text-lg font-semibold text-ghibli-canopy">
              Your questions are still growing
            </p>
            <p className="font-sans text-sm text-ghibli-bark mt-0.5">
              This usually takes a minute or two. We&rsquo;ll show you the path
              the moment it&rsquo;s ready.
            </p>
          </div>
          <Loader2
            className="w-5 h-5 shrink-0 animate-spin text-ghibli-forest"
            aria-hidden="true"
          />
        </div>
      </ParchmentCard>
    );
  }

  if (state === "failed") {
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
              That batch didn&rsquo;t finish growing
            </p>
            <p className="font-sans text-sm text-ghibli-bark mt-0.5">
              Generation didn&rsquo;t finish. Nothing you did &mdash; give it
              another go.
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

  // ready — one action, nothing competing with it.
  return (
    <ParchmentCard className="p-5 md:p-6 mb-4 md:mb-6" glow>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
        <img
          src="/plant-stage-2.webp"
          alt=""
          className="w-14 h-14 object-contain shrink-0 animate-pulse-soft"
          style={{ mixBlendMode: "darken" }}
        />
        <div className="flex-1 text-center sm:text-left">
          <p className="font-serif text-lg font-semibold text-ghibli-canopy">
            Your quiz is ready
          </p>
          <p className="font-sans text-sm text-ghibli-bark mt-0.5">
            {totalQuestions
              ? `${totalQuestions} questions, waiting on the path.`
              : "Your questions are waiting on the path."}
          </p>
        </div>
        <Button
          size="lg"
          onClick={onBegin}
          className="w-full sm:w-auto shrink-0 gap-2 rounded-full px-8 py-6 text-base font-semibold bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-lg hover:shadow-glow transition-all"
        >
          Walk the path
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </ParchmentCard>
  );
}
