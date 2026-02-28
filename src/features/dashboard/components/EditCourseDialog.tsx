import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurriculum } from "@/lib/curricula";
import type { CourseSummary } from "../types";

interface EditCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseSummary | null;
  curriculum: string;
  onSave: (
    courseId: string,
    title: string,
    description: string,
    targetGrade?: number,
  ) => Promise<void>;
}

export function EditCourseDialog({
  open,
  onOpenChange,
  course,
  curriculum,
  onSave,
}: EditCourseDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetGrade, setTargetGrade] = useState<number>(1.0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const curriculumInfo = getCurriculum(curriculum);

  // Sync form state when the dialog opens or course changes
  useEffect(() => {
    if (open && course) {
      setTitle(course.title);
      setDescription(course.description ?? "");
      setTargetGrade(course.targetGrade ?? 1.0);
      setError(null);
    }
  }, [open, course]);

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
      await onSave(course.id, trimmed, description.trim(), targetGrade);
      onOpenChange(false);
    } catch {
      setError("Failed to update course. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update the name or description for this course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="course-title">Name</Label>
            <Input
              id="course-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biology 101"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !saving) handleSave();
              }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-description">Description (optional)</Label>
            <Textarea
              id="course-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of this course..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Target Passing Grade</Label>
            <Select
              value={String(targetGrade)}
              onValueChange={(v) => setTargetGrade(parseFloat(v))}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select target grade" />
              </SelectTrigger>
              <SelectContent>
                {curriculumInfo.gradeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
