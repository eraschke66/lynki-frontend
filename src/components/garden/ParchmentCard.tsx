import type { CSSProperties, ReactNode } from "react";

interface ParchmentCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  style?: CSSProperties;
}

export function ParchmentCard({ children, className = "", hover = true, glow = false, style }: ParchmentCardProps) {
  return (
    <div
      style={style}
      className={`
        relative parchment-solid botanical-border parchment-texture
        rounded-[28px]
        ${hover ? "transition-all duration-500 hover:shadow-parchment-hover hover:-translate-y-0.5" : ""}
        ${glow ? "shadow-glow" : ""}
        ${className}
      `}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
