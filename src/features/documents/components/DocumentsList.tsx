import {
  FileIcon,
  Trash2,
  Calendar,
  HardDrive,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  MoreVertical,
  Eye,
  Pencil,
  FileQuestion,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getDocumentSignedUrl,
  renameDocument,
} from "../services/documentService";
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
import { useElapsedTime } from "../hooks/useElapsedTime";
import { getProcessingStageMessage } from "@/lib/garden";

// Content-quality failures mean the document itself needs changing — retrying won't help.
// Technical failures are transient and worth retrying.
function classifyDocumentError(msg: string | null | undefined): "content" | "technical" {
  if (!msg) return "technical";
  const lower = msg.toLowerCase();
  if (lower.includes("too little text") || lower.includes("not enough learning material")) {
    return "content";
  }
  return "technical";
}

// Own component (not inlined in the row map) so useElapsedTime's per-second
// tick is a proper hook instance per document, not a hook call inside a loop.
function ProcessingStatusLabel({ doc }: { doc: Document }) {
  const elapsedMs = useElapsedTime(doc.processingStartedAt);
  const message = getProcessingStageMessage(doc.processingStage, elapsedMs);
  const label = doc.processingStage === "analyzing" ? "Analyzing" : "Extracting";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center text-blue-500 text-xs cursor-help">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          {label}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-xs">{message.detail}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface DocumentsListProps {
  documents: Document[];
  onDelete: (id: string, filePath: string) => void;
  onRetry?: (doc: Document) => void;
  onDocumentUpdate?: (doc: Document) => void;
  loading: boolean;
  title?: string;
  description?: string;
}

export function DocumentsList({
  documents,
  onDelete,
  onRetry,
  onDocumentUpdate,
  loading,
  title = "Your Documents",
  description = "Manage your uploaded course materials",
}: DocumentsListProps) {
  const [retryingDocs, setRetryingDocs] = useState<Set<string>>(new Set());
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const navigate = useNavigate();

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
                processingStage: data.processing_stage as Document["processingStage"],
                processingStartedAt: data.processing_started_at,
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

  const handleView = useCallback(async (doc: Document) => {
    const url = await getDocumentSignedUrl(doc.filePath, 60);
    if (!url) {
      toast.error("Could not open document");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const handleStartRename = useCallback((doc: Document) => {
    setRenamingDocId(doc.id);
    setRenameValue(doc.title);
  }, []);

  const handleCancelRename = useCallback(() => {
    setRenamingDocId(null);
    setRenameValue("");
  }, []);

  const handleSaveRename = useCallback(
    async (doc: Document) => {
      const newTitle = renameValue.trim();
      if (!newTitle || newTitle === doc.title) {
        setRenamingDocId(null);
        return;
      }
      try {
        await renameDocument(doc.id, newTitle);
        // Optimistically reflect the new title; the realtime subscription
        // (postgres_changes UPDATE) will reconcile shortly after.
        onDocumentUpdate?.({
          ...doc,
          title: newTitle,
          updatedAt: new Date().toISOString(),
        });
        toast.success("Document renamed");
      } catch {
        toast.error("Could not rename document");
      } finally {
        setRenamingDocId(null);
        setRenameValue("");
      }
    },
    [renameValue, onDocumentUpdate],
  );

  // The backend quiz-generation endpoint (/quiz-sessions/generate) accepts
  // only user_id + course_id — there is no per-document quiz generation yet
  // (tracked separately; needs a document_id backend param). Until then this
  // generates a quiz for the whole course, so the label says exactly that and
  // the action is only offered for documents that have finished processing.
  const handleGenerateQuiz = useCallback(
    (doc: Document) => {
      navigate(`/course/${doc.courseId}`);
    },
    [navigate],
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
      <Card className="text-center p-8 border-2 border-dashed border-ghibli-moss/45">
        <CardContent className="space-y-4 pt-6">
          <div className="mx-auto w-12 h-12 bg-ghibli-mist border border-ghibli-moss/40 rounded-full flex items-center justify-center">
            <HardDrive className="text-ghibli-bark w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-ghibli-canopy">No documents yet</h3>
            <p className="text-sm text-ghibli-bark">
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
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
                    <FileIcon className="w-4 h-4 text-primary shrink-0" />
                    {renamingDocId === doc.id ? (
                      <Input
                        value={renameValue}
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveRename(doc);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleCancelRename();
                          }
                        }}
                        onBlur={() => handleSaveRename(doc)}
                        className="h-8 max-w-xs"
                      />
                    ) : (
                      <span className="break-words" title={doc.title}>
                        {doc.title}
                      </span>
                    )}
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
                      <ProcessingStatusLabel doc={doc} />
                    ) : doc.status === "completed" ? (
                      <div className="flex items-center text-green-600 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </div>
                    ) : classifyDocumentError(doc.errorMessage) === "content" ? (
                      // Content-quality failure — document needs a better upload, not a retry
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-amber-600 text-xs cursor-help gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            Limited content
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">{doc.errorMessage}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      // Technical failure — worth retrying
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center text-red-500 text-xs cursor-help gap-1">
                              <XCircle className="w-3 h-3 shrink-0" />
                              Failed
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
                <TableCell className="text-ghibli-bark">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(doc.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ghibli-forest hover:text-ghibli-canopy hover:bg-ghibli-ivory/60 transition-colors"
                        aria-label="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      <DropdownMenuItem onClick={() => handleView(doc)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View document
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStartRename(doc)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      {doc.status === "completed" && (
                        <DropdownMenuItem onClick={() => handleGenerateQuiz(doc)}>
                          <FileQuestion className="w-4 h-4 mr-2" />
                          Generate a quiz for this course
                        </DropdownMenuItem>
                      )}
                      {doc.status === "failed" &&
                        onRetry &&
                        classifyDocumentError(doc.errorMessage) ===
                          "technical" && (
                          <DropdownMenuItem onClick={() => handleRetry(doc)}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reprocess
                          </DropdownMenuItem>
                        )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(doc.id, doc.filePath)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
