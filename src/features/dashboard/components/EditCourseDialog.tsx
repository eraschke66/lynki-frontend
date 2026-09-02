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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRICULA } from "@/lib/curricula";
import { useEditCourseForm } from "../hooks/useEditCourseForm";

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

export function EditCourseDialog({ open, onOpenChange, course, curriculum, onSave }: EditCourseDialogProps) {
  const form = useEditCourseForm({ open, course, curriculum, onSave, onOpenChange });

  return (
    <Dialog open={open} onOpenChange={(v) => !form.saving && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>Update the name, curriculum, and target grade for this course.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="course-title">Name</Label>
            <Input
              id="course-title"
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
              placeholder="e.g. Biology 101"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !form.saving) form.handleSave();
              }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-description">Description (optional)</Label>
            <Textarea
              id="course-description"
              value={form.description}
              onChange={(e) => form.setDescription(e.target.value)}
              placeholder="A short description of this course..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Curriculum</Label>
            <Select value={form.selectedCurriculum} onValueChange={form.handleCurriculumChange}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select curriculum" />
              </SelectTrigger>
              <SelectContent>
                {CURRICULA.map((c) => (
                  // A-Level has no per-course DB slot (curriculum_type CHECK),
                  // so it can only be set as the account default. Disable it
                  // here rather than letting the save silently no-op.
                  <SelectItem key={c.id} value={c.id} disabled={c.id === "a-level"}>
                    {c.label}
                    {c.id === "a-level" ? " — set at account level" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Passing Grade</Label>
            <Select value={String(form.targetGrade)} onValueChange={(v) => form.setTargetGrade(parseFloat(v))}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select target grade" />
              </SelectTrigger>
              <SelectContent>
                {form.curriculumInfo.gradeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.error && <p className="text-sm text-destructive">{form.error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={form.saving}>
            Cancel
          </Button>
          <Button onClick={form.handleSave} disabled={form.saving || !form.title.trim()}>
            {form.saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
