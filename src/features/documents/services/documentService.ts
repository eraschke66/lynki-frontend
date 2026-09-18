import { backendFetch, pingBackend } from "@/lib/backend";
import { reportError } from "@/lib/sentry";
import { supabase } from "@/lib/supabase";
import type { Document, StorageStats } from "../types";

const BUCKET_NAME = "course-materials";

/**
 * Retry configuration for the backend processing trigger.
 * The first attempt gets a long timeout to cover a Render cold start;
 * retries use a short timeout since the service is awake by then.
 */
const PROCESS_TRIGGER_CONFIG = {
  maxRetries: 2,
  baseDelayMs: 1000,
  maxDelayMs: 5000,
  firstAttemptTimeoutMs: 45000, // first call: cover cold start
  retryTimeoutMs: 15000, // retries: backend is awake now
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt: number): number => {
  const delay = PROCESS_TRIGGER_CONFIG.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, PROCESS_TRIGGER_CONFIG.maxDelayMs);
};

/**
 * Wake up the Render backend (handles cold starts)
 * Call this early (e.g., on page load) so the API is ready when needed
 */
export async function wakeUpBackend(): Promise<boolean> {
  return pingBackend();
}

/**
 * Trigger backend processing with retry logic
 * Returns { success, error? } to allow graceful handling
 */
async function triggerBackendProcessing(
  documentId: string,
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 0; attempt <= PROCESS_TRIGGER_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      // First attempt covers a cold start; retries hit an already-warm backend.
      const timeoutMs =
        attempt === 0
          ? PROCESS_TRIGGER_CONFIG.firstAttemptTimeoutMs
          : PROCESS_TRIGGER_CONFIG.retryTimeoutMs;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await backendFetch(`/documents/process/${documentId}`, {
        method: "POST",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { success: true };
      }

      // Non-retryable HTTP errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        const errorText = await response.text().catch(() => "Unknown error");
        return {
          success: false,
          error: `Server rejected request: ${errorText}`,
        };
      }

      // Retryable errors (5xx, network issues)
      if (attempt < PROCESS_TRIGGER_CONFIG.maxRetries) {
        const delay = getRetryDelay(attempt);
        console.warn(
          `Processing trigger failed (attempt ${attempt + 1}/${PROCESS_TRIGGER_CONFIG.maxRetries + 1}), retrying in ${delay}ms...`,
        );
        await sleep(delay);
      }
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      const errorMessage = isTimeout
        ? "Request timed out"
        : err instanceof Error
          ? err.message
          : "Unknown error";

      if (attempt < PROCESS_TRIGGER_CONFIG.maxRetries) {
        const delay = getRetryDelay(attempt);
        console.warn(
          `Processing trigger error (attempt ${attempt + 1}/${PROCESS_TRIGGER_CONFIG.maxRetries + 1}): ${errorMessage}, retrying in ${delay}ms...`,
        );
        await sleep(delay);
      } else {
        return { success: false, error: errorMessage };
      }
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

/**
 * Upload a file to Supabase Storage and save metadata to database.
 * @param file - The file to upload
 * @param userId - The user ID
 * @param onProgress - Callback for upload progress
 */
export async function uploadDocument(
  file: File,
  userId: string,
  courseId: string,
  onProgress?: (progress: number) => void,
): Promise<Document> {
  // 1. Upload file to Storage
  // Structure: {userId}/{timestamp}_{filename}
  const timestamp = new Date().getTime();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${userId}/${timestamp}_${cleanFileName}`;

  // Consider XHR for progress if Supabase client doesn't support fine-grained progress easily
  // But standard supabase client allows simple upload.
  // We can't easily get progress from the standard client await call,
  // but let's assume standard upload for now to keep it clean.
  // If we need real progress, we might need a custom uploader or TUS.
  // For now, will just emit 0 and 100.

  onProgress?.(10);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    reportError("Storage upload error:", uploadError);
    throw new Error(`Failed to upload ${file.name}`);
  }

  onProgress?.(50);

  // 2. Save metadata to Database
  const { data: document, error: dbError } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      course_id: courseId,
      title: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      status: "pending",
    })
    .select()
    .single();

  if (dbError || !document) {
    reportError("Database insert error:", dbError);
    // Cleanup storage if DB fails? ideally yes, but keeping it simple for now.
    throw new Error(`Failed to save metadata for ${file.name}`);
  }

  onProgress?.(80);

  // 3. Trigger Backend Processing with retry logic
  const processingResult = await triggerBackendProcessing(document.id);

  if (!processingResult.success) {
    // Update document status to indicate processing failed to start
    await supabase
      .from("documents")
      .update({
        status: "failed",
        error_message: `Failed to start processing: ${processingResult.error}`,
      })
      .eq("id", document.id);

    reportError("Failed to trigger processing:", processingResult.error);
  }

  onProgress?.(100);

  return {
    id: document.id,
    userId: document.user_id,
    courseId: document.course_id,
    title: document.title,
    filePath: document.file_path,
    fileType: document.file_type,
    fileSize: document.file_size,
    status: processingResult.success
      ? (document.status as Document["status"])
      : "failed",
    processingStage: document.processing_stage as Document["processingStage"],
    processingStartedAt: document.processing_started_at,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
    errorMessage: processingResult.success ? undefined : processingResult.error,
  };
}

/**
 * Retry processing for a failed document
 */
export async function retryDocumentProcessing(
  documentId: string,
): Promise<{ success: boolean; error?: string }> {
  // Reset document status to pending
  const { error: updateError } = await supabase
    .from("documents")
    .update({
      status: "pending",
      error_message: null,
    })
    .eq("id", documentId);

  if (updateError) {
    return { success: false, error: "Failed to reset document status" };
  }

  // Trigger processing
  return triggerBackendProcessing(documentId);
}

/**
 * Fetch all documents for a user.
 */
export async function fetchUserDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch documents");
  }

  return data.map((doc) => ({
    id: doc.id,
    userId: doc.user_id,
    courseId: doc.course_id,
    title: doc.title,
    filePath: doc.file_path,
    fileType: doc.file_type,
    fileSize: doc.file_size,
    status: doc.status as Document["status"],
    processingStage: doc.processing_stage as Document["processingStage"],
    processingStartedAt: doc.processing_started_at,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    errorMessage: doc.error_message,
  }));
}

/**
 * Get user storage stats.
 */
export async function getUserStorageStats(
  userId: string,
): Promise<StorageStats> {
  // Using a sum query
  const { data, error } = await supabase
    .from("documents") // This will be filtered by RLS automatically?
    // Wait, RLS filters rows. Aggregate functions usually work on visible rows.
    .select("file_size", { count: "exact" })
    .eq("user_id", userId);

  if (error) {
    reportError("Stats error:", error);
    return { usedSpace: 0, fileCount: 0 };
  }

  const totalSize = data?.reduce((sum, doc) => sum + doc.file_size, 0) || 0;
  const count = data?.length || 0;

  return {
    usedSpace: totalSize,
    fileCount: count,
  };
}

/**
 * Delete a document.
 */
export async function deleteDocument(
  documentId: string,
  filePath: string,
): Promise<void> {
  // 1. Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (storageError) {
    console.warn("Failed to delete file from storage", storageError);
    // Continue to delete DB record anyway?
    // If storage delete fails, we might end up with orphan files.
    // But usually prompt deletion from DB is more important for user view.
  }

  // 2. Delete from DB
  const { error: dbError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (dbError) {
    throw new Error("Failed to delete document record");
  }
}

/**
 * Create a short-lived signed URL for viewing a stored document file.
 * Returns null if the URL could not be created.
 */
export async function getDocumentSignedUrl(
  filePath: string,
  expiresIn = 60,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);
  if (error || !data?.signedUrl) {
    console.warn("Failed to create signed URL", error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Rename a document (title is mutable; hard-edit, no history).
 */
export async function renameDocument(
  documentId: string,
  title: string,
): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", documentId);
  if (error) {
    throw new Error("Failed to rename document");
  }
}
