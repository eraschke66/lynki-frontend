import { useEffect, useState } from "react";

export type NekoPlacement =
  | "bottom-right"   // Dashboard — curled in corner
  | "bottom-left"    // Quiz page — nestled in foliage
  | "bottom-center"  // Results / completion
  | "peek-right"     // Settings — peeking from right edge
  | "inline";        // For use inside a layout (non-fixed)

interface NekoProps {
  className?: string;
  size?: number;
  width?: number;
  /** Fixed-position placement on the page. Omit or use "inline" to position manually. */
  placement?: NekoPlacement;
}

const placementStyles: Record<NekoPlacement, React.CSSProperties> = {
  "bottom-right": {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 30,
    filter: "drop-shadow(0 4px 12px rgba(27,67,50,0.18))",
  },
  "bottom-left": {
    position: "fixed",
    bottom: 24,
    left: 28,
    zIndex: 30,
    filter: "drop-shadow(0 4px 12px rgba(27,67,50,0.18))",
  },
  "bottom-center": {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 30,
    filter: "drop-shadow(0 4px 12px rgba(27,67,50,0.18))",
  },
  "peek-right": {
    position: "fixed",
    bottom: 80,
    right: -8,
    zIndex: 30,
    filter: "drop-shadow(-4px 4px 10px rgba(27,67,50,0.15))",
    transform: "scaleX(-1)", // face inward
  },
  "inline": {},
};

export function Neko({ className = "", size, width, placement = "inline" }: NekoProps) {
  const [frame, setFrame] = useState(0);
  const w = width ?? size ?? 160;

  useEffect(() => {
    // Slightly irregular tail-wag timing for a more natural feel
    let timeout: ReturnType<typeof setTimeout>;
    const wag = () => {
      setFrame((f) => (f === 0 ? 1 : 0));
      // Vary the interval: tail sweeps slow then fast
      const nextDelay = frame === 0 ? 600 : 900;
      timeout = setTimeout(wag, nextDelay);
    };
    timeout = setTimeout(wag, 800);
    return () => clearTimeout(timeout);
  }, [frame]);

  const outerStyle: React.CSSProperties =
    placement === "inline"
      ? {
          width: w,
          display: "inline-block",
          position: "relative",
        }
      : {
          ...placementStyles[placement],
          width: w,
        };

  return (
    <div
      className={`neko-container ${className}`}
      style={outerStyle}
      aria-hidden="true"
    >
      <img
        src="/neko-1.png"
        alt=""
        style={{
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          opacity: frame === 0 ? 1 : 0,
          transition: "opacity 0.25s ease-in-out",
          mixBlendMode: "multiply",
        }}
      />
      <img
        src="/neko-2.png"
        alt=""
        style={{
          width: "100%",
          position: "relative",
          opacity: frame === 1 ? 1 : 0,
          transition: "opacity 0.25s ease-in-out",
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}
