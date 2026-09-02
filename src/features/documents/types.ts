export type ProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type ProcessingStage = "extracting" | "analyzing";

export interface Document {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  status: ProcessingStatus;
  processingStage?: ProcessingStage | null;
  processingStartedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string | null;
}

export interface UploadStatus {
  progress: number;
  error: string | null;
  complete: boolean;
  fileName: string;
}

export interface StorageStats {
  usedSpace: number;
  fileCount: number;
}
