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
import { getCurriculum, CURRICULA } from "@/lib/curricula";

export interface EditableCourse {
  id: string;
  title: string;
  description: string | null;
  targetGrade: number;
  curriculumType: string | null;
}

interface EditCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: EditableCourse | null;
  curriculum: string;
  onSave: (
    courseId: string,
    title: string,
    description: string,
    targetGrade?: number,
    curriculumType?: string | null,
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
    if (open && course) {
      setTitle(course.title);
      setDescription(course.description ?? "");
      const initialCurriculum = course.curriculumType ?? curriculum;
      setSelectedCurriculum(initialCurriculum);
      // Snap the stored value to the closest grade-option so Radix Select
      // can match it. Floats like 6/7 won't equal a Supabase-rounded 0.857.
      const stored = course.targetGrade ?? 1.0;
      const options = getCurriculum(initialCurriculum).gradeOptions;
      const snapped = options.length
        ? options.reduce((best, opt) =>
            Math.abs(opt.value - stored) < Math.abs(best.value - stored)
              ? opt
              : best,
          )
        : { value: stored };
      setTargetGrade(snapped.value);
      setCurriculumTouched(false);
      setError(null);
    }
  }, [open, course, curriculum]);

  // When the user switches curriculum, re-snap the target to the nearest
  // grade option of the newly-selected system so the Select stays valid.
  const handleCurriculumChange = (next: string) => {
    setSelectedCurriculum(next);
    setCurriculumTouched(true);
    const options = getCurriculum(next).gradeOptions;
    if (options.length) {
      const snapped = options.reduce((best, opt) =>
        Math.abs(opt.value - targetGrade) < Math.abs(best.value - targetGrade)
          ? opt
          : best,
      );
      setTargetGrade(snapped.value);
    }
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
      await onSave(
        course.id,
        trimmed,
        description.trim(),
        targetGrade,
        curriculumTouched ? selectedCurriculum : undefined,
      );
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
            Update the name, curriculum, and target grade for this course.
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
            <Label>Curriculum</Label>
            <Select value={selectedCurriculum} onValueChange={handleCurriculumChange}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select curriculum" />
              </SelectTrigger>
              <SelectContent>
                {CURRICULA.map((c) => (
                  // A-Level has no per-course DB slot (curriculum_type CHECK),
                  // so it can only be set as the account default. Disable it
                  // here rather than letting the save silently no-op.
                  <SelectItem
                    key={c.id}
                    value={c.id}
                    disabled={c.id === "a-level"}
                  >
                    {c.label}
                    {c.id === "a-level" ? " — set at account level" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
