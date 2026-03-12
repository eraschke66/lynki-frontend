/**
 * Garden icons — Sora-generated Studio Ghibli watercolor PNGs.
 *
 * Usage:
 *   <GardenIcon type="leaf" size={24} />
 *   <GardenInlineIcon type="seedling" size={20} />
 */

type IconType =
  | "leaf"       // general garden / section headers
  | "seedling"   // early growth, new items
  | "blossom"    // tips, info, quiz history header
  | "potted"     // focus area, needs attention
  | "sprout"     // mid-quiz encouragement
  | "droplet"    // needs water
  | "pumpkin"    // task complete / harvest
  | "sparkle";   // achievement / celebration

const ICON_MAP: Record<IconType, string> = {
  leaf:     "/healthy-icon.png",
  seedling: "/growing-icon.png",
  blossom:  "/blooming-icon.png",
  potted:   "/healthy-icon.png",
  sprout:   "/growing-icon.png",
  droplet:  "/water-droplet-icon.png",
  pumpkin:  "/thriving-tree-icon.png",
  sparkle:  "/thriving-tree-icon.png",
};

interface GardenIconProps {
  type: IconType;
  size?: number;
  className?: string;
}

export function GardenIcon({ type, size = 24, className = "" }: GardenIconProps) {
  return (
    <img
      src={ICON_MAP[type]}
      alt=""
      aria-hidden
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "inline-block",
        verticalAlign: "middle",
      }}
    />
  );
}

export function GardenInlineIcon({ type, size = 18, className = "" }: GardenIconProps) {
  return (
    <img
      src={ICON_MAP[type]}
      alt=""
      aria-hidden
      className={`inline-block align-middle ${className}`}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
      }}
    />
  );
}
