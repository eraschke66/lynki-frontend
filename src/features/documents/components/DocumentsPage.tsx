import { useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HardDrive } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth";
import GhibliBackground from "@/components/garden/GhibliBackground";
import {
  fetchUserDocuments,
  getUserStorageStats,
  deleteDocument,
  retryDocumentProcessing,
} from "../services/documentService";
import { FileUploader } from "./FileUploader";
import { DocumentsList } from "./DocumentsList";
import type { Document } from "../types";
import { toast } from "sonner";
import { documentQueryKeys, courseQueryKeys } from "@/lib/queryKeys";
import { fetchUserCourses } from "@/features/courses";
import { posthog } from "@/lib/posthog";

export function DocumentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const courseIdFilter = searchParams.get("courseId");

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: documentQueryKeys.list(user?.id ?? ""),
    queryFn: () => fetchUserDocuments(user!.id),
    enabled: !!user,
    refetchInterval: (query): number | false => {
      const docs = query.state.data as Document[] | undefined;
      const hasProcessing = docs?.some(
        (d: Document) => d.status === "pending" || d.status === "processing",
      );
      return hasProcessing ? 5000 : false;
    },
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: courseQueryKeys.list(user?.id ?? ""),
    queryFn: () => fetchUserCourses(user!.id),
    enabled: !!user,
  });

  const sortedDocs = useMemo(
    () => [...documents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [documents],
  );

  const { data: stats = { usedSpace: 0, fileCount: 0 } } = useQuery({
    queryKey: documentQueryKeys.stats(user?.id ?? ""),
    queryFn: () => getUserStorageStats(user!.id),
    enabled: !!user,
  });

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    queryClient.setQueryData(
      documentQueryKeys.list(user!.id),
      (old: Document[] | undefined) => old?.filter((d) => d.id !== id) ?? [],
    );
    try {
      await deleteDocument(id, filePath);
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    } catch (error) {
      console.error("Delete failed:", error);
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
      toast.error("Delete failed", {
        description: "Could not delete the document. Please try again.",
      });
    }
  };

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    posthog.capture("document_uploaded");
    toast.success("Upload complete", {
      description: "Your document is now being processed. This may take a few minutes.",
    });
  };

  const handleRetry = async (doc: Document) => {
    toast.loading("Retrying processing...", { id: `retry-${doc.id}` });
    const result = await retryDocumentProcessing(doc.id);
    if (result.success) {
      posthog.capture("document_processing_retried", { document_id: doc.id });
      toast.success("Processing restarted", {
        id: `retry-${doc.id}`,
        description: `${doc.title} is being processed again.`,
      });
      queryClient.setQueryData(
        documentQueryKeys.list(user!.id),
        (old: Document[] | undefined) =>
          old?.map((d) =>
            d.id === doc.id ? { ...d, status: "pending" as const, errorMessage: null } : d,
          ) ?? [],
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
      queryClient.setQueryData(
        documentQueryKeys.list(user!.id),
        (old: Document[] | undefined) =>
          old?.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)) ?? [],
      );
      if (updatedDoc.status === "completed") {
        toast.success("Document ready", {
          description: `${updatedDoc.title} has been processed successfully.`,
        });
      } else if (updatedDoc.status === "failed") {
        const isContentIssue =
          updatedDoc.errorMessage?.toLowerCase().includes("too little text") ||
          updatedDoc.errorMessage?.toLowerCase().includes("not enough learning material");
        if (isContentIssue) {
          toast.warning("Document has limited content", {
            description: updatedDoc.errorMessage ?? undefined,
          });
        } else {
          toast.error("Processing failed", {
            description: updatedDoc.errorMessage || `Failed to process ${updatedDoc.title}`,
          });
        }
      }
    },
    [queryClient, user],
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
      <GhibliBackground />
      <Header />
      <div className="relative z-10 p-6 md:p-12 pt-28">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Stats Card */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-ghibli-bark">
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
                      <p className="text-xs text-ghibli-bark">
                        {stats.fileCount} files uploaded
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upload Section */}
            <div className="w-full md:w-2/3">
              <FileUploader userId={user.id} onUploadComplete={handleUploadComplete} />
            </div>
          </div>

          {/* Documents — filtered to one course, or grouped per course */}
          {(() => {
            if (courseIdFilter) {
              const filteredDocs = sortedDocs.filter(
                (d) => d.courseId === courseIdFilter,
              );
              const course = courses.find((c) => c.id === courseIdFilter);
              return (
                <section className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-xl font-semibold text-ghibli-canopy">
                      {course ? course.title : "Materials"}
                    </h2>
                    <Link
                      to="/documents"
                      className="text-sm text-ghibli-bark hover:text-ghibli-canopy underline-offset-4 hover:underline"
                    >
                      ← All materials
                    </Link>
                  </div>
                  <DocumentsList
                    documents={filteredDocs}
                    onDelete={handleDelete}
                    onRetry={handleRetry}
                    onDocumentUpdate={handleDocumentUpdate}
                    loading={documentsLoading}
                    title={course ? `${course.title} materials` : "Materials"}
                    description="Documents uploaded to this course"
                  />
                </section>
              );
            }

            // Courses query still in-flight while documents have arrived —
            // avoid a flash of "Uncategorized" containing everything.
            if (sortedDocs.length > 0 && coursesLoading) {
              return (
                <DocumentsList
                  documents={[]}
                  onDelete={handleDelete}
                  onRetry={handleRetry}
                  onDocumentUpdate={handleDocumentUpdate}
                  loading={true}
                />
              );
            }

            // Grouped mode — one section per course that has docs, plus Other
            const courseIds = new Set(courses.map((c) => c.id));
            const groups = courses
              .map((c) => ({
                course: c,
                docs: sortedDocs.filter((d) => d.courseId === c.id),
              }))
              .filter((g) => g.docs.length > 0);

            const uncategorized = sortedDocs.filter(
              (d) => !courseIds.has(d.courseId),
            );

            if (groups.length === 0 && uncategorized.length === 0) {
              return (
                <DocumentsList
                  documents={[]}
                  onDelete={handleDelete}
                  onRetry={handleRetry}
                  onDocumentUpdate={handleDocumentUpdate}
                  loading={documentsLoading}
                />
              );
            }

            return (
              <div className="space-y-8">
                {groups.map(({ course, docs }) => (
                  <section key={course.id} className="space-y-3">
                    <h2 className="text-xl font-semibold text-ghibli-canopy">
                      {course.title}
                    </h2>
                    <DocumentsList
                      documents={docs}
                      onDelete={handleDelete}
                      onRetry={handleRetry}
                      onDocumentUpdate={handleDocumentUpdate}
                      loading={documentsLoading}
                      title={`${course.title} materials`}
                      description="Documents uploaded to this course"
                    />
                  </section>
                ))}
                {uncategorized.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-ghibli-canopy">
                      Other
                    </h2>
                    <DocumentsList
                      documents={uncategorized}
                      onDelete={handleDelete}
                      onRetry={handleRetry}
                      onDocumentUpdate={handleDocumentUpdate}
                      loading={documentsLoading}
                      title="Other"
                      description="Documents not linked to a course"
                    />
                  </section>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
