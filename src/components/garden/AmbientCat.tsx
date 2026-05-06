import { useEffect, useState } from "react";

interface AmbientCatProps {
  /** When true, the cat fades in for one appearance. The parent triggers this once per quiz attempt. */
  trigger: boolean;
}

/**
 * Ambient peeking cat for quiz pages — renders once when triggered, then quietly retreats.
 * Sits behind page content (z-0) so it never interferes with answer interaction.
 * Honors prefers-reduced-motion and Page Visibility (won't appear if tab is backgrounded).
 */
export function AmbientCat({ trigger }: AmbientCatProps) {
  const [visible, setVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    if (!trigger || hasShown) return;

    // Respect reduced motion
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setHasShown(true);
      return;
    }

    // Don't render if tab is backgrounded
    if (document.hidden) {
      setHasShown(true);
      return;
    }

    setVisible(true);
    setHasShown(true);

    // Auto-hide after 6.9s total (1.2 fade-in + 4.5 hold + 1.2 fade-out)
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 5700); // start fade-out at 5.7s; CSS handles the 1.2s fade

    return () => clearTimeout(hideTimer);
  }, [trigger, hasShown]);

  if (!visible) return null;

  return (
    <div
      className="ambient-cat-container fixed bottom-4 right-2 md:bottom-8 md:right-6 z-0 pointer-events-none select-none"
      aria-hidden="true"
    >
      <img
        src="/cat-peeking.png"
        alt=""
        className="ambient-cat-image w-20 md:w-32 drop-shadow-md"
        style={{ mixBlendMode: "darken" }}
      />
    </div>
  );
}
