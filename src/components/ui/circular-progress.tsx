import { cn } from "@/lib/utils";

interface CircularProgressProps {
  /** Progress value 0–100 */
  value: number;
  /** Diameter in px (default 120) */
  size?: number;
  /** Ring thickness in SVG units (default 8) */
  strokeWidth?: number;
  /** Additional container class names */
  className?: string;
  /** Show percentage label in center */
  showLabel?: boolean;
  /** Override value label (e.g. "3/5") */
  label?: string;
  /** Label font size class (default text-lg) */
  labelClassName?: string;
  /** Track (background ring) color */
  trackClassName?: string;
}

/**
 * Animated SVG circular progress ring.
 * Inspired by Apple Fitness / Brilliant progress indicators.
 */
export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  showLabel = true,
  label,
  labelClassName,
  trackClassName,
}: CircularProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (100 - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  // Color based on progress
  const ringColor =
    clamped === 0
      ? "stroke-muted-foreground/20"
      : clamped < 33
        ? "stroke-blue-500"
        : clamped < 67
          ? "stroke-amber-500"
          : clamped < 100
            ? "stroke-emerald-500"
            : "stroke-emerald-400";

  // Glow for completed
  const glowFilter = clamped === 100 ? "drop-shadow(0 0 6px rgb(52 211 153 / 0.5))" : undefined;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full -rotate-90"
        style={{ filter: glowFilter }}
      >
        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-muted", trackClassName)}
        />
        {/* Progress arc */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(ringColor, "transition-[stroke-dashoffset] duration-700 ease-out")}
        />
      </svg>

      {/* Center label */}
      {showLabel && (
        <span
          className={cn(
            "absolute font-bold tabular-nums",
            clamped === 100
              ? "text-emerald-500"
              : "text-foreground",
            labelClassName ?? (size >= 100 ? "text-xl" : size >= 60 ? "text-sm" : "text-xs"),
          )}
        >
          {label ?? `${Math.round(clamped)}%`}
        </span>
      )}
    </div>
  );
}
