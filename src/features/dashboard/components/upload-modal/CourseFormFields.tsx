import type { KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRICULA, getCurriculum } from "@/lib/curricula";

interface CourseFormFieldsProps {
  /** "full" is the dedicated create-course step; "compact" is the inline shortcut in the course picker. */
  variant: "full" | "compact";
  name: string;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  curriculum: string;
  onCurriculumChange: (value: string) => void;
  targetGrade: number | null;
  onTargetGradeChange: (value: number) => void;
}

/** The name/curriculum/target-grade fields shared by both places a course can be created from. */
export function CourseFormFields({
  variant,
  name,
  onNameChange,
  onSubmit,
  curriculum,
  onCurriculumChange,
  targetGrade,
  onTargetGradeChange,
}: CourseFormFieldsProps) {
  const isFull = variant === "full";
  const labelClass = isFull ? "font-sans text-sm font-semibold text-ghibli-canopy" : "text-xs text-ghibli-bark";
  const fieldGap = isFull ? "space-y-2" : "space-y-1.5";
  const triggerClass = isFull ? "w-full border-ghibli-moss/35 focus:ring-ghibli-forest" : "w-full";

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") onSubmit();
  };

  return (
    <>
      <div className={fieldGap}>
        {isFull && (
          <Label htmlFor="courseName" className={labelClass}>
            Course Name
          </Label>
        )}
        <Input
          id={isFull ? "courseName" : undefined}
          placeholder={isFull ? "e.g., Biology 101, AP Literature, Calculus" : "Course name (e.g. Biology 101)"}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className={
            isFull ? "border-ghibli-moss/35 focus-visible:ring-ghibli-forest focus-visible:border-ghibli-forest" : "border-ghibli-moss/35"
          }
        />
      </div>

      <div className={fieldGap}>
        <Label className={labelClass}>Curriculum</Label>
        <Select value={curriculum} onValueChange={onCurriculumChange}>
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Select curriculum" />
          </SelectTrigger>
          <SelectContent>
            {CURRICULA.map((c) => (
              // A-Level has no per-course DB slot; offer it only as the
              // account default (Settings), not per course.
              <SelectItem key={c.id} value={c.id} disabled={c.id === "a-level"}>
                {c.label}
                {c.id === "a-level" ? " — set at account level" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={fieldGap}>
        <Label className={labelClass}>Target passing grade</Label>
        <Select value={String(targetGrade ?? "")} onValueChange={(v) => onTargetGradeChange(parseFloat(v))}>
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Select target grade" />
          </SelectTrigger>
          <SelectContent>
            {getCurriculum(curriculum).gradeOptions.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFull && (
          <p className="text-[11px] font-sans italic text-ghibli-bark">
            This target will be used to calculate your pass probability.
          </p>
        )}
      </div>
    </>
  );
}
