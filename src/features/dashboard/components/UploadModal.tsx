import { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  CheckCircle,
  X,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useFileUpload } from "@/features/documents/hooks/useFileUpload";
import { fetchUserCourses, createCourse } from "@/features/courses";
import type { Course } from "@/features/courses";
import { fetchProfile } from "@/features/settings";
import { getCurriculum } from "@/lib/curricula";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onUploadComplete?: () => void;
  /** Pre-select a course when opening modal from a course context */
  defaultCourseId?: string;
}

export function UploadModal({
  open,
  onOpenChange,
  userId,
  onUploadComplete,
  defaultCourseId,
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploads, error, handleFilesSelected, resetUploads } =
    useFileUpload(() => {
      onUploadComplete?.();
    });

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    defaultCourseId ?? "",
  );
  const [creatingNew, setCreatingNew] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseTargetGrade, setNewCourseTargetGrade] = useState<
    number | null
  >(null);
  const [userCurriculum, setUserCurriculum] = useState("percentage");
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Load user's courses when modal opens
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;

    const load = async () => {
      setLoadingCourses(true);
      try {
        const [data, profile] = await Promise.all([
          fetchUserCourses(userId),
          fetchProfile(userId).catch(() => ({ curriculum: "percentage" })),
        ]);
        if (cancelled) return;
        setCourses(data);
        setUserCurriculum(profile.curriculum);
        const curriculum = getCurriculum(profile.curriculum);
        setNewCourseTargetGrade(curriculum.defaultTarget);
        if (defaultCourseId) {
          setSelectedCourseId(defaultCourseId);
        } else if (data.length === 1) {
          setSelectedCourseId(data[0].id);
        }
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, userId, defaultCourseId]);

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) return;
    try {
      const curriculum = getCurriculum(userCurriculum);
      const course = await createCourse(
        userId,
        newCourseName.trim(),
        undefined,
        newCourseTargetGrade ?? curriculum.defaultTarget,
      );
      setCourses((prev) => [course, ...prev]);
      setSelectedCourseId(course.id);
      setCreatingNew(false);
      setNewCourseName("");
      setNewCourseTargetGrade(curriculum.defaultTarget);
    } catch (err) {
      console.error("Failed to create course:", err);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedCourseId) {
      handleFilesSelected(e.target.files, userId, selectedCourseId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading && selectedCourseId) {
      handleFilesSelected(e.dataTransfer.files, userId, selectedCourseId);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      resetUploads();
      setCreatingNew(false);
      setNewCourseName("");
      onOpenChange(false);
    }
  };

  const hasUploads = uploads.length > 0;
  const allComplete = hasUploads && uploads.every((u) => u.complete || u.error);
  const canUpload = !!selectedCourseId && !uploading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Study Materials</DialogTitle>
          <DialogDescription>
            Select a course, then upload your materials (PDF, DOCX, PPTX,
            images). Max 10MB per file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Course picker */}
          {!hasUploads && (
            <div className="space-y-2">
              <Label>Course</Label>
              {creatingNew ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Course name (e.g. Biology 101)"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateCourse();
                      }}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Target passing grade
                    </Label>
                    <Select
                      value={String(newCourseTargetGrade ?? "")}
                      onValueChange={(v) =>
                        setNewCourseTargetGrade(parseFloat(v))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select target grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCurriculum(userCurriculum).gradeOptions.map(
                          (opt) => (
                            <SelectItem
                              key={opt.value}
                              value={String(opt.value)}
                            >
                              {opt.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateCourse}
                      disabled={!newCourseName.trim()}
                    >
                      Create
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCreatingNew(false);
                        setNewCourseName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={selectedCourseId}
                    onValueChange={setSelectedCourseId}
                    disabled={loadingCourses}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue
                        placeholder={
                          loadingCourses
                            ? "Loading courses..."
                            : "Select a course"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setCreatingNew(true)}
                    title="Create new course"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Drag and drop zone */}
          {!hasUploads && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                !canUpload
                  ? "border-muted bg-muted/30 opacity-60 cursor-not-allowed"
                  : uploading
                    ? "border-muted bg-muted/50"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() =>
                canUpload && !uploading && fileInputRef.current?.click()
              }
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {!selectedCourseId
                      ? "Select a course first"
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, PPTX, Images (Max 5 files)
                  </p>
                </div>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={onFileChange}
                disabled={!canUpload}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {hasUploads && (
            <div className="space-y-3">
              {uploads.map((upload, index) => (
                <div
                  key={`${upload.fileName}-${index}`}
                  className="bg-muted/30 rounded-lg p-3 border"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 truncate max-w-[80%]">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span
                        className="text-sm truncate"
                        title={upload.fileName}
                      >
                        {upload.fileName}
                      </span>
                    </div>
                    {upload.error ? (
                      <X className="h-4 w-4 text-destructive" />
                    ) : upload.complete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {upload.progress}%
                      </span>
                    )}
                  </div>

                  {upload.error ? (
                    <p className="text-xs text-destructive">{upload.error}</p>
                  ) : (
                    <Progress value={upload.progress} className="h-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}

          {allComplete && (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetUploads();
                }}
              >
                Upload More
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </div>
          )}

          {!hasUploads && (
            <p className="text-xs text-center text-muted-foreground">
              Your materials will be analyzed and concepts extracted
              automatically.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
