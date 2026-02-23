import { useState, useCallback } from "react";
import { uploadDocument } from "../services/documentService";
import type { UploadStatus } from "../types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_BATCH = 5;

interface UseFileUploadReturn {
  uploading: boolean;
  uploads: UploadStatus[];
  error: string | null;
  handleFilesSelected: (
    files: FileList | null,
    userId: string,
    courseId: string,
  ) => Promise<void>;
  resetUploads: () => void;
}

export function useFileUpload(
  onUploadComplete?: () => void,
): UseFileUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  const resetUploads = useCallback(() => {
    setUploads([]);
    setError(null);
  }, []);

  const handleFilesSelected = useCallback(
    async (fileList: FileList | null, userId: string, courseId: string) => {
      if (!fileList || fileList.length === 0) return;

      if (fileList.length > MAX_FILES_PER_BATCH) {
        setError(
          `You can only upload up to ${MAX_FILES_PER_BATCH} files at a time.`,
        );
        return;
      }

      const files = Array.from(fileList);
      const invalidFiles = files.filter((f) => f.size > MAX_FILE_SIZE);

      if (invalidFiles.length > 0) {
        setError(
          `Some files are too large. Maximum size is 10MB. (${invalidFiles
            .map((f) => f.name)
            .join(", ")})`,
        );
        return;
      }

      setError(null);
      setUploading(true);

      // Initialize upload status
      const initialStatus: UploadStatus[] = files.map((f) => ({
        fileName: f.name,
        progress: 0,
        error: null,
        complete: false,
      }));
      setUploads(initialStatus);

      // Upload sequentially or parallel?
      // Parallel is faster but uses more disjoint connections.
      // Let's do parallel with Promise.all
      try {
        await Promise.all(
          files.map(async (file, index) => {
            try {
              // Updates progress for this specific file
              const updateProgress = (progress: number) => {
                setUploads((prev) => {
                  const newUploads = [...prev];
                  newUploads[index] = { ...newUploads[index], progress };
                  return newUploads;
                });
              };

              await uploadDocument(file, userId, courseId, updateProgress);

              // Mark complete
              setUploads((prev) => {
                const newUploads = [...prev];
                newUploads[index] = {
                  ...newUploads[index],
                  progress: 100,
                  complete: true,
                };
                return newUploads;
              });
            } catch (err) {
              const errorMessage =
                err instanceof Error ? err.message : "Upload failed";
              setUploads((prev) => {
                const newUploads = [...prev];
                newUploads[index] = {
                  ...newUploads[index],
                  error: errorMessage,
                };
                return newUploads;
              });
            }
          }),
        );

        onUploadComplete?.();
      } catch (err) {
        console.error("Batch upload error", err);
        setError("An unexpected error occurred during upload.");
      } finally {
        setUploading(false);
      }
    },
    [onUploadComplete],
  );

  return {
    uploading,
    uploads,
    error,
    handleFilesSelected,
    resetUploads,
  };
}
