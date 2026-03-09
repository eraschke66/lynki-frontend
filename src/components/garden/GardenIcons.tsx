/**
 * Ghibli-style garden icons for PassAI.
 *
 * Replaces all standard Unicode emoji with soft, hand-drawn SVGs
 * in the Studio Ghibli / watercolor aesthetic.
 *
 * Usage:
 *   <GardenIcon type="leaf" size={24} />
 *   <GardenIcon type="seedling" size={20} />
 */

type IconType =
  | "leaf"       // replaces 🌿 — general garden / section headers
  | "seedling"   // replaces 🌱 — early growth, new items
  | "blossom"    // replaces 🌺 — tips, info, quiz history header
  | "potted"     // replaces 🪴 — focus area, needs attention
  | "sprout"     // replaces 🌱 with different feel — mid-quiz encouragement
  | "droplet"    // replaces 💧 — needs water
  | "pumpkin"    // replaces 🎃 — task complete / harvest
  | "sparkle";   // replaces 🎉 — achievement / celebration

interface GardenIconProps {
  type: IconType;
  size?: number;
  className?: string;
}

export function GardenIcon({ type, size = 24, className = "" }: GardenIconProps) {
  const svgProps = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none",
    className,
    "aria-hidden": true as const,
  };

  switch (type) {
    case "leaf":
      return (
        <svg {...svgProps}>
          {/* Soft curved leaf with gentle vein — warm forest green */}
          <path
            d="M8 26C8 26 6 18 10 12C14 6 22 4 26 6C26 6 28 14 24 20C20 26 12 28 8 26Z"
            fill="#74C69D"
            opacity={0.55}
          />
          <path
            d="M8 26C8 26 6 18 10 12C14 6 22 4 26 6C26 6 28 14 24 20C20 26 12 28 8 26Z"
            stroke="#40916C"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Central vein — gentle curve */}
          <path
            d="M10 24C12 20 15 16 18 13C21 10 24 8 26 6"
            stroke="#2D6A4F"
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.5}
          />
          {/* Side veins */}
          <path d="M14 20C15 18 17 16 18 15" stroke="#2D6A4F" strokeWidth={0.7} strokeLinecap="round" opacity={0.35} />
          <path d="M12 18C14 17 15 15 16 14" stroke="#2D6A4F" strokeWidth={0.7} strokeLinecap="round" opacity={0.35} />
        </svg>
      );

    case "seedling":
      return (
        <svg {...svgProps}>
          {/* Soil mound */}
          <ellipse cx={16} cy={26} rx={8} ry={3} fill="#8B6914" opacity={0.3} />
          {/* Stem */}
          <path
            d="M16 26C16 26 16 20 16 18"
            stroke="#52B788"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          {/* Left cotyledon */}
          <path
            d="M16 18C14 16 10 15 9 16C8 17 10 19 12 19C14 19 16 18 16 18Z"
            fill="#95D5B2"
            stroke="#52B788"
            strokeWidth={1}
            strokeLinejoin="round"
          />
          {/* Right cotyledon */}
          <path
            d="M16 18C18 16 22 15 23 16C24 17 22 19 20 19C18 19 16 18 16 18Z"
            fill="#95D5B2"
            stroke="#52B788"
            strokeWidth={1}
            strokeLinejoin="round"
          />
          {/* Tiny center bud */}
          <circle cx={16} cy={16.5} r={1.2} fill="#B7E4C7" />
        </svg>
      );

    case "blossom":
      return (
        <svg {...svgProps}>
          {/* Petals — soft peach/pink watercolor feel */}
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx={16}
              cy={10}
              rx={4}
              ry={6.5}
              fill="#F4A8B5"
              opacity={0.6}
              transform={`rotate(${angle} 16 16)`}
            />
          ))}
          {/* Petal outlines */}
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={`s-${angle}`}
              cx={16}
              cy={10}
              rx={4}
              ry={6.5}
              fill="none"
              stroke="#E07A8A"
              strokeWidth={0.8}
              opacity={0.5}
              transform={`rotate(${angle} 16 16)`}
            />
          ))}
          {/* Center — warm gold */}
          <circle cx={16} cy={16} r={3.5} fill="#FBBF24" opacity={0.8} />
          <circle cx={16} cy={16} r={3.5} fill="none" stroke="#D97706" strokeWidth={0.7} opacity={0.5} />
          {/* Center dots */}
          <circle cx={15} cy={15.5} r={0.8} fill="#D97706" opacity={0.4} />
          <circle cx={17} cy={16.5} r={0.6} fill="#D97706" opacity={0.4} />
        </svg>
      );

    case "potted":
      return (
        <svg {...svgProps}>
          {/* Pot — terracotta */}
          <path
            d="M11 20L10 28H22L21 20H11Z"
            fill="#C4794A"
            opacity={0.7}
          />
          <path
            d="M11 20L10 28H22L21 20H11Z"
            stroke="#A05A2C"
            strokeWidth={1}
            strokeLinejoin="round"
            opacity={0.5}
          />
          {/* Pot rim */}
          <rect x={9.5} y={19} width={13} height={2.5} rx={1} fill="#D4956B" opacity={0.7} />
          {/* Plant — reaching upward */}
          <path
            d="M16 19C16 19 14 14 12 12C10 10 8 10 8 11C8 12 10 14 13 15C14 15.5 16 16 16 16"
            fill="#74C69D"
            opacity={0.5}
          />
          <path
            d="M16 19C16 19 18 13 20 11C22 9 24 9 24 10C24 11 22 13 19 14.5C17.5 15.5 16 16 16 16"
            fill="#74C69D"
            opacity={0.5}
          />
          <path
            d="M16 19V12"
            stroke="#52B788"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {/* Small leaf on stem */}
          <path
            d="M16 14C17 13 19 12.5 19.5 13C20 13.5 18.5 14.5 17 14.8"
            fill="#95D5B2"
            stroke="#52B788"
            strokeWidth={0.7}
          />
        </svg>
      );

    case "sprout":
      return (
        <svg {...svgProps}>
          {/* Rising sprout — more dynamic than seedling, for encouragement */}
          <path
            d="M16 28C16 28 15 22 14 18C13.5 16 14 14 16 14"
            stroke="#52B788"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          {/* Unfurling leaf — left */}
          <path
            d="M14 16C11 14 8 14 7 15.5C6 17 8 18.5 11 18C13 17.5 14 16 14 16Z"
            fill="#B7E4C7"
            stroke="#52B788"
            strokeWidth={0.8}
          />
          {/* Unfurling leaf — right */}
          <path
            d="M16 14C18 11 21 9 23 9.5C25 10 24 12.5 21 14C19 15 16 14 16 14Z"
            fill="#95D5B2"
            stroke="#40916C"
            strokeWidth={0.8}
          />
          {/* Tiny dew drop */}
          <ellipse cx={20} cy={11} rx={1.2} ry={1.5} fill="#A8DADC" opacity={0.6} />
        </svg>
      );

    case "droplet":
      return (
        <svg {...svgProps}>
          {/* Water droplet — soft blue, Ghibli rain style */}
          <path
            d="M16 6C16 6 10 14 10 19C10 22.3 12.7 25 16 25C19.3 25 22 22.3 22 19C22 14 16 6 16 6Z"
            fill="#7DD3E8"
            opacity={0.5}
          />
          <path
            d="M16 6C16 6 10 14 10 19C10 22.3 12.7 25 16 25C19.3 25 22 22.3 22 19C22 14 16 6 16 6Z"
            stroke="#4AA8C0"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          {/* Highlight */}
          <ellipse cx={13.5} cy={18} rx={2} ry={3} fill="white" opacity={0.35} transform="rotate(-15 13.5 18)" />
        </svg>
      );

    case "pumpkin":
      return (
        <svg {...svgProps}>
          {/* Harvest pumpkin — warm, autumnal */}
          <ellipse cx={16} cy={19} rx={9} ry={7} fill="#F4A950" opacity={0.65} />
          <ellipse cx={16} cy={19} rx={9} ry={7} stroke="#D4832A" strokeWidth={1} opacity={0.5} fill="none" />
          {/* Segments */}
          <path d="M16 12C16 12 14 16 14 19C14 22 16 26 16 26" stroke="#D4832A" strokeWidth={0.7} opacity={0.3} />
          <path d="M11 14C11 14 12 18 12.5 19C13 22 12 25 12 25" stroke="#D4832A" strokeWidth={0.7} opacity={0.25} />
          <path d="M21 14C21 14 20 18 19.5 19C19 22 20 25 20 25" stroke="#D4832A" strokeWidth={0.7} opacity={0.25} />
          {/* Stem */}
          <path d="M16 12C16 12 15.5 9 16.5 7" stroke="#6B8E23" strokeWidth={1.5} strokeLinecap="round" />
          {/* Tiny leaf */}
          <path d="M16.5 8C17.5 7 19 7 19.5 7.5C20 8 19 9 17.5 8.5" fill="#95D5B2" stroke="#6B8E23" strokeWidth={0.5} />
        </svg>
      );

    case "sparkle":
      return (
        <svg {...svgProps}>
          {/* Celebration sparkle — warm gold, like firefly light */}
          {/* Main star */}
          <path
            d="M16 4L18 12L26 14L18 16L16 24L14 16L6 14L14 12L16 4Z"
            fill="#FBBF24"
            opacity={0.7}
          />
          <path
            d="M16 4L18 12L26 14L18 16L16 24L14 16L6 14L14 12L16 4Z"
            stroke="#D97706"
            strokeWidth={0.8}
            opacity={0.5}
            strokeLinejoin="round"
          />
          {/* Small sparkles */}
          <circle cx={24} cy={8} r={1.5} fill="#FBBF24" opacity={0.5} />
          <circle cx={8} cy={22} r={1.2} fill="#FBBF24" opacity={0.4} />
          <circle cx={25} cy={22} r={1} fill="#FCD34D" opacity={0.45} />
          {/* Center glow */}
          <circle cx={16} cy={14} r={2.5} fill="#FEF3C7" opacity={0.5} />
        </svg>
      );

    default:
      return null;
  }
}

/**
 * Inline replacement for emoji text usage.
 * Use this when you need an icon inline with text.
 */
export function GardenInlineIcon({ type, size = 18, className = "" }: GardenIconProps) {
  return (
    <span className={`inline-flex items-center align-text-bottom ${className}`}>
      <GardenIcon type={type} size={size} />
    </span>
  );
}
