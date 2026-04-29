import { useRef, useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, FileText, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [courseReady, setCourseReady] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchUserCourses(userId);
        if (cancelled) return;
        setCourses(data);
        if (data.length === 1) {
          setSelectedCourseId(data[0].id);
        }
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    };
    load();
    return () => { cancelled = true; };
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

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading && selectedCourseId) {
      handleFilesSelected(e.dataTransfer.files, userId, selectedCourseId);
    }
  };

  const hasUploads = uploads.length > 0;
  const allDone = hasUploads && uploads.every((u) => u.complete || u.error);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Study Materials</CardTitle>
        <CardDescription>
          Select a course, then upload your materials (PDF, DOCX, PPTX, PNG,
            JPEG). Max 10 MB per file, up to 5 files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── STEP 1: Course selection — always visible ── */}
        {!hasUploads && (
          <div
            className="rounded-xl p-4 space-y-3"
            style={{
              background: courseReady
                ? "rgba(64,145,108,0.06)"
                : "rgba(250,243,224,0.6)",
              border: courseReady
                ? "1.5px solid rgba(64,145,108,0.3)"
                : "1.5px solid rgba(64,145,108,0.15)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: courseReady ? "hsl(140,35%,40%)" : "rgba(64,145,108,0.2)",
                  color: courseReady ? "white" : "hsl(140,35%,35%)",
                }}
              >
                {courseReady ? "✓" : "1"}
              </div>
              <Label className="text-sm font-semibold text-[#2D6A4F]">
                Choose a course for these materials
              </Label>
            </div>

            {creatingNew ? (
              <div className="flex gap-2 pl-8">
                <Input
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. IB Biology, English Lit..."
                  onKeyDown={(e) => e.key === "Enter" && handleCreateCourse()}
                  autoFocus
                />
                <Button size="sm" onClick={handleCreateCourse} disabled={!newCourseName.trim()}>
                  Create
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCreatingNew(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 pl-8">
                <Select
                  value={selectedCourseId}
                  onValueChange={(val) => {
                    setSelectedCourseId(val);
                    setCourseReady(true);
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={courses.length === 0 ? "No courses yet — create one →" : "Select a course"} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCreatingNew(true)}
                  className="gap-1 border-[rgba(64,145,108,0.3)] text-[#2D6A4F] hover:border-[#40916C]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New
                </Button>
              </div>
            )}

            {!courseReady && !creatingNew && (
              <p className="text-xs text-muted-foreground pl-8">
                Materials must belong to a course so your garden can track progress.
              </p>
            )}
            {courseReady && selectedCourse && (
              <p className="text-xs text-[#40916C] pl-8 font-medium">
                Planting into: {selectedCourse.title}
              </p>
            )}
          </div>
        )}

        {/* ── STEP 2: Upload zone — only shown after course selected ── */}
        {!hasUploads && (
          <>
            <div className="flex items-center gap-2 opacity-40 select-none pointer-events-none" style={{ transition: "opacity 0.3s" }}>
              <div className="flex-1 h-px bg-border" />
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <div className="flex-1 h-px bg-border" />
            </div>

            <div
              className={`rounded-xl p-8 text-center transition-all duration-300 ${
                !courseReady
                  ? "opacity-30 pointer-events-none select-none"
                  : uploading
                  ? "opacity-50 pointer-events-none"
                  : "cursor-pointer hover:border-[rgba(64,145,108,0.6)] hover:bg-[rgba(64,145,108,0.03)]"
              }`}
              style={{
                border: courseReady
                  ? "2px dashed rgba(64,145,108,0.35)"
                  : "2px dashed rgba(64,145,108,0.15)",
                background: courseReady ? "transparent" : "rgba(0,0,0,0.02)",
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => courseReady && !uploading && fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: "rgba(64,145,108,0.2)",
                      color: "hsl(140,35%,35%)",
                    }}
                  >
                    2
                  </div>
                  <span className="text-sm font-semibold text-[#2D6A4F]">
                    {courseReady ? "Drop files here or click to upload" : "Select a course above first"}
                  </span>
                </div>
                <img
                  src="/plant-stage-2.png"
                  alt=""
                  className="w-14 h-14 object-contain"
                  style={{ mixBlendMode: "darken", opacity: courseReady ? 0.85 : 0.3 }}
                />
                <p className="text-xs text-muted-foreground">PDF, DOCX, PPTX, PNG, JPEG</p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={onFileChange}
                disabled={uploading || !courseReady}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,image/png,image/jpeg"
              />
            </div>
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Upload progress ── */}
        {hasUploads && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-[#2D6A4F]">
                {uploading ? "Planting your materials…" : "Materials planted"}
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
                  className="rounded-xl p-4 border"
                  style={{
                    background: "linear-gradient(135deg, rgba(64,145,108,0.04) 0%, rgba(250,243,224,0.3) 100%)",
                    borderColor: upload.error
                      ? "rgba(239,68,68,0.3)"
                      : upload.complete
                      ? "rgba(64,145,108,0.3)"
                      : "rgba(64,145,108,0.15)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate flex-1" title={upload.fileName}>
                      {upload.fileName}
                    </span>
                    {upload.error ? (
                      <X className="h-4 w-4 text-destructive shrink-0" />
                    ) : upload.complete ? (
                      <CheckCircle className="h-4 w-4 text-[#40916C] shrink-0" />
                    ) : (
                      <span className="text-xs text-muted-foreground shrink-0">{upload.progress}%</span>
                    )}
                  </div>
                  {upload.error ? (
                    <p className="text-xs text-destructive">{upload.error}</p>
                  ) : (
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(64,145,108,0.12)" }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${upload.progress}%`,
                          background: upload.complete
                            ? "linear-gradient(90deg, hsl(140,35%,45%), hsl(140,35%,32%))"
                            : "linear-gradient(90deg, hsl(140,35%,55%), hsl(140,35%,40%))",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {allDone && !uploads.some((u) => u.error) && (
              <div
                className="flex items-start gap-3 rounded-xl p-4"
                style={{
                  background: "rgba(64,145,108,0.06)",
                  border: "1px solid rgba(64,145,108,0.18)",
                }}
              >
                <img
                  src="/plant-stage-1.png"
                  alt=""
                  className="w-10 h-10 object-contain shrink-0 animate-pulse-soft"
                  style={{ mixBlendMode: "darken" }}
                />
                <div>
                  <p className="text-sm font-medium text-[#2D6A4F]">Your garden is growing</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Materials are being processed — this takes 2–5 minutes. Your quiz will be ready shortly.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
