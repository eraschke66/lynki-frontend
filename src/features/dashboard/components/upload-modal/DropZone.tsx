import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import type { UploadModalState } from "../../hooks/useUploadModal";

export function DropZone({ state }: { state: UploadModalState }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        !state.canUpload
          ? "border-ghibli-moss/30 bg-ghibli-mist/30 cursor-not-allowed text-ghibli-bark"
          : state.uploading
            ? "border-ghibli-jungle bg-ghibli-moss/20"
            : "border-ghibli-moss/45 hover:border-ghibli-jungle hover:bg-ghibli-ivory/60 cursor-pointer"
      }`}
      onDragOver={state.handleDragOver}
      onDrop={state.handleDrop}
      onClick={() => state.canUpload && !state.uploading && fileInputRef.current?.click()}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-full">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {!state.selectedCourseId ? "Select a course first" : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-ghibli-bark">PDF, DOCX, PPTX, PNG, JPEG — up to 5 files, 10 MB each</p>
        </div>
      </div>
      <Input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={state.onFileChange}
        disabled={!state.canUpload}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,image/png,image/jpeg"
      />
    </div>
  );
}
