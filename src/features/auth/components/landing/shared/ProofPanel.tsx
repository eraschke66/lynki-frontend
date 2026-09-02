import type { ReactNode } from "react";

export function ProofPanel({
  align,
  label,
  title,
  text,
  visual,
}: {
  align: "left" | "right";
  label: string;
  title: string;
  text: string;
  visual: ReactNode;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
      <div className={align === "right" ? "lg:order-2" : ""}>
        <span className="inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest mb-3 px-3 py-1 rounded-full bg-ghibli-mist/60 border border-ghibli-moss/15">
          {label}
        </span>
        <h3 className="font-serif text-2xl md:text-3xl font-semibold text-ghibli-canopy leading-tight mb-3">
          {title}
        </h3>
        <p className="font-serif text-base md:text-lg text-ghibli-bark leading-relaxed max-w-md">
          {text}
        </p>
      </div>
      <div className={align === "right" ? "lg:order-1" : ""}>{visual}</div>
    </div>
  );
}
