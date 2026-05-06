import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

type CatStage = "off" | "walking-in" | "sitting-pre" | "grooming" | "sitting-post" | "walking-out";

const POSE_SRC: Record<Exclude<CatStage, "off">, string> = {
  "walking-in": "/cat-walking.png",
  "sitting-pre": "/cat-sitting.png",
  "grooming": "/cat-grooming.png",
  "sitting-post": "/cat-sitting.png",
  "walking-out": "/cat-walking.png",
};

const STAGE_MS = {
  "walking-in": 8000,
  "sitting-pre": 1500,
  "grooming": 4000,
  "sitting-post": 1500,
  "walking-out": 12000,
};

const MIN_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
const MAX_INTERVAL_MS = 8 * 60 * 1000; // 8 minutes

/**
 * RoamingCat — a watercolor cat that walks across the page, pauses to groom itself, then exits.
 * Three sprite poses, multi-stage timing. Random 4–8 min interval.
 * Suppressed on quiz routes, when tab is hidden, when reduced-motion is set.
 */
export function RoamingCat() {
  const { pathname } = useLocation();
  const [stage, setStage] = useState<CatStage>("off");
  const timeoutsRef = useRef<number[]>([]);

  const isQuizPage =
    /^\/test\/[^/]+$/.test(pathname) ||
    /^\/course\/[^/]+\/topic-quiz\/[^/]+$/.test(pathname);

  useEffect(() => {
    if (isQuizPage) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let cancelled = false;

    const clearAllTimeouts = () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
    };

    const scheduleNext = () => {
      if (cancelled) return;
      const interval = MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
      const id = window.setTimeout(() => {
        if (cancelled) return;
        if (document.hidden) {
          scheduleNext();
          return;
        }
        runCycle();
      }, interval);
      timeoutsRef.current.push(id);
    };

    const runCycle = () => {
      if (cancelled) return;

      setStage("walking-in");
      const t1 = window.setTimeout(() => {
        if (cancelled) return;
        setStage("sitting-pre");
        const t2 = window.setTimeout(() => {
          if (cancelled) return;
          setStage("grooming");
          const t3 = window.setTimeout(() => {
            if (cancelled) return;
            setStage("sitting-post");
            const t4 = window.setTimeout(() => {
              if (cancelled) return;
              setStage("walking-out");
              const t5 = window.setTimeout(() => {
                if (cancelled) return;
                setStage("off");
                scheduleNext();
              }, STAGE_MS["walking-out"]);
              timeoutsRef.current.push(t5);
            }, STAGE_MS["sitting-post"]);
            timeoutsRef.current.push(t4);
          }, STAGE_MS["grooming"]);
          timeoutsRef.current.push(t3);
        }, STAGE_MS["sitting-pre"]);
        timeoutsRef.current.push(t2);
      }, STAGE_MS["walking-in"]);
      timeoutsRef.current.push(t1);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      clearAllTimeouts();
    };
  }, [isQuizPage]);

  if (stage === "off" || isQuizPage) return null;

  return (
    <div
      className={`roaming-cat-container roaming-cat-${stage} fixed bottom-12 md:bottom-20 z-30 pointer-events-none select-none`}
      aria-hidden="true"
    >
      <img
        src={POSE_SRC[stage]}
        alt=""
        className="roaming-cat-image w-24 md:w-36 drop-shadow-md"
        style={{
          // Soft radial mask so the cream paper bg of the asset dissolves into the scene
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 80% at 50% 55%, black 50%, rgba(0,0,0,0.85) 72%, transparent 95%)",
          maskImage:
            "radial-gradient(ellipse 75% 80% at 50% 55%, black 50%, rgba(0,0,0,0.85) 72%, transparent 95%)",
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}
