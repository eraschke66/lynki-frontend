import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HardDrive } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth";
import {
  fetchUserDocuments,
  getUserStorageStats,
  deleteDocument,
  retryDocumentProcessing,
  wakeUpBackend,
} from "../services/documentService";
import { FileUploader } from "./FileUploader";
import { DocumentsList } from "./DocumentsList";
import type { Document } from "../types";
import { toast } from "sonner";
import { documentQueryKeys } from "@/lib/queryKeys";

export function DocumentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hasWokenBackend = useRef(false);

  // Wake up Render backend once on mount
  useEffect(() => {
    if (!hasWokenBackend.current) {
      hasWokenBackend.current = true;
      wakeUpBackend().then((isAwake) => {
        if (!isAwake) {
          console.log("Backend may be cold starting, first upload may take longer");
        }
      });
    }
  }, []);

  // Fetch documents with React Query
  const {
    data: documents = [],
    isLoading: documentsLoading,
  } = useQuery({
    queryKey: documentQueryKeys.list(user?.id ?? ""),
    queryFn: () => fetchUserDocuments(user!.id),
    enabled: !!user,
  });

  // Fetch storage stats with React Query
  const { data: stats = { usedSpace: 0, fileCount: 0 } } = useQuery({
    queryKey: documentQueryKeys.stats(user?.id ?? ""),
    queryFn: () => getUserStorageStats(user!.id),
    enabled: !!user,
  });

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    // Optimistic update
    queryClient.setQueryData(
      documentQueryKeys.list(user!.id),
      (old: Document[] | undefined) => old?.filter((d) => d.id !== id) ?? []
    );

    try {
      await deleteDocument(id, filePath);
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    } catch (error) {
      console.error("Delete failed:", error);
      // Revert on error
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
      toast.error("Delete failed", {
        description: "Could not delete the document. Please try again.",
      });
    }
  };

  const handleUploadComplete = () => {
    // Invalidate queries to refetch
    queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    toast.success("Upload complete", {
      description: "Your document is now being processed. This may take a few minutes.",
    });
  };

  const handleRetry = async (doc: Document) => {
    toast.loading("Retrying processing...", { id: `retry-${doc.id}` });

    const result = await retryDocumentProcessing(doc.id);

    if (result.success) {
      toast.success("Processing restarted", {
        id: `retry-${doc.id}`,
        description: `${doc.title} is being processed again.`,
      });
      // Update the document status optimistically
      queryClient.setQueryData(
        documentQueryKeys.list(user!.id),
        (old: Document[] | undefined) =>
          old?.map((d) =>
            d.id === doc.id ? { ...d, status: "pending" as const, errorMessage: null } : d
          ) ?? []
      );
    } else {
      toast.error("Retry failed", {
        id: `retry-${doc.id}`,
        description: result.error || "Please try again later.",
      });
    }
  };

  const handleDocumentUpdate = useCallback(
    (updatedDoc: Document) => {
      // Update document in cache
      queryClient.setQueryData(
        documentQueryKeys.list(user!.id),
        (old: Document[] | undefined) =>
          old?.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)) ?? []
      );

      // Show toast notifications for status changes
      if (updatedDoc.status === "completed") {
        toast.success("Document ready", {
          description: `${updatedDoc.title} has been processed successfully.`,
        });
      } else if (updatedDoc.status === "failed") {
        toast.error("Processing failed", {
          description: updatedDoc.errorMessage || `Failed to process ${updatedDoc.title}`,
        });
      }
    },
    [queryClient, user]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!user) return null;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background p-6 md:p-12 pt-28">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Stats Card */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Storage Used
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <HardDrive className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {formatFileSize(stats.usedSpace)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.fileCount} files uploaded
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upload Section */}
            <div className="w-full md:w-2/3">
              <FileUploader
                userId={user.id}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          </div>

          {/* Documents List */}
          <DocumentsList
            documents={documents}
            onDelete={handleDelete}
            onRetry={handleRetry}
            onDocumentUpdate={handleDocumentUpdate}
            loading={documentsLoading}
          />
        </div>
      </div>
    </>
  );
}
