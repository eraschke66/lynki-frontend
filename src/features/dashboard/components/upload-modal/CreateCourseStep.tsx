import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CourseFormFields } from "./CourseFormFields";
import type { UploadModalState } from "../../hooks/useUploadModal";

export function CreateCourseStep({ state }: { state: UploadModalState }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-serif text-2xl text-ghibli-canopy flex items-center gap-2">
          <span>🌱 Step 1: Create a Course</span>
        </DialogTitle>
        <DialogDescription className="font-sans text-sm text-ghibli-bark leading-relaxed">
          Before uploading study materials, let's create a course space to plant your first seed.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <CourseFormFields
          variant="full"
          name={state.newCourseName}
          onNameChange={state.setNewCourseName}
          onSubmit={state.handleCreateCourse}
          curriculum={state.newCourseCurriculum}
          onCurriculumChange={state.handleNewCourseCurriculumChange}
          targetGrade={state.newCourseTargetGrade}
          onTargetGradeChange={state.setNewCourseTargetGrade}
        />

        <div className="flex gap-3 justify-end pt-2">
          <Button
            onClick={state.handleCreateCourse}
            disabled={!state.newCourseName.trim()}
            className="rounded-full px-6 bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy text-white font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Create Course & Continue →
          </Button>
        </div>
      </div>
    </>
  );
}
