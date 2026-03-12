interface PlantIndicatorProps {
  probability: number;
  size?: "sm" | "md" | "lg" | "xl";
  showPercent?: boolean;
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

export function PlantIndicator({ probability, size = "md", showPercent = true }: PlantIndicatorProps) {
  const stageIndex = probability >= 80 ? 3 : probability >= 55 ? 2 : probability >= 30 ? 1 : 0;
  const { img, labelPx, pctPx } = sizeMap[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src={stages[stageIndex]}
        alt={stageLabels[stageIndex]}
        className={`${img} object-contain select-none animate-pulse-soft`}
        style={{ mixBlendMode: "darken" }}
      />
      <span
        className="font-sans text-muted-foreground"
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
