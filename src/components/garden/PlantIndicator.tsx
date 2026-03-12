interface PlantIndicatorProps {
  /** 0–100 probability */
  probability: number;
  size?: "sm" | "md" | "lg" | "xl";
}

const stages = [
  "/plant-stage-1.png",
  "/plant-stage-2.png",
  "/plant-stage-3.png",
  "/plant-stage-4.png",
];
const stageLabels = ["Seedling", "Sprouting", "Growing", "In Full Bloom"];

const sizeMap = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-28 w-28",
  xl: "h-48 w-48",
};

export function PlantIndicator({ probability, size = "md" }: PlantIndicatorProps) {
  const stageIndex =
    probability >= 80 ? 3 : probability >= 55 ? 2 : probability >= 30 ? 1 : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src={stages[stageIndex]}
        alt={stageLabels[stageIndex]}
        className={`${sizeMap[size]} object-contain select-none animate-pulse-soft`}
      />
      <span className="text-xs font-sans text-muted-foreground">
        {stageLabels[stageIndex]}
      </span>
    </div>
  );
}
