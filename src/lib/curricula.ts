/**
 * Curriculum definitions — single source of truth for grading systems.
 *
 * Every grade option stores a normalized `value` in [0, 1] so the backend
 * can compute pass probability without knowing anything about curricula.
 * The frontend handles mapping between normalized values and grade labels.
 */

export interface GradeOption {
  label: string;
  value: number; // normalized 0–1
}

export interface Curriculum {
  id: string;
  label: string;
  description: string;
  gradeOptions: GradeOption[];
  defaultTarget: number; // normalized 0–1
}

// ---------------------------------------------------------------------------
// Curriculum definitions
// ---------------------------------------------------------------------------

const percentage: Curriculum = {
  id: "percentage",
  label: "Percentage",
  description: "Standard percentage grading (0–100%)",
  gradeOptions: [
    { label: "100%", value: 1.0 },
    { label: "95%", value: 0.95 },
    { label: "90%", value: 0.9 },
    { label: "85%", value: 0.85 },
    { label: "80%", value: 0.8 },
    { label: "75%", value: 0.75 },
    { label: "70%", value: 0.7 },
    { label: "65%", value: 0.65 },
    { label: "60%", value: 0.6 },
    { label: "55%", value: 0.55 },
    { label: "50%", value: 0.5 },
  ],
  defaultTarget: 1.0,
};

const ib: Curriculum = {
  id: "ib",
  label: "IB",
  description: "International Baccalaureate (Grades 1–7)",
  gradeOptions: [
    { label: "Grade 7", value: 7 / 7 },
    { label: "Grade 6", value: 6 / 7 },
    { label: "Grade 5", value: 5 / 7 },
    { label: "Grade 4", value: 4 / 7 },
    { label: "Grade 3", value: 3 / 7 },
    { label: "Grade 2", value: 2 / 7 },
    { label: "Grade 1", value: 1 / 7 },
  ],
  defaultTarget: 4 / 7, // Grade 4
};

const ap: Curriculum = {
  id: "ap",
  label: "AP",
  description: "Advanced Placement (Scores 1–5)",
  gradeOptions: [
    { label: "Score 5", value: 5 / 5 },
    { label: "Score 4", value: 4 / 5 },
    { label: "Score 3", value: 3 / 5 },
    { label: "Score 2", value: 2 / 5 },
    { label: "Score 1", value: 1 / 5 },
  ],
  defaultTarget: 3 / 5, // Score 3
};

const gcse: Curriculum = {
  id: "gcse",
  label: "GCSE",
  description: "General Certificate of Secondary Education (Grades 9–1)",
  gradeOptions: [
    { label: "Grade 9", value: 9 / 9 },
    { label: "Grade 8", value: 8 / 9 },
    { label: "Grade 7", value: 7 / 9 },
    { label: "Grade 6", value: 6 / 9 },
    { label: "Grade 5", value: 5 / 9 },
    { label: "Grade 4", value: 4 / 9 },
    { label: "Grade 3", value: 3 / 9 },
    { label: "Grade 2", value: 2 / 9 },
    { label: "Grade 1", value: 1 / 9 },
  ],
  defaultTarget: 4 / 9, // Grade 4
};

const aLevel: Curriculum = {
  id: "a-level",
  label: "A-Level",
  description: "GCE Advanced Level (Grades A*–E)",
  gradeOptions: [
    { label: "A*", value: 6 / 6 },
    { label: "A", value: 5 / 6 },
    { label: "B", value: 4 / 6 },
    { label: "C", value: 3 / 6 },
    { label: "D", value: 2 / 6 },
    { label: "E", value: 1 / 6 },
  ],
  defaultTarget: 3 / 6, // Grade C
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const CURRICULA: Curriculum[] = [percentage, ib, ap, gcse, aLevel];

const curriculumMap = new Map(CURRICULA.map((c) => [c.id, c]));

export const DEFAULT_CURRICULUM_ID = "percentage";

/**
 * Get a curriculum by ID. Falls back to Percentage if not found.
 */
export function getCurriculum(id: string): Curriculum {
  return curriculumMap.get(id) ?? percentage;
}

/**
 * Get the closest grade label for a normalized value within a curriculum.
 * Uses nearest-match so it works even if stored values aren't exact.
 */
export function getGradeLabel(
  curriculumId: string,
  normalizedValue: number,
): string {
  const curriculum = getCurriculum(curriculumId);
  let closest = curriculum.gradeOptions[0];
  let minDiff = Math.abs(normalizedValue - closest.value);

  for (const opt of curriculum.gradeOptions) {
    const diff = Math.abs(normalizedValue - opt.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = opt;
    }
  }

  return closest.label;
}

/**
 * Snap a normalized value to the nearest valid grade option value.
 * Useful when the curriculum changes and we need to re-map.
 */
export function snapToNearestGrade(
  curriculumId: string,
  normalizedValue: number,
): number {
  const curriculum = getCurriculum(curriculumId);
  let closest = curriculum.gradeOptions[0];
  let minDiff = Math.abs(normalizedValue - closest.value);

  for (const opt of curriculum.gradeOptions) {
    const diff = Math.abs(normalizedValue - opt.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = opt;
    }
  }

  return closest.value;
}
