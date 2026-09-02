import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUploadModal } from "../hooks/useUploadModal";
import { CreateCourseStep } from "./upload-modal/CreateCourseStep";
import { UploadFilesStep } from "./upload-modal/UploadFilesStep";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onUploadComplete?: () => void;
  /** Pre-select a course when opening modal from a course context */
  defaultCourseId?: string;
  /** Always open on the "create a course" step, even if the user already has courses */
  startInCreateMode?: boolean;
}

export function UploadModal({
  open,
  onOpenChange,
  userId,
  onUploadComplete,
  defaultCourseId,
  startInCreateMode,
}: UploadModalProps) {
  const navigate = useNavigate();
  const state = useUploadModal({ open, userId, defaultCourseId, startInCreateMode, onUploadComplete });

  const close = () => state.handleClose(onOpenChange);

  const goToCourse = () => {
    const target = state.selectedCourseId;
    close();
    if (target) navigate(`/course/${target}`);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        {state.step === "create_course" ? (
          <CreateCourseStep state={state} />
        ) : (
          <UploadFilesStep state={state} onGoToCourse={goToCourse} onClose={close} />
        )}
      </DialogContent>
    </Dialog>
  );
}
