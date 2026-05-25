import { reportError } from "@/lib/sentry";
import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { wakeUpBackend } from "../services/documentService";
import { fetchUserCourses, createCourse } from "@/features/courses";
import type { Course } from "@/features/courses";

interface FileUploaderProps {
  userId: string;
  onUploadComplete?: () => void;
}

export function FileUploader({ userId, onUploadComplete }: FileUploaderProps) {
  const [searchParams] = useSearchParams();
  const initialCourseId = searchParams.get("courseId") ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploads, error, handleFilesSelected, resetUploads } =
    useFileUpload(onUploadComplete);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [backendReady, setBackendReady] = useState(false);
  const hasWokenBackend = useRef(false);

  // Step 2 is unlocked whenever a real course is selected and we're not
  // mid-creation. Derived from selectedCourseId so re-selecting the same
  // value in the dropdown can't leave it stuck (Radix Select's onValueChange
  // doesn't fire on a no-op re-select).
  const courseReady = !!selectedCourseId && !creatingNew;

  // Pre-warm the Render backend on mount so the processing trigger doesn't
  // eat a cold start. The upload zone stays gated until this ping resolves.
  useEffect(() => {
    if (hasWokenBackend.current) return;
    hasWokenBackend.current = true;
    wakeUpBackend().finally(() => setBackendReady(true));
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchUserCourses(userId);
        if (cancelled) return;
        setCourses(data);
        // Auto-select the only course, but never override a courseId that
        // was already supplied (query param) or chosen by the user.
        if (data.length === 1) {
          setSelectedCourseId((prev) => prev || data[0].id);
        }
      } catch (err) {
        if (!cancelled) reportError("Fetch courses for uploader failed:", err);
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
      reportError("Failed to create course:", err);
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
    if (!uploading && selectedCourseId && backendReady) {
      handleFilesSelected(e.dataTransfer.files, userId, selectedCourseId);
    }
  };

  const hasUploads = uploads.length > 0;
  const allDone = hasUploads && uploads.every((u) => u.complete || u.error);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  // Course chosen but the backend warm-up ping hasn't resolved yet.
  const showWarming = courseReady && !backendReady;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Study Materials</CardTitle>
        <CardDescription>
          Select a course, then upload your materials (PDF, DOCX, PPTX, PNG,
            JPEG). Max 50 MB per file, up to 20 files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── STEP 1: Course selection — always visible ── */}
        {!hasUploads && (
          <div
            className={`rounded-xl p-4 space-y-3 border-[1.5px] ${
              courseReady
                ? "bg-ghibli-moss/8 border-ghibli-moss/45"
                : "bg-ghibli-ivory/60 border-ghibli-moss/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  courseReady
                    ? "bg-ghibli-jungle text-primary-foreground"
                    : "bg-ghibli-moss/20 text-ghibli-canopy"
                }`}
              >
                {courseReady ? "✓" : "1"}
              </div>
              <Label className="text-sm font-semibold text-ghibli-jungle">
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
                  onValueChange={(val) => setSelectedCourseId(val)}
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
                  className="gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New
                </Button>
              </div>
            )}

            {!courseReady && !creatingNew && (
              <p className="text-xs text-ghibli-bark pl-8">
                Materials must belong to a course so your garden can track progress.
              </p>
            )}
            {courseReady && selectedCourse && (
              <p className="text-xs text-ghibli-moss pl-8 font-medium">
                Planting into: {selectedCourse.title}
              </p>
            )}
          </div>
        )}

        {/* ── STEP 2: Upload zone — only shown after course selected ── */}
        {!hasUploads && (
          <>
            <div className="flex items-center gap-2 opacity-40 select-none pointer-events-none" style={{ transition: "opacity 0.3s" }}>
              <div className="flex-1 h-px bg-ghibli-moss/30" />
              <ChevronRight className="w-3.5 h-3.5 text-ghibli-bark" />
              <div className="flex-1 h-px bg-ghibli-moss/30" />
            </div>

            <div
              className={`rounded-xl p-8 text-center transition-all duration-300 ${
                !courseReady || !backendReady
                  ? "opacity-30 pointer-events-none select-none"
                  : uploading
                  ? "pointer-events-none bg-ghibli-mist/40 text-ghibli-bark-disabled"
                  : "cursor-pointer hover:border-ghibli-jungle hover:bg-ghibli-moss/8"
              }`}
              style={{
                border: courseReady
                  ? "2px dashed hsl(var(--ghibli-moss) / 0.35)"
                  : "2px dashed hsl(var(--ghibli-moss) / 0.15)",
                background: courseReady ? "transparent" : "hsl(var(--ghibli-bark) / 0.02)",
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => courseReady && backendReady && !uploading && fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-ghibli-moss/20 text-ghibli-canopy">
                    2
                  </div>
                  <span className="text-sm font-semibold text-ghibli-jungle">
                    {!courseReady
                      ? "Select a course above first"
                      : showWarming
                      ? "Warming up server, ~30s on first visit…"
                      : "Drop files here or click to upload"}
                  </span>
                </div>
                <img
                  src="/plant-stage-2.png"
                  alt=""
                  className="w-14 h-14 object-contain"
                  style={{ mixBlendMode: "darken", opacity: courseReady ? 0.85 : 0.3 }}
                />
                <p className="text-xs text-ghibli-bark">PDF, DOCX, PPTX, PNG, JPEG</p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={onFileChange}
                disabled={uploading || !courseReady || !backendReady}
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
              <span className="text-ghibli-jungle">
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
                  className={`rounded-xl p-4 border bg-gradient-to-br from-ghibli-moss/6 to-ghibli-ivory/30 ${
                    upload.error
                      ? "border-destructive/30"
                      : upload.complete
                      ? "border-ghibli-moss/45"
                      : "border-ghibli-moss/20"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-4 w-4 text-ghibli-bark shrink-0" />
                    <span className="text-sm font-medium truncate flex-1" title={upload.fileName}>
                      {upload.fileName}
                    </span>
                    {upload.error ? (
                      <X className="h-4 w-4 text-destructive shrink-0" />
                    ) : upload.complete ? (
                      <CheckCircle className="h-4 w-4 text-ghibli-moss shrink-0" />
                    ) : (
                      <span className="text-xs text-ghibli-bark shrink-0">{upload.progress}%</span>
                    )}
                  </div>
                  {upload.error ? (
                    <p className="text-xs text-destructive">{upload.error}</p>
                  ) : (
                    <div className="relative h-2 rounded-full overflow-hidden bg-ghibli-moss/15">
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
              <div className="flex items-start gap-3 rounded-xl p-4 bg-ghibli-moss/8 border border-ghibli-moss/30">
                <img
                  src="/plant-stage-1.png"
                  alt=""
                  className="w-10 h-10 object-contain shrink-0 animate-pulse-soft"
                  style={{ mixBlendMode: "darken" }}
                />
                <div>
                  <p className="text-sm font-medium text-ghibli-jungle">Your garden is growing</p>
                  <p className="text-xs text-ghibli-bark mt-0.5">
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
