/**
 * Small per-card plant indicator that grows across a recall session.
 *
 * Mirrors PlantIndicator's tier mapping but renders the asset only —
 * no label, no percent, no glow. Designed to sit in the lower-right
 * corner of an austere parchment card.
 *
 * Tier mapping uses 4 stages (the project's full library). With 4-card
 * mock sessions, full Got-it advances reach tier 3 by the last card.
 */

const PLANT_STAGES = [
  "/plant-stage-1.png",
  "/plant-stage-2.png",
  "/plant-stage-3.png",
  "/plant-stage-4.png",
];

const PLANT_LABELS = ["Seedling", "Sprouting", "Growing", "In Full Bloom"];

export const MAX_PLANT_TIER = PLANT_STAGES.length - 1;

interface CardPlantProps {
  /** Integer tier 0..MAX_PLANT_TIER. Out-of-range values are clamped. */
  tier: number;
}

export function CardPlant({ tier }: CardPlantProps) {
  const clamped = Math.max(0, Math.min(MAX_PLANT_TIER, Math.round(tier)));
  return (
    <img
      src={PLANT_STAGES[clamped]}
      alt={PLANT_LABELS[clamped]}
      aria-hidden="true"
      className="w-14 h-14 md:w-16 md:h-16 object-contain transition-all duration-500 ease-out select-none pointer-events-none"
      style={{ mixBlendMode: "darken" }}
    />
  );
}
