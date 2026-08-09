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

    return (<div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ghibli-sunlight/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Blooming Animation Container */}
      <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
        {/* Glowing aura */}
        <div className="absolute inset-0 bg-ghibli-sunlight/20 blur-2xl rounded-full animate-pulse-soft" />
        
        {/* The "Flower" - using multiple leaf/petal layers */}
        <div className="relative animate-float-leaf">
          <img
            src="/plant-stage-2.webp"
            alt=""
            aria-hidden="true"
            className="w-32 md:w-40 relative z-10 animate-pulse-soft drop-shadow-glow"
          />
          
          {/* Floating petals/particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-3 h-3 bg-ghibli-petal/40 rounded-full blur-[1px] animate-drop"
              style={{
                marginLeft: `${(i - 2.5) * 40}px`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: "2s",
                animationIterationCount: "infinite"
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-md w-full flex flex-col items-center">
        <p
          key={message}
          className="font-serif text-ghibli-canopy text-xl md:text-2xl text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000"
        >
          {message}
        </p>

        {/* Custom Progress Bar */}
        <div className="w-64 h-1.5 rounded-full bg-ghibli-moss/10 overflow-hidden botanical-border p-px">
          <div className="h-full bg-linear-to-r from-ghibli-moss to-ghibli-sage rounded-full animate-shimmer" style={{ width: '40%' }} />
        </div>
      </div>

      {showSlowLink && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-12 text-sm text-ghibli-bark hover:text-ghibli-canopy hover:underline transition-colors relative z-10"
        >
          This is taking longer than usual — try again?
        </button>
      )}
    </div>)
}
