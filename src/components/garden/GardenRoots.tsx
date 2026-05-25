import { useEffect, useState, type RefObject } from "react";

interface GardenRootsProps {
  /**
   * Ref to the container whose children are the topic cards. Each non-svg
   * child element is treated as one card; centers are computed from
   * getBoundingClientRect and connected with cubic-bezier curves.
   */
  containerRef: RefObject<HTMLElement | null>;
}

/**
 * Static decorative tracery behind the topic grid. Commit 1 of 3 — purely
 * decorative; later commits will make the roots semantic (shared concepts)
 * then live (post-Tending pulse).
 *
 * The visible layout is a vertical stack (single column at every viewport),
 * so the roots connect each card to the one directly below with a gentle
 * left/right alternating sway for an organic vine feel.
 */
export function GardenRoots({ containerRef }: GardenRootsProps) {
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const containerRect = el.getBoundingClientRect();
      const cards = Array.from(el.children).filter(
        (c) => c.tagName.toLowerCase() !== "svg",
      ) as HTMLElement[];

      if (cards.length < 2) {
        setPaths([]);
        return;
      }

      const centers = cards.map((card) => {
        const r = card.getBoundingClientRect();
        return {
          cx: r.left - containerRect.left + r.width / 2,
          cy: r.top - containerRect.top + r.height / 2,
        };
      });

      const next: string[] = [];
      for (let i = 0; i < centers.length - 1; i++) {
        const a = centers[i];
        const b = centers[i + 1];
        const dy = b.cy - a.cy;
        // Alternate horizontal sway per segment so the vine reads as
        // organic, not as a single straight line.
        const sway = (i % 2 === 0 ? 1 : -1) * Math.min(60, Math.abs(dy) * 0.25);
        next.push(
          `M ${a.cx} ${a.cy} ` +
            `C ${a.cx + sway} ${a.cy + dy * 0.4}, ` +
            `${b.cx - sway} ${b.cy - dy * 0.4}, ` +
            `${b.cx} ${b.cy}`,
        );
      }
      setPaths(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  if (paths.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="var(--color-garden-root)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </svg>
  );
}
