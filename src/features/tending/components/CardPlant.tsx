/**
 * Small per-card plant indicator that grows across a recall session.
 *
 * Mirrors PlantIndicator's tier mapping but renders the asset only —
 * no label, no percent, no glow. Designed to sit in the lower-right
 * corner of an austere parchment card.
 *
 * Tier mapping uses 4 stages (the project's full library). Erik confirmed
 * 4-tier targeting; if a 5th asset is ever commissioned this is a one-line
 * threshold change here and in PlantIndicator.
 *
 * `partial` overlays the *next* tier image at low opacity over the current
 * tier — the visual treatment for "Show me again" on a recall card. The
 * plant looks like it's reaching for the next size without committing the
 * full grow. Cleared on the next "Got it" when tier actually advances.
 */

const PLANT_STAGES = [
  "/plant-stage-1.webp",
  "/plant-stage-2.webp",
  "/plant-stage-3.webp",
  "/plant-stage-4.webp",
];

const PLANT_LABELS = ["Seedling", "Sprouting", "Growing", "In Full Bloom"];

export const MAX_PLANT_TIER = PLANT_STAGES.length - 1;

const PARTIAL_OVERLAY_OPACITY = 0.35;

interface CardPlantProps {
  /** Integer tier 0..MAX_PLANT_TIER. Out-of-range values are clamped. */
  tier: number;
  /** When true and tier < MAX_PLANT_TIER, overlay the next-tier image at ~35% opacity to signal a "reach" — Show me again's visual treatment. */
  partial?: boolean;
}

export function CardPlant({ tier, partial = false }: CardPlantProps) {
  const clamped = Math.max(0, Math.min(MAX_PLANT_TIER, Math.round(tier)));
  const showOverlay = partial && clamped < MAX_PLANT_TIER;

  return (
    <div className="relative w-32 h-32 md:w-64 md:h-64 select-none pointer-events-none">
      <img
        src={PLANT_STAGES[clamped]}
        alt={PLANT_LABELS[clamped]}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-contain transition-all duration-500 ease-out"
        style={{ mixBlendMode: "darken" }}
      />
      {showOverlay && (
        <img
          src={PLANT_STAGES[clamped + 1]}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ease-out"
          style={{ mixBlendMode: "darken", opacity: PARTIAL_OVERLAY_OPACITY }}
        />
      )}
    </div>
  );
}
