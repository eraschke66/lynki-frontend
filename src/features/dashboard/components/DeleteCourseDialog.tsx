import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { CourseSummary } from "../types";

interface DeleteCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseSummary | null;
  onConfirm: (courseId: string) => Promise<void>;
}

export function DeleteCourseDialog({
  open,
  onOpenChange,
  course,
  onConfirm,
}: DeleteCourseDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!course) return;
    setDeleting(true);
    try {
      await onConfirm(course.id);
      onOpenChange(false);
    } catch {
      // Error is handled by the parent via toast
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !deleting && onOpenChange(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{course?.title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this course and{" "}
            <span className="font-semibold text-foreground">
              all of its documents, topics, concepts, and study progress
            </span>
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Prevent auto-close; we close manually after async
              handleDelete();
            }}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete Course
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
