/**
 * Garden utilities for PassAI.
 *
 * Informed by Japanese garden philosophy:
 *   kanso (簡素) — simplicity
 *   shizen (自然) — naturalness
 *   fukinsei (不均整) — asymmetry, imperfect growth
 *   wabi-sabi — beauty in imperfection
 *
 * The garden is not a reward system. It is the environment.
 * Students don't earn growth. They observe it.
 */

export interface GardenStatus {
  label: string;
  japanese: string;
  description: string;
  color: string;
  bgColor: string;
}

export function getGardenStatus(percentage: number): GardenStatus {
  if (percentage >= 75) {
    return {
      label: "In full bloom",
      japanese: "満開",
      description: "Your garden is thriving.",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
    };
  }
  if (percentage >= 60) {
    return {
      label: "Blooming",
      japanese: "開花",
      description: "Things are coming together beautifully.",
      color: "text-teal-700",
      bgColor: "bg-teal-50",
    };
  }
  if (percentage >= 40) {
    return {
      label: "Finding its rhythm",
      japanese: "成長",
      description: "Steady growth. The roots are strong.",
      color: "text-green-700",
      bgColor: "bg-green-50",
    };
  }
  if (percentage >= 20) {
    return {
      label: "Taking root",
      japanese: "芽生え",
      description: "Every garden starts here.",
      color: "text-lime-700",
      bgColor: "bg-lime-50",
    };
  }
  return {
    label: "Freshly planted",
    japanese: "種",
    description: "The seed is in the ground. Let's tend it.",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
  };
}

export function getGardenLabel(percentage: number): string {
  return getGardenStatus(percentage).label;
}

export function getAnswerFeedback(correct: boolean): { title: string } {
  return correct
    ? { title: "That one took root." }
    : { title: "That seed needs more light." };
}

export function getStudyCTA(reason: string): string {
  switch (reason) {
    case "continue": return "Tend Your Garden";
    case "new": return "Plant a Seed";
    case "review": return "Water What You've Planted";
    default: return "Begin Growing";
  }
}

export function getDashboardSubtitle(hasStudyable: boolean, reason: string | null): string {
  if (!hasStudyable) return "Your materials are settling in. Check back soon.";
  switch (reason) {
    case "continue": return "Your garden is waiting for you.";
    case "new": return "A new bed is ready for planting.";
    case "review": return "Some areas could use a little attention.";
    default: return "Everything is tended.";
  }
}

export function getProgressMessage(current: number, previous: number | null): string {
  if (previous === null) {
    return current >= 40 ? "A good start. The roots are forming." : "Every garden begins with a single seed.";
  }
  const diff = current - previous;
  if (diff > 5) return "Your garden grew.";
  if (diff > 0) return "Quiet growth. The kind that lasts.";
  if (diff === 0) return "Steady. That's how deep roots form.";
  if (diff > -5) return "Gardens don't grow in straight lines.";
  return "This area could use some attention.";
}

export function getPathLabel(current: number, total: number): string {
  if (current === 0) return "Beginning of the path";
  if (current < total / 3) return "Early steps";
  if (current < (total * 2) / 3) return "Along the way";
  if (current < total) return "Almost there";
  return "End of the path";
}

export function getScoreSummary(correct: number, total: number): string {
  const pct = total > 0 ? (correct / total) * 100 : 0;
  if (pct >= 80) return `${correct} of ${total} seeds took root. Your garden flourished.`;
  if (pct >= 60) return `${correct} of ${total} seeds took root. Good growth today.`;
  if (pct >= 40) return `${correct} of ${total} seeds took root. The soil is getting richer.`;
  return `${correct} of ${total} seeds took root. Every garden has days like this.`;
}
