import { useRef, useState, useEffect } from "react";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFileUpload } from "../hooks/useFileUpload";
import { fetchUserCourses, createCourse } from "@/features/courses";
import type { Course } from "@/features/courses";

interface FileUploaderProps {
  userId: string;
  onUploadComplete?: () => void;
}

export function FileUploader({ userId, onUploadComplete }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploads, error, handleFilesSelected, resetUploads } =
    useFileUpload(onUploadComplete);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchUserCourses(userId);
        if (cancelled) return;
        setCourses(data);
        if (data.length === 1) setSelectedCourseId(data[0].id);
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) return;
    try {
      const course = await createCourse(userId, newCourseName.trim());
      setCourses((prev) => [course, ...prev]);
      setSelectedCourseId(course.id);
      setCreatingNew(false);
      setNewCourseName("");
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

  const hasUploads = uploads.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Materials</CardTitle>
        <CardDescription>
          Drag and drop files here or click to select. Max 10MB per file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Course Selector */}
        {!hasUploads && (
          <div className="space-y-2">
            <Label>Course</Label>
            {creatingNew ? (
              <div className="flex gap-2">
                <Input
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="Course name"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateCourse()}
                />
                <Button size="sm" onClick={handleCreateCourse}>
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCreatingNew(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={selectedCourseId}
                  onValueChange={setSelectedCourseId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a course" />
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

        {!hasUploads && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              uploading || !selectedCourseId
                ? "border-muted bg-muted/50"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() =>
              !uploading && selectedCourseId && fileInputRef.current?.click()
            }
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-primary/10 rounded-full">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-sm font-medium">
                Click to upload or drag and drop
              </div>
              <div className="text-xs text-muted-foreground">
                PDF, DOCX, PPTX, Images (Max 5 files)
              </div>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={onFileChange}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
            />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasUploads && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-medium">
              <span>
                {uploading
                  ? `Uploading ${uploads.length} files...`
                  : "Upload complete"}
              </span>
              {!uploading && (
                <Button variant="ghost" size="sm" onClick={resetUploads}>
                  Upload More
                </Button>
              )}
            </div>

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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
