import { CheckCircle2 } from "lucide-react";

export function ComparisonCard({
  tone,
  heading,
  items,
}: {
  tone: "muted" | "primary";
  heading: string;
  items: string[];
}) {
  const isPrimary = tone === "primary";
  return (
    <div
      className={`rounded-[2rem] p-7 md:p-8 border ${
        isPrimary
          ? "parchment-solid border-ghibli-moss/30 shadow-md"
          : "bg-white/50 border-ghibli-bark/15"
      }`}
    >
      <h3
        className={`font-serif text-lg md:text-xl font-semibold mb-5 ${
          isPrimary ? "text-ghibli-canopy" : "text-ghibli-bark"
        }`}
      >
        {heading}
      </h3>
      <ul className="space-y-3">
        {items.map((it) => (
          <li
            key={it}
            className={`flex items-start gap-3 text-sm md:text-base font-sans ${
              isPrimary ? "text-ghibli-canopy" : "text-ghibli-bark"
            }`}
          >
            {isPrimary ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-ghibli-forest shrink-0" />
            ) : (
              <span className="w-4 h-4 mt-0.5 inline-flex items-center justify-center text-ghibli-bark shrink-0">
                ✕
              </span>
            )}
            <span className="leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
