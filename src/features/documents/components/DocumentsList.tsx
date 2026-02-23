import {
  FileIcon,
  Trash2,
  Calendar,
  HardDrive,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Document } from "../types";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

interface DocumentsListProps {
  documents: Document[];
  onDelete: (id: string, filePath: string) => void;
  onRetry?: (doc: Document) => void;
  onDocumentUpdate?: (doc: Document) => void;
  loading: boolean;
}

export function DocumentsList({
  documents,
  onDelete,
  onRetry,
  onDocumentUpdate,
  loading,
}: DocumentsListProps) {
  const [retryingDocs, setRetryingDocs] = useState<Set<string>>(new Set());

  // Memoize document IDs to prevent unnecessary re-fetches
  const documentIds = useMemo(
    () => documents.map((doc) => doc.id).join(","),
    [documents],
  );

  // Subscribe to document status updates
  useEffect(() => {
    if (documents.length === 0) return;

    // Create a channel for each document to avoid filter issues
    const channels = documents.map((doc) => {
      const channel = supabase
        .channel(`document-${doc.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "documents",
            filter: `id=eq.${doc.id}`,
          },
          (payload) => {
            if (payload.new && onDocumentUpdate) {
              const data =
                payload.new as Database["public"]["Tables"]["documents"]["Row"];
              onDocumentUpdate({
                id: data.id,
                userId: data.user_id,
                courseId: data.course_id,
                title: data.title,
                filePath: data.file_path,
                fileType: data.file_type,
                fileSize: data.file_size,
                status: data.status as Document["status"],
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                errorMessage: data.error_message,
              });
            }
          },
        )
        .subscribe();

      return channel;
    });

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [documentIds, onDocumentUpdate, documents]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleRetry = useCallback(
    async (doc: Document) => {
      if (!onRetry) return;

      setRetryingDocs((prev) => new Set(prev).add(doc.id));
      try {
        await onRetry(doc);
      } finally {
        setRetryingDocs((prev) => {
          const next = new Set(prev);
          next.delete(doc.id);
          return next;
        });
      }
    },
    [onRetry],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="text-center p-8 bg-muted/20 border-dashed">
        <CardContent className="space-y-4 pt-6">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <HardDrive className="text-muted-foreground w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium">No documents yet</h3>
            <p className="text-sm text-muted-foreground">
              Upload your course materials to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Documents</CardTitle>
        <CardDescription>Manage your uploaded course materials</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileIcon className="w-4 h-4 text-primary" />
                    <span className="truncate max-w-50" title={doc.title}>
                      {doc.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                <TableCell>
                  <TooltipProvider>
                    {doc.status === "pending" ? (
                      <div className="flex items-center text-amber-500 text-xs">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Queued
                      </div>
                    ) : doc.status === "processing" ? (
                      <div className="flex items-center text-blue-500 text-xs">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Processing
                      </div>
                    ) : doc.status === "completed" ? (
                      <div className="flex items-center text-green-600 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center text-red-500 text-xs cursor-help">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                              {doc.errorMessage && (
                                <AlertCircle className="w-3 h-3 ml-1" />
                              )}
                            </div>
                          </TooltipTrigger>
                          {doc.errorMessage && (
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">{doc.errorMessage}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                        {onRetry && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleRetry(doc)}
                            disabled={retryingDocs.has(doc.id)}
                          >
                            {retryingDocs.has(doc.id) ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3 mr-1" />
                            )}
                            Retry
                          </Button>
                        )}
                      </div>
                    )}
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(doc.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(doc.id, doc.filePath)}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
