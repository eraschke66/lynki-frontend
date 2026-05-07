import { useEffect, useState } from "react";

const ROTATING_COPY = [
  "Picking the cards your brain needs most…",
  "Reading what's already growing in this bed…",
  "Choosing which weeds to pull first…",
  "Almost ready — just shaping the last few questions…",
];

const COPY_INTERVAL_MS = 4500;
const SLOW_THRESHOLD_MS = 90_000;

interface TendingLoadingProps {
  /** When provided, renders a "Try again" link after SLOW_THRESHOLD_MS. */
  onRetry?: () => void;
  /** Override the rotating copy with a single static line. */
  staticMessage?: string;
}

export function TendingLoading({ onRetry, staticMessage }: TendingLoadingProps) {
  const [copyIdx, setCopyIdx] = useState(0);
  const [showSlowLink, setShowSlowLink] = useState(false);

  useEffect(() => {
    if (staticMessage) return;
    const id = window.setInterval(
      () => setCopyIdx((i) => (i + 1) % ROTATING_COPY.length),
      COPY_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [staticMessage]);

  useEffect(() => {
    if (!onRetry) return;
    const id = window.setTimeout(() => setShowSlowLink(true), SLOW_THRESHOLD_MS);
    return () => window.clearTimeout(id);
  }, [onRetry]);

  const message = staticMessage ?? ROTATING_COPY[copyIdx];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <img
        src="/plant-stage-2.png"
        alt=""
        aria-hidden="true"
        className="w-32 md:w-40 mb-8 drop-shadow-sm"
      />
      <p
        key={message}
        className="font-serif text-ghibli-canopy text-lg md:text-xl text-center max-w-md animate-in fade-in duration-700"
      >
        {message}
      </p>

      <div className="mt-8 w-48 h-1 rounded-full bg-ghibli-moss/15 overflow-hidden">
        <div className="h-full w-1/3 rounded-full bg-ghibli-moss/60 animate-pulse" />
      </div>

      {showSlowLink && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 text-xs text-gray-500 hover:text-gray-700 hover:underline"
        >
          This is taking longer than usual — try again?
        </button>
      )}
    </div>
  );
}
