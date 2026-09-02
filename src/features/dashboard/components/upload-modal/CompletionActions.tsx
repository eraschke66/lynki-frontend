import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { UploadModalState } from "../../hooks/useUploadModal";

interface CompletionActionsProps {
  state: UploadModalState;
  onGoToCourse: () => void;
  onClose: () => void;
}

export function CompletionActions({ state, onGoToCourse, onClose }: CompletionActionsProps) {
  return (
    <div className="space-y-3 pt-2">
      {state.anySucceeded && (
        <p className="text-xs text-ghibli-bark text-center">
          We're extracting concepts now — this takes 2–5 minutes. Open the course to watch them appear and start your
          first quiz.
        </p>
      )}
      {/* "Done" only closed the modal, which left the user back on
          the dashboard with no obvious next step. */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={state.resetUploads} className="rounded-full">
          Upload more
        </Button>
        {state.anySucceeded && state.selectedCourseId ? (
          <Button onClick={onGoToCourse} className="rounded-full gap-1.5 bg-ghibli-canopy hover:bg-ghibli-forest text-white">
            Go to {state.selectedCourse?.title ?? "course"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={onClose} className="rounded-full bg-ghibli-canopy hover:bg-ghibli-forest text-white">
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
