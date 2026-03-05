import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Upload,
  ArrowRight,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchDashboardData } from "../services/dashboardService";
import { updateCourse, deleteCourse } from "@/features/courses";
import { fetchProfile } from "@/features/settings";
import { profileQueryKeys } from "@/lib/queryKeys";
import { UploadModal } from "./UploadModal";
import { EditCourseDialog } from "./EditCourseDialog";
import { DeleteCourseDialog } from "./DeleteCourseDialog";
import type { CourseSummary, DashboardData } from "../types";
import { supabase } from "@/lib/supabase";
import { getGardenStatus, getStudyCTA, getDashboardSubtitle } from "@/lib/garden";
import { Neko } from "@/components/garden/Neko";

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

  // Subscribe to real-time updates for documents and bkt_mastery
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dashboard-updates")
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bkt_mastery",
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
  const nextItem = dashboardData?.nextStudyItem;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          {hasNoCourses ? (
            <EmptyState onUpload={() => setUploadModalOpen(true)} />
          ) : (
            <div className="space-y-10">
              {/* ── Hero: pass probability ring + CTA ── */}
              <HeroSection
                data={dashboardData!}
                onStartStudying={() => {
                  if (nextItem) navigate(`/course/${nextItem.courseId}`);
                }}
                onUpload={() => setUploadModalOpen(true)}
              />

              {/* ── Course grid ── */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold">Your Courses</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Material
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {dashboardData!.courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      isRecommended={nextItem?.courseId === course.id}
                      onClick={() => navigate(`/course/${course.id}`)}
                      onEdit={() => setEditingCourse(course)}
                      onDelete={() => setDeletingCourse(course)}
                    />
                  ))}

                  {/* "+ New" card */}
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-muted-foreground/20 p-6 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer min-h-50"
                  >
                    <div className="p-3 rounded-full bg-muted">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">New Course</span>
                  </button>
                </div>
              </section>
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
 * Hero Section — overall pass probability ring + primary CTA
 * ────────────────────────────────────────────────────── */

function HeroSection({
  data,
  onStartStudying,
  onUpload,
}: {
  data: DashboardData;
  onStartStudying: () => void;
  onUpload: () => void;
}) {
  const { user } = useAuth();
  const name = user?.email?.split("@")[0] ?? "";
  const hasStudyable = data.courses.some((c) => c.totalConcepts > 0);
  const nextItem = data.nextStudyItem;

  const subtitle = getDashboardSubtitle(hasStudyable, nextItem?.reason ?? null);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      {/* Pass Probability Ring */}
      <div className="shrink-0 text-center">
        <CircularProgress
          value={data.overallPassProbability}
          size={140}
          strokeWidth={10}
          labelClassName="text-2xl"
        />
        <p className={`text-sm font-medium mt-2 ${getGardenStatus(data.overallPassProbability).color}`}>
          {getGardenStatus(data.overallPassProbability).label}
        </p>
      </div>

      {/* Text + CTA */}
      <div className="flex-1 text-center sm:text-left space-y-3">
        <div>
          <h1 className="text-2xl font-bold">
            {name ? `Welcome back, ${name}` : "Welcome back"}
          </h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {hasStudyable && data.totalConcepts > 0 && (
          <p className="text-sm text-muted-foreground">
            Studying{" "}
            <span className="font-semibold text-foreground">
              {data.totalConcepts}
            </span>{" "}
            concepts across{" "}
            <span className="font-semibold text-foreground">
              {data.totalCourses}
            </span>{" "}
            {data.totalCourses === 1 ? "course" : "courses"}
          </p>
        )}

        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          {hasStudyable && nextItem ? (
            <Button size="lg" className="gap-2" onClick={onStartStudying}>
              <Sparkles className="w-4 h-4" />
              {getStudyCTA(nextItem.reason)}
            </Button>
          ) : (
            <Button size="lg" className="gap-2" onClick={onUpload}>
              <Upload className="w-4 h-4" />
              Plant a Seed
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Course Card — circular progress ring + title + meta
 * ────────────────────────────────────────────────────── */

function CourseCard({
  course,
  isRecommended,
  onClick,
  onEdit,
  onDelete,
}: {
  course: CourseSummary;
  isRecommended: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isProcessing = course.hasProcessing;
  const isClickable = course.totalConcepts > 0;

  return (
    <Card
      className={`relative overflow-hidden rounded-2xl transition-all duration-200 ${
        isClickable
          ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          : "opacity-80"
      } ${isRecommended ? "ring-2 ring-primary/40 shadow-md" : ""}`}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Next up
          </span>
        </div>
      )}

      {/* Context menu */}
      <div
        className="absolute top-2.5 right-2.5 z-10"
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

      <CardContent className="flex flex-col items-center text-center pt-7 pb-5 px-4">
        {/* Progress ring */}
        <div className="mb-4">
          {isProcessing && course.totalConcepts === 0 ? (
            <div
              className="relative flex items-center justify-center"
              style={{ width: 80, height: 80 }}
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <CircularProgress
              value={course.passProbability}
              size={80}
              strokeWidth={7}
              labelClassName="text-base"
            />
          )}
        </div>

        {/* Course name */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1.5 min-h-10">
          {course.title}
        </h3>

        {/* Meta line */}
        <p className="text-xs text-muted-foreground">
          {course.totalConcepts > 0 ? (
            <span className={`font-medium ${getGardenStatus(course.passProbability).color}`}>
              {getGardenStatus(course.passProbability).label}
            </span>
          ) : isProcessing ? (
            <span className="text-primary">Processing...</span>
          ) : (
            <>
              {course.documentCount}{" "}
              {course.documentCount === 1 ? "doc" : "docs"}
            </>
          )}
        </p>

        {/* Arrow hint for clickable cards */}
        {isClickable && (
          <div className="mt-3 text-muted-foreground/40">
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
 * Empty State — first-time user
 * ────────────────────────────────────────────────────── */

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 max-w-md mx-auto">
      {/* Garden illustration with cat */}
      <div className="flex items-end gap-4">
        <svg width="32" height="48" viewBox="0 0 32 48" fill="none" className="opacity-40">
          <line x1="16" y1="48" x2="16" y2="28" stroke="#0D7377" strokeWidth="2" />
          <ellipse cx="10" cy="32" rx="6" ry="4" fill="#0D7377" opacity="0.3" />
          <ellipse cx="22" cy="32" rx="6" ry="4" fill="#0D7377" opacity="0.3" />
        </svg>
        <Neko size={56} className="opacity-50" />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Your garden is ready.</h1>
        <p className="text-muted-foreground leading-relaxed">
          Plant your first seed — upload your study materials and
          we'll help you see where you stand.
        </p>
      </div>

      <Button size="lg" className="gap-2" onClick={onUpload}>
        <Upload className="w-5 h-5" />
        Plant a Seed
      </Button>

      <div className="grid grid-cols-3 gap-6 pt-4 text-center">
        <div className="space-y-1">
          <div className="text-2xl">🌱</div>
          <p className="text-xs text-muted-foreground">Plant your materials</p>
        </div>
        <div className="space-y-1">
          <div className="text-2xl">🌿</div>
          <p className="text-xs text-muted-foreground">Walk the path</p>
        </div>
        <div className="space-y-1">
          <div className="text-2xl">🌳</div>
          <p className="text-xs text-muted-foreground">Watch things grow</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/50 italic pt-2">
        kanso (簡素) — simplicity is where understanding begins
      </p>
    </div>
  );
}
