import type { ReactNode } from "react";

interface ParchmentCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function ParchmentCard({ children, className = "", hover = true }: ParchmentCardProps) {
  return (
    <div
      className={`
        relative bg-card rounded-parchment shadow-parchment parchment-texture
        border border-border/50
        ${hover ? "transition-shadow duration-500 hover:shadow-parchment-hover" : ""}
        ${className}
      `}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
