import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { CourseFormFields } from "./CourseFormFields";
import type { UploadModalState } from "../../hooks/useUploadModal";

export function CoursePicker({ state }: { state: UploadModalState }) {
  return (
    <div className="space-y-2">
      <Label className="font-sans text-sm font-semibold text-ghibli-canopy">Course</Label>
      {state.creatingNew ? (
        <div className="space-y-3">
          <CourseFormFields
            variant="compact"
            name={state.newCourseName}
            onNameChange={state.setNewCourseName}
            onSubmit={state.handleCreateCourse}
            curriculum={state.newCourseCurriculum}
            onCurriculumChange={state.handleNewCourseCurriculumChange}
            targetGrade={state.newCourseTargetGrade}
            onTargetGradeChange={state.setNewCourseTargetGrade}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={state.handleCreateCourse}
              disabled={!state.newCourseName.trim()}
              className="rounded-full bg-ghibli-canopy text-white hover:bg-ghibli-forest"
            >
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={state.cancelCreatingNew} className="rounded-full">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Select value={state.selectedCourseId} onValueChange={state.setSelectedCourseId} disabled={state.loadingCourses}>
            <SelectTrigger className="flex-1 border-ghibli-moss/35">
              <SelectValue placeholder={state.loadingCourses ? "Loading courses..." : "Select a course"} />
            </SelectTrigger>
            <SelectContent>
              {state.courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="outline"
            onClick={() => state.setCreatingNew(true)}
            title="Create new course"
            className="border-ghibli-moss/35 text-ghibli-canopy"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
