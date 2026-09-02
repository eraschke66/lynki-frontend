import { useState, useEffect } from "react";
import { getCurriculum } from "@/lib/curricula";
import type { EditableCourse } from "../components/EditCourseDialog";

function snapToNearestGrade(gradeOptions: { value: number }[], target: number) {
  if (!gradeOptions.length) return target;
  return gradeOptions.reduce((best, opt) => (Math.abs(opt.value - target) < Math.abs(best.value - target) ? opt : best))
    .value;
}

interface UseEditCourseFormArgs {
  open: boolean;
  course: EditableCourse | null;
  curriculum: string;
  onSave: (
    courseId: string,
    title: string,
    description: string,
    targetGrade?: number,
    curriculumType?: string | null,
  ) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function useEditCourseForm({ open, course, curriculum, onSave, onOpenChange }: UseEditCourseFormArgs) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetGrade, setTargetGrade] = useState<number>(1.0);
  const [selectedCurriculum, setSelectedCurriculum] = useState(curriculum);
  // Tracks whether the user actually changed the curriculum select. If not, we
  // leave curriculum_type untouched on save so an inheriting course (null)
  // keeps following the account default instead of being silently pinned.
  const [curriculumTouched, setCurriculumTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const curriculumInfo = getCurriculum(selectedCurriculum);

  // Sync form state when the dialog opens or course changes
  useEffect(() => {
    if (!open || !course) return;
    setTitle(course.title);
    setDescription(course.description ?? "");
    const initialCurriculum = course.curriculumType ?? curriculum;
    setSelectedCurriculum(initialCurriculum);
    // Snap the stored value to the closest grade-option so Radix Select
    // can match it. Floats like 6/7 won't equal a Supabase-rounded 0.857.
    const stored = course.targetGrade ?? 1.0;
    setTargetGrade(snapToNearestGrade(getCurriculum(initialCurriculum).gradeOptions, stored));
    setCurriculumTouched(false);
    setError(null);
  }, [open, course, curriculum]);

  // When the user switches curriculum, re-snap the target to the nearest
  // grade option of the newly-selected system so the Select stays valid.
  const handleCurriculumChange = (next: string) => {
    setSelectedCurriculum(next);
    setCurriculumTouched(true);
    setTargetGrade((current) => snapToNearestGrade(getCurriculum(next).gradeOptions, current));
  };

  const handleSave = async () => {
    if (!course) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Course name cannot be empty.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(course.id, trimmed, description.trim(), targetGrade, curriculumTouched ? selectedCurriculum : undefined);
      onOpenChange(false);
    } catch {
      setError("Failed to update course. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    targetGrade,
    setTargetGrade,
    selectedCurriculum,
    handleCurriculumChange,
    curriculumInfo,
    saving,
    error,
    handleSave,
  };
}
