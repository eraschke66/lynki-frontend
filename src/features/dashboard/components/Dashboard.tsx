import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Upload,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { fetchDashboardData } from "../services/dashboardService";
import { updateCourse, deleteCourse } from "@/features/courses";
import { fetchProfile } from "@/features/settings";
import { getGradeLabel } from "@/lib/curricula";
import { profileQueryKeys } from "@/lib/queryKeys";
import { UploadModal } from "./UploadModal";
import { EditCourseDialog } from "./EditCourseDialog";
import { DeleteCourseDialog } from "./DeleteCourseDialog";
import type { CourseSummary } from "../types";
import { supabase } from "@/lib/supabase";

const dashboardQueryKeys = {
  data: (userId: string) => ["dashboard", userId] as const,
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseSummary | null>(
    null,
  );
  const [deletingCourse, setDeletingCourse] = useState<CourseSummary | null>(
    null,
  );

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: dashboardQueryKeys.data(user?.id ?? ""),
    queryFn: () => fetchDashboardData(user!.id),
    enabled: !!user,
  });

  const { data: profileData } = useQuery({
    queryKey: profileQueryKeys.detail(user?.id ?? ""),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.data(user!.id),
    });
  };

  const handleEditCourse = async (
    courseId: string,
    title: string,
    description: string,
    targetGrade?: number,
  ) => {
    await updateCourse(courseId, { title, description, targetGrade });
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.data(user!.id),
    });
    // Invalidate pass chance since target grade may have changed
    queryClient.invalidateQueries({ queryKey: ["test"] });
    toast.success("Course updated");
  };

  const handleDeleteCourse = async (courseId: string) => {
    await deleteCourse(courseId);
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.data(user!.id),
    });
    toast.success("Course deleted");
  };

  // Subscribe to real-time document status updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dashboard-document-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "documents",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: dashboardQueryKeys.data(user.id),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  if (!user) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load dashboard
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: dashboardQueryKeys.data(user.id),
                })
              }
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </>
    );
  }

  const hasNoCourses = !dashboardData || dashboardData.courses.length === 0;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          {hasNoCourses ? (
            <EmptyState onUpload={() => setUploadModalOpen(true)} />
          ) : (
            <div className="space-y-6">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Your Courses</h1>
                <Button
                  className="gap-2"
                  onClick={() => setUploadModalOpen(true)}
                >
                  <Upload className="w-4 h-4" />
                  Upload Materials
                </Button>
              </div>

              {/* Course grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {dashboardData!.courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    curriculum={profileData?.curriculum ?? "percentage"}
                    onClick={() => navigate(`/course/${course.id}`)}
                    onEdit={() => setEditingCourse(course)}
                    onDelete={() => setDeletingCourse(course)}
                  />
                ))}

                {/* "+ New Course" card */}
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-muted-foreground/20 p-8 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer min-h-48"
                >
                  <div className="p-3 rounded-full bg-muted">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">New Course</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        userId={user.id}
        onUploadComplete={handleUploadComplete}
      />

      <EditCourseDialog
        open={!!editingCourse}
        onOpenChange={(open) => !open && setEditingCourse(null)}
        course={editingCourse}
        curriculum={profileData?.curriculum ?? "percentage"}
        onSave={handleEditCourse}
      />

      <DeleteCourseDialog
        open={!!deletingCourse}
        onOpenChange={(open) => !open && setDeletingCourse(null)}
        course={deletingCourse}
        onConfirm={handleDeleteCourse}
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────────
 * Course Card — title, doc count, pass chance, take quiz
 * ────────────────────────────────────────────────────── */

function CourseCard({
  course,
  curriculum,
  onClick,
  onEdit,
  onDelete,
}: {
  course: CourseSummary;
  curriculum: string;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isProcessing = course.hasProcessing;
  const passPercent =
    course.passChance !== null ? Math.round(course.passChance * 100) : null;

  return (
    <Card
      className="relative rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      {/* Context menu */}
      <div
        className="absolute top-3 right-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="pt-8 pb-6 px-6 space-y-4">
        {/* Course title */}
        <h3 className="font-semibold text-base leading-tight line-clamp-2 pr-8">
          {course.title}
        </h3>

        {/* Document count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span>
            {course.documentCount}{" "}
            {course.documentCount === 1 ? "document" : "documents"}
          </span>
        </div>

        {/* Pass chance */}
        <div className="space-y-1">
          {isProcessing && course.documentCount > 0 ? (
            <div className="flex items-center gap-2 text-sm text-blue-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing documents...</span>
            </div>
          ) : passPercent !== null ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Passing Chance</span>
                <span
                  className={`font-bold text-lg ${
                    passPercent >= 70
                      ? "text-emerald-600 dark:text-emerald-400"
                      : passPercent >= 40
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {passPercent}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Target: {getGradeLabel(curriculum, course.targetGrade)}
              </p>
              {/* Simple progress bar */}
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    passPercent >= 70
                      ? "bg-emerald-500"
                      : passPercent >= 40
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${passPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Not yet tested
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
 * Empty State — first-time user
 * ────────────────────────────────────────────────────── */

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome to PassAI</h1>
        <p className="text-muted-foreground">
          Upload your study materials and we'll generate quizzes to test your
          understanding and estimate your passing chance.
        </p>
      </div>

      <Button size="lg" className="gap-2" onClick={onUpload}>
        <Upload className="w-5 h-5" />
        Upload Your First Material
      </Button>

      <div className="grid grid-cols-3 gap-6 pt-8 text-center">
        <div className="space-y-1">
          <div className="text-2xl">📄</div>
          <p className="text-xs text-muted-foreground">Upload your materials</p>
        </div>
        <div className="space-y-1">
          <div className="text-2xl">📝</div>
          <p className="text-xs text-muted-foreground">
            Take AI-generated quizzes
          </p>
        </div>
        <div className="space-y-1">
          <div className="text-2xl">📊</div>
          <p className="text-xs text-muted-foreground">
            See your passing chance
          </p>
        </div>
      </div>
    </div>
  );
}
