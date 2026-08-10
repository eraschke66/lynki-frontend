import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  isGenerationStalled,
  waitStage,
  type WaitStage,
} from "../generationState";
import type { QuizGeneration } from "../types";

/**
 * The wait between "I uploaded something" and "here are my questions".
 *
 * This is a place, not a progress report. The sprinkler video already exists and
 * was made for exactly this screen — a garden, water arcing over ferns, the cat
 * asleep on the stone step. The job here is to put one quiet line on top of it
 * and otherwise get out of the way.
 *
 * Things deliberately not here: no spinner, no percentage that isn't real, no
 * rotating encouragement, no exclamation marks, and nothing that celebrates when
 * the work finishes. The garden is an environment, not a reward system.
 *
 * Neko is not rendered. neko-1.png and neko-2.png return the SPA's index.html
 * rather than an image, so mounting the component would put broken images on
 * screen. The cat in the video is unaffected — it's baked into the mp4.
 */

interface WarmupFact {
  term: string;
  fact: string;
}

interface GenerationWaitProps {
  generation: QuizGeneration | null | undefined;
  /** Topics as extraction finds them. Empty until the backend sends them. */
  topics?: string[];
  /** Facts pulled verbatim from the student's own document. 0-5. */
  warmupFacts?: WarmupFact[];
  onRetry: () => void;
  retrying?: boolean;
}

const STAGE_COPY: Record<WaitStage, string> = {
  preparing: "Preparing your seed.",
  reading: "Reading your notes.",
  planting: "Planting your questions.",
  settling: "Planting your questions.",
};

export function GenerationWait({
  generation,
  topics = [],
  warmupFacts = [],
  onRetry,
  retrying = false,
}: GenerationWaitProps) {
  // A clock only so the copy can move with real elapsed time. Nothing here
  // animates on it.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(t);
  }, []);

  const stalled = isGenerationStalled(generation, now);
  const failed = generation?.status === "failed" || stalled;
  const stage = waitStage(generation, now);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-ghibli-moss/30 shadow-[0_2px_12px_hsl(152_45%_16%_/_0.10)]">
      <SprinklerBackdrop />

      {/* Wash, so the text is readable over moving water without hiding it. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--ghibli-canopy) / 0.30) 0%, hsl(var(--ghibli-canopy) / 0.52) 100%)",
        }}
      />

      <div className="relative px-6 py-10 sm:px-10 sm:py-14">
        {failed ? (
          <FailureState onRetry={onRetry} retrying={retrying} />
        ) : (
          <>
            <p
              className="text-shadow-loader font-serif text-xl sm:text-2xl text-center"
              style={{ color: "hsl(var(--ghibli-ivory) / 0.94)" }}
              role="status"
              aria-live="polite"
            >
              {STAGE_COPY[stage]}
            </p>

            {stage === "settling" && (
              <p
                className="mt-2 text-center font-sans text-sm"
                style={{ color: "hsl(var(--ghibli-ivory) / 0.74)" }}
              >
                This can take a moment.
              </p>
            )}

            {topics.length > 0 && (
              <p
                className="mt-5 text-center font-sans text-sm"
                style={{ color: "hsl(var(--ghibli-ivory) / 0.80)" }}
              >
                Found: {topics.join(" · ")}
              </p>
            )}

            {warmupFacts.length > 0 && (
              <WarmupCards facts={warmupFacts} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The Sora loop, held back until we know the wait is real.
 *
 * The file is 4.3 MB. Attaching it immediately would make every short wait pay
 * for a video nobody sees, so a still frame carries the first second and a half
 * and the loop only starts if the wait outlasts it.
 */
function SprinklerBackdrop() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowVideo(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (showVideo) videoRef.current?.play().catch(() => {});
  }, [showVideo]);

  return (
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: "url(/garden-loader-poster.webp)" }}
      aria-hidden="true"
    >
      {showVideo && (
        <video
          ref={videoRef}
          src="/garden-loader.mp4"
          poster="/garden-loader-poster.webp"
          preload="none"
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}

function FailureState({
  onRetry,
  retrying,
}: {
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="text-center" role="alert">
      <p
        className="text-shadow-loader font-serif text-xl sm:text-2xl"
        style={{ color: "hsl(var(--ghibli-ivory) / 0.94)" }}
      >
        That batch didn&rsquo;t finish growing.
      </p>
      <p
        className="mt-2 font-sans text-sm"
        style={{ color: "hsl(var(--ghibli-ivory) / 0.78)" }}
      >
        Nothing you did. Planting them again usually works.
      </p>
      <Button
        size="lg"
        onClick={onRetry}
        disabled={retrying}
        className="mt-6 rounded-full px-8 py-6 text-base font-semibold bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy"
      >
        {retrying ? "Planting…" : "Plant them again"}
      </Button>
    </div>
  );
}

/**
 * Tier 2 — a few facts from the student's own document, offered rather than
 * assigned. Empty is a perfectly good state; nothing is ever padded with
 * generic trivia.
 */
function WarmupCards({ facts }: { facts: WarmupFact[] }) {
  return (
    <div className="mt-8">
      <p
        className="mb-3 text-center font-sans text-xs uppercase tracking-[0.18em]"
        style={{ color: "hsl(var(--ghibli-ivory) / 0.62)" }}
      >
        While you wait
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {facts.slice(0, 5).map((f, i) => (
          <FlipCard key={f.term} fact={f} index={i} />
        ))}
      </div>
    </div>
  );
}

function FlipCard({ fact, index }: { fact: WarmupFact; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      aria-expanded={flipped}
      className="group relative min-h-[88px] w-full rounded-2xl border border-ghibli-ivory/25 px-4 py-3 text-left transition-colors"
      style={{
        background: "hsl(var(--ghibli-ivory) / 0.12)",
        // Staggered so they arrive as extraction produces them rather than
        // landing as a block.
        animation: `warmupIn 420ms ease-out ${index * 90}ms both`,
      }}
    >
      <span
        className="block font-sans text-sm font-semibold"
        style={{ color: "hsl(var(--ghibli-ivory) / 0.92)" }}
      >
        {fact.term}
      </span>
      <span
        className="mt-1 block font-sans text-sm leading-snug"
        style={{
          color: "hsl(var(--ghibli-ivory) / 0.82)",
          opacity: flipped ? 1 : 0.35,
          transition: "opacity 220ms ease",
        }}
      >
        {flipped ? fact.fact : "Tap to see it"}
      </span>

      <style>{`
        @keyframes warmupIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes warmupIn { from { opacity: 0; } to { opacity: 1; } }
        }
      `}</style>
    </button>
  );
}
