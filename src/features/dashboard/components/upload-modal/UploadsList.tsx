import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle, X } from "lucide-react";
import type { UploadModalState } from "../../hooks/useUploadModal";

export function UploadsList({ uploads }: { uploads: UploadModalState["uploads"] }) {
  return (
    <div className="space-y-3">
      {uploads.map((upload, index) => (
        <div key={`${upload.fileName}-${index}`} className="parchment-row rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 truncate max-w-[80%]">
              <FileText className="h-4 w-4 text-ghibli-bark shrink-0" />
              <span className="text-sm truncate" title={upload.fileName}>
                {upload.fileName}
              </span>
            </div>
            {upload.error ? (
              <X className="h-4 w-4 text-destructive" />
            ) : upload.complete ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <span className="text-xs text-ghibli-bark">{upload.progress}%</span>
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
  );
}
