interface PlantIndicatorProps {
  probability: number;
  size?: "sm" | "md" | "lg" | "xl";
  showPercent?: boolean;
  glow?: boolean;
}

const stages = [
  "/plant-stage-1.webp",
  "/plant-stage-1.webp",
  "/plant-stage-2.webp",
  "/plant-stage-3.webp",
  "/plant-stage-4.webp",
];

const stageLabels = ["Needs Water", "Sprouting", "Growing", "Blooming", "Thriving"];

const sizeMap = {
  sm:  { img: "h-10 w-10",  px: 40,  labelPx: 10, pctPx: 10 },
  md:  { img: "h-16 w-16",  px: 64,  labelPx: 11, pctPx: 11 },
  lg:  { img: "h-28 w-28",  px: 112, labelPx: 12, pctPx: 12 },
  xl:  { img: "h-48 w-48",  px: 192, labelPx: 13, pctPx: 13 },
};

export function PlantIndicator({ probability, size = "md", showPercent = true, glow = false }: PlantIndicatorProps) {
  const stageIndex =
    probability >= 85 ? 4 :
    probability >= 70 ? 3 :
    probability >= 55 ? 2 :
    probability >= 40 ? 1 : 0;
  const { img, px, labelPx, pctPx } = sizeMap[size];

  // PERF: the breathing animation used to run on every instance. A dashboard
  // with eight courses meant eight infinite animations on blend-mode'd images,
  // and a blend mode blocks the compositor shortcut that would make them cheap.
  // Keep the motion where it reads as a focal point (the hero-sized plant) and
  // let the card plants sit still — at 28px the 4% scale was barely visible.
  const animated = size === "xl";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        {glow && (
          <>
            <div className="absolute inset-0 rounded-full bg-ghibli-sunlight/40 blur-3xl scale-125 pointer-events-none" />
            <div className="absolute inset-0 rounded-full bg-ghibli-gold/20 blur-2xl scale-110 pointer-events-none" />
          </>
        )}
        <img
          src={stages[stageIndex]}
          alt={stageLabels[stageIndex]}
          width={px}
          height={px}
          decoding="async"
          className={`relative ${img} object-contain select-none ${
            animated ? (glow ? "animate-glow-soft" : "animate-pulse-soft") : ""
          }`}
          style={glow ? undefined : { mixBlendMode: "darken" }}
        />
      </div>
      <span
        className="font-sans text-ghibli-bark"
        style={{ fontSize: labelPx }}
      >
        {stageLabels[stageIndex]}
      </span>
      {showPercent && (
        <span
          className="font-sans tabular-nums"
          style={{
            fontSize: pctPx,
            color: "hsl(140, 35%, 32%)",
            opacity: 0.72,
            letterSpacing: "0.02em",
          }}
        >
          {Math.round(probability)}%
        </span>
      )}
    </div>
  );
}
