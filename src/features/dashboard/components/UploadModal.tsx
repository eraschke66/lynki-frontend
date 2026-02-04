import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react";
import { useFileUpload } from "@/features/documents/hooks/useFileUpload";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onUploadComplete?: () => void;
}

export function UploadModal({
  open,
  onOpenChange,
  userId,
  onUploadComplete,
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploads, error, handleFilesSelected, resetUploads } =
    useFileUpload(() => {
      onUploadComplete?.();
    });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(e.target.files, userId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) {
      handleFilesSelected(e.dataTransfer.files, userId);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      resetUploads();
      onOpenChange(false);
    }
  };

  const hasUploads = uploads.length > 0;
  const allComplete = hasUploads && uploads.every((u) => u.complete || u.error);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Study Materials</DialogTitle>
          <DialogDescription>
            Upload your course materials (PDF, DOCX, PPTX, images). Max 10MB per file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!hasUploads && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                uploading
                  ? "border-muted bg-muted/50"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Click to upload or drag and drop
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
                disabled={uploading}
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
              <Button variant="outline" onClick={() => {
                resetUploads();
              }}>
                Upload More
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          )}

          {!hasUploads && (
            <p className="text-xs text-center text-muted-foreground">
              Your materials will be analyzed and concepts extracted automatically.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
