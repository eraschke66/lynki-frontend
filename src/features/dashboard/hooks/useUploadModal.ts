import { useState, useEffect } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { reportError } from "@/lib/sentry";
import { useFileUpload } from "@/features/documents/hooks/useFileUpload";
import { fetchUserCourses } from "@/features/courses";
import type { Course } from "@/features/courses";
import { fetchProfile } from "@/features/settings";
import { getCurriculum } from "@/lib/curricula";
import { useCourseCreationForm } from "./useCourseCreationForm";

export type UploadModalStep = "create_course" | "upload_files";

interface UseUploadModalArgs {
  open: boolean;
  userId: string;
  defaultCourseId?: string;
  startInCreateMode?: boolean;
  onUploadComplete?: () => void;
}

async function loadCoursesAndCurriculum(userId: string) {
  const [courses, profile] = await Promise.all([
    fetchUserCourses(userId),
    fetchProfile(userId).catch(() => ({ curriculum: "percentage" })),
  ]);
  return { courses, curriculumId: profile.curriculum };
}

/** `selectedCourseId: undefined` means "leave whatever was already selected". */
function resolveInitialStep(
  courses: Course[],
  { startInCreateMode, defaultCourseId }: { startInCreateMode?: boolean; defaultCourseId?: string },
): { step: UploadModalStep; selectedCourseId?: string } {
  if (startInCreateMode) return { step: "create_course", selectedCourseId: "" };
  if (defaultCourseId) return { step: "upload_files", selectedCourseId: defaultCourseId };
  if (courses.length === 1) return { step: "upload_files", selectedCourseId: courses[0].id };
  if (courses.length === 0) return { step: "create_course" };
  return { step: "upload_files" };
}

/**
 * All state and side effects behind the upload modal's two steps
 * (create-a-course, then upload-files), including the course-creation form
 * shared by the dedicated first step and the "create new" shortcut nested
 * inside the course picker.
 */
export function useUploadModal({
  open,
  userId,
  defaultCourseId,
  startInCreateMode,
  onUploadComplete,
}: UseUploadModalArgs) {
  const { uploading, uploads, error, handleFilesSelected, resetUploads } = useFileUpload(() => {
    onUploadComplete?.();
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(defaultCourseId ?? "");
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [step, setStep] = useState<UploadModalStep>("upload_files");

  const courseForm = useCourseCreationForm({
    userId,
    onCreated: (course) => {
      setCourses((prev) => [course, ...prev]);
      setSelectedCourseId(course.id);
      setStep("upload_files");
    },
  });

  // Load user's courses when modal opens
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;

    const run = async () => {
      setLoadingCourses(true);
      try {
        const { courses: data, curriculumId } = await loadCoursesAndCurriculum(userId);
        if (cancelled) return;
        setCourses(data);
        courseForm.setCurriculum(curriculumId);
        courseForm.setTargetGrade(getCurriculum(curriculumId).defaultTarget);
        const next = resolveInitialStep(data, { startInCreateMode, defaultCourseId });
        if (next.selectedCourseId !== undefined) setSelectedCourseId(next.selectedCourseId);
        setStep(next.step);
      } catch (err) {
        if (!cancelled) reportError("Fetch courses for upload modal failed:", err);
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- courseForm is a fresh object every render; its setters are stable.
  }, [open, userId, defaultCourseId, startInCreateMode]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (selectedCourseId) handleFilesSelected(e.target.files, userId, selectedCourseId);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading && selectedCourseId) {
      handleFilesSelected(e.dataTransfer.files, userId, selectedCourseId);
    }
  };

  const handleClose = (onOpenChange: (open: boolean) => void) => {
    if (!uploading) {
      resetUploads();
      courseForm.cancel();
      onOpenChange(false);
    }
  };

  const hasUploads = uploads.length > 0;
  const allComplete = hasUploads && uploads.every((u) => u.complete || u.error);
  const anySucceeded = uploads.some((u) => u.complete && !u.error);
  const canUpload = !!selectedCourseId && !uploading;
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return {
    uploading,
    uploads,
    error,
    resetUploads,
    courses,
    selectedCourseId,
    setSelectedCourseId,
    creatingNew: courseForm.creatingNew,
    setCreatingNew: courseForm.setCreatingNew,
    newCourseName: courseForm.name,
    setNewCourseName: courseForm.setName,
    newCourseTargetGrade: courseForm.targetGrade,
    setNewCourseTargetGrade: courseForm.setTargetGrade,
    newCourseCurriculum: courseForm.curriculum,
    loadingCourses,
    step,
    handleNewCourseCurriculumChange: courseForm.handleCurriculumChange,
    handleCreateCourse: courseForm.submit,
    onFileChange,
    handleDragOver,
    handleDrop,
    cancelCreatingNew: courseForm.cancel,
    handleClose,
    hasUploads,
    allComplete,
    anySucceeded,
    canUpload,
    selectedCourse,
  };
}

export type UploadModalState = ReturnType<typeof useUploadModal>;
