interface PlantIndicatorProps {
  probability: number;
  size?: "sm" | "md" | "lg" | "xl";
  showPercent?: boolean;
  glow?: boolean;
}

const stages = [
  "/plant-stage-1.png",
  "/plant-stage-2.png",
  "/plant-stage-3.png",
  "/plant-stage-4.png",
];

const stageLabels = ["Seedling", "Sprouting", "Growing", "In Full Bloom"];

const sizeMap = {
  sm:  { img: "h-10 w-10",  labelPx: 10, pctPx: 10 },
  md:  { img: "h-16 w-16",  labelPx: 11, pctPx: 11 },
  lg:  { img: "h-28 w-28",  labelPx: 12, pctPx: 12 },
  xl:  { img: "h-48 w-48",  labelPx: 13, pctPx: 13 },
};

export function PlantIndicator({ probability, size = "md", showPercent = true, glow = false }: PlantIndicatorProps) {
  const stageIndex = probability >= 80 ? 3 : probability >= 55 ? 2 : probability >= 30 ? 1 : 0;
  const { img, labelPx, pctPx } = sizeMap[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        {glow && (
          <>
            <div className="absolute inset-0 rounded-full bg-ghibli-sunlight/40 blur-3xl scale-125 animate-shimmer pointer-events-none" />
            <div className="absolute inset-0 rounded-full bg-ghibli-gold/20 blur-2xl scale-110 pointer-events-none" />
          </>
        )}
        <img
          src={stages[stageIndex]}
          alt={stageLabels[stageIndex]}
          className={`relative ${img} object-contain select-none ${glow ? "animate-glow-soft" : "animate-pulse-soft"}`}
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
