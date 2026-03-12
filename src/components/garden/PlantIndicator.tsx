interface PlantIndicatorProps {
  /** 0–100 probability */
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
  sm:  { img: "h-10 w-10",  arcR: 0,  fontSize: 11, labelSize: 10 },
  md:  { img: "h-16 w-16",  arcR: 0,  fontSize: 13, labelSize: 11 },
  lg:  { img: "h-28 w-28",  arcR: 38, fontSize: 15, labelSize: 12 },
  xl:  { img: "h-48 w-48",  arcR: 64, fontSize: 20, labelSize: 13 },
};

function ProbabilityArc({ value, radius, fontSize }: { value: number; radius: number; fontSize: number }) {
  const stroke = 3;
  const size = radius * 2 + stroke * 2 + 4;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 200;
  const endAngle = 340;
  const totalDeg = endAngle - startAngle;
  const filledDeg = (value / 100) * totalDeg;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcPath = (from: number, to: number) => {
    const x1 = cx + radius * Math.cos(toRad(from));
    const y1 = cy + radius * Math.sin(toRad(from));
    const x2 = cx + radius * Math.cos(toRad(to));
    const y2 = cy + radius * Math.sin(toRad(to));
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };
  const hue = Math.round(140 + (value / 100) * 10);
  const light = Math.round(55 - (value / 100) * 18);
  const fillColor = `hsl(${hue}, 38%, ${light}%)`;

  return (
    <svg width={size} height={size} style={{ overflow: "visible", marginTop: -8 }}>
      <path d={arcPath(startAngle, endAngle)} stroke="hsl(140, 20%, 82%)" strokeWidth={stroke} fill="none" strokeLinecap="round" opacity={0.5} />
      {value > 0 && (
        <path d={arcPath(startAngle, startAngle + filledDeg)} stroke={fillColor} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      )}
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={fontSize} fontFamily="'Nunito', sans-serif" fontWeight="700" fill={fillColor} opacity={0.85}>
        {Math.round(value)}%
      </text>
    </svg>
  );
}

export function PlantIndicator({ probability, size = "md", showPercent = true }: PlantIndicatorProps) {
  const stageIndex = probability >= 80 ? 3 : probability >= 55 ? 2 : probability >= 30 ? 1 : 0;
  const { img, arcR, fontSize, labelSize } = sizeMap[size];
  const useArc = arcR > 0 && showPercent;

  return (
    <div className="flex flex-col items-center" style={{ gap: useArc ? 0 : 4 }}>
      <img
        src={stages[stageIndex]}
        alt={stageLabels[stageIndex]}
        className={`${img} object-contain select-none animate-pulse-soft`}
        style={{ mixBlendMode: "darken" }}
      />
      {useArc ? (
        <ProbabilityArc value={probability} radius={arcR} fontSize={fontSize} />
      ) : (
        <>
          <span className="font-sans text-muted-foreground" style={{ fontSize: labelSize }}>
            {stageLabels[stageIndex]}
          </span>
          {showPercent && (
            <span className="font-sans font-semibold tabular-nums" style={{ fontSize, color: "hsl(140, 35%, 32%)", opacity: 0.78, letterSpacing: "0.02em" }}>
              {Math.round(probability)}%
            </span>
          )}
        </>
      )}
    </div>
  );
}
