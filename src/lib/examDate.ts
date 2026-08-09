/**
 * Exam-date helpers.
 *
 * Exam dates are stored as plain calendar days ("2026-11-12"), with no time and
 * no zone. `new Date("2026-11-12")` parses that as UTC midnight, so subtracting
 * a locally-constructed "today" mixes two different zeroes and can land a whole
 * day out either side of UTC. Everything here works in local calendar days
 * instead, so the number a student sees matches the days they can actually
 * cross off a calendar.
 */

/** Parse a "YYYY-MM-DD" string as local midnight. */
export function parseCalendarDate(date: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) {
    const fallback = new Date(date);
    return Number.isNaN(fallback.getTime()) ? null : startOfLocalDay(fallback);
  }
  const parsed = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Today as a "YYYY-MM-DD" string in the user's own zone (for `min=` on date inputs). */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Whole calendar days from today until `date`. 0 means the exam is today,
 * negative means it has passed. Rounding absorbs the one-hour wobble a DST
 * boundary inside the range would otherwise introduce.
 */
export function daysUntil(date: string, now: Date = new Date()): number | null {
  const target = parseCalendarDate(date);
  if (!target) return null;
  return Math.round(
    (target.getTime() - startOfLocalDay(now).getTime()) / 86_400_000,
  );
}

/** "Thursday, 12 November" — the exam date spelled out. */
export function formatExamDate(date: string): string {
  const parsed = parseCalendarDate(date);
  if (!parsed) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Plain-English restatement of the gap, so the date -> number mapping is never
 * something the student has to infer.
 */
export function describeGrowingWindow(days: number): string {
  if (days <= 0) return "Your exam is today.";
  if (days === 1) return "Your exam is tomorrow.";
  if (days < 14) return `That's ${days} days to study, starting today.`;
  const weeks = Math.round(days / 7);
  return `That's about ${weeks} weeks to study, starting today.`;
}
