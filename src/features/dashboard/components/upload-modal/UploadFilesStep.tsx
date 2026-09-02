import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { CoursePicker } from "./CoursePicker";
import { DropZone } from "./DropZone";
import { UploadsList } from "./UploadsList";
import { CompletionActions } from "./CompletionActions";
import type { UploadModalState } from "../../hooks/useUploadModal";

interface UploadFilesStepProps {
  state: UploadModalState;
  onGoToCourse: () => void;
  onClose: () => void;
}

export function UploadFilesStep({ state, onGoToCourse, onClose }: UploadFilesStepProps) {
  const singleFreshCourse = state.courses.length === 1 && state.selectedCourseId === state.courses[0].id;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-serif text-2xl text-ghibli-canopy">
          {singleFreshCourse ? "🌿 Step 2: Upload Study Materials" : "Upload Study Materials"}
        </DialogTitle>
        <DialogDescription className="font-sans text-sm text-ghibli-bark leading-relaxed">
          {singleFreshCourse
            ? `Your course "${state.courses[0].title}" is ready! Upload your materials to auto-extract concepts.`
            : "Select a course, then upload your study materials (PDF, DOCX, PPTX, PNG, JPEG)."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {!state.hasUploads && <CoursePicker state={state} />}
        {!state.hasUploads && <DropZone state={state} />}

        {state.error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{state.error}</p>
          </div>
        )}

        {state.hasUploads && <UploadsList uploads={state.uploads} />}

        {state.allComplete && <CompletionActions state={state} onGoToCourse={onGoToCourse} onClose={onClose} />}

        {!state.hasUploads && (
          <p className="text-xs text-center text-ghibli-bark">
            Your materials will be analyzed and concepts extracted automatically.
          </p>
        )}
      </div>
    </>
  );
}
