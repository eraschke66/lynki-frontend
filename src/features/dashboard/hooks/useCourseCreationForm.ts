import { useState } from "react";
import { reportError } from "@/lib/sentry";
import { createCourse } from "@/features/courses";
import type { Course } from "@/features/courses";
import { getCurriculum } from "@/lib/curricula";
import { toast } from "sonner";

interface UseCourseCreationFormArgs {
  userId: string;
  onCreated: (course: Course) => void;
}

/** The name/curriculum/target-grade form behind both places a course can be created from in the upload modal. */
export function useCourseCreationForm({ userId, onCreated }: UseCourseCreationFormArgs) {
  const [creatingNew, setCreatingNew] = useState(false);
  const [name, setName] = useState("");
  const [curriculum, setCurriculum] = useState("percentage");
  const [targetGrade, setTargetGrade] = useState<number | null>(null);

  const handleCurriculumChange = (next: string) => {
    setCurriculum(next);
    // Reset the target grade to the new curriculum's sensible default so the
    // grade Select never holds a value from a different grading system.
    setTargetGrade(getCurriculum(next).defaultTarget);
  };

  const cancel = () => {
    setCreatingNew(false);
    setName("");
  };

  const submit = async () => {
    if (!name.trim()) return;
    try {
      const curriculumDef = getCurriculum(curriculum);
      const course = await createCourse(userId, name.trim(), undefined, targetGrade ?? curriculumDef.defaultTarget, curriculum);
      onCreated(course);
      setCreatingNew(false);
      setName("");
      setTargetGrade(curriculumDef.defaultTarget);
      toast.success("Course created successfully!");
    } catch (err) {
      reportError("Failed to create course:", err);
      toast.error("Failed to create course");
    }
  };

  return {
    creatingNew,
    setCreatingNew,
    name,
    setName,
    curriculum,
    setCurriculum,
    targetGrade,
    setTargetGrade,
    handleCurriculumChange,
    cancel,
    submit,
  };
}
