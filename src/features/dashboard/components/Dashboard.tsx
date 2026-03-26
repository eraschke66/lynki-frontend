import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
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
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import GhibliBackground from "@/components/garden/GhibliBackground";

const dashboardQueryKeys = {
  data: (userId: string) => ["dashboard", userId] as const,
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseSummary | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<CourseSummary | null>(null);

  const { data: dashboardData, isLoading, error } = useQuery({
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
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.data(user!.id) });
  };

  const handleEditCourse = async (
    courseId: string,
    title: string,
    description: string,
    targetGrade?: number,
  ) => {
    await updateCourse(courseId, { title, description, targetGrade });
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.data(user!.id) });
    queryClient.invalidateQueries({ queryKey: ["test"] });
    toast.success("Course updated");
  };

  const handleDeleteCourse = async (courseId: string) => {
    await deleteCourse(courseId);
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.data(user!.id) });
    toast.success("Course deleted");
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dashboard-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "documents", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.data(user.id) });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bkt_mastery", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.data(user.id) });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  if (!user) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden"
        style={{ background: "hsl(38 48% 87%)" }}>
        <video
          src="/garden-loader.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "rgba(27,67,50,0.18)" }} />
        <div className="relative z-10 text-center pb-16 space-y-3">
          <p className="text-white text-base font-medium tracking-wide" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            Getting your materials together...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">Failed to load dashboard</p>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.data(user.id) })}>
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
      <div className="relative min-h-screen overflow-hidden">
        <GhibliBackground />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-16">
          {hasNoCourses ? (
            <EmptyState onUpload={() => setUploadModalOpen(true)} />
          ) : (
            <div className="space-y-10">
              <HeroSection
                data={dashboardData!}
                onStartStudying={() => {
                  if (nextItem) navigate(`/course/${nextItem.courseId}`);
                }}
                onUpload={() => setUploadModalOpen(true)}
              />

              {/* Course grid */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-serif text-xl font-semibold text-primary">Your Courses</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-ghibli-forest hover:bg-ghibli-moss/10"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Material
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  {/* Add course card */}
                  <ParchmentCard
                    className="p-5 flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[200px]"
                    hover
                  >
                    <button
                      onClick={() => setUploadModalOpen(true)}
                      className="flex flex-col items-center gap-3 w-full"
                    >
                      <img
                        src="/seedling-add.png"
                        alt="Plant a new seed"
                        className="w-12 h-12 object-contain opacity-60 select-none"
                      />
                      <span className="font-sans text-sm font-medium text-muted-foreground">
                        New Course
                      </span>
                    </button>
                  </ParchmentCard>
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

/* ── Hero Section ── */
function HeroSection({ data, onStartStudying, onUpload }: {
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
    <ParchmentCard className="p-8 flex flex-col items-center gap-4">
      <h2 className="font-serif text-xl font-semibold text-primary mb-1">
        {name ? `Welcome back, ${name}` : "Your Learning Garden"}
      </h2>
      <PlantIndicator probability={data.overallProgress} size="xl" />
      <p className="text-sm font-sans text-muted-foreground mt-2 text-center max-w-md">
        {subtitle}
      </p>
      {hasStudyable && data.totalConcepts > 0 && (
        <p className="text-sm font-sans text-muted-foreground">
          Studying{" "}
          <span className="font-semibold text-foreground">{data.totalConcepts}</span>{" "}
          concepts across{" "}
          <span className="font-semibold text-foreground">{data.totalCourses}</span>{" "}
          {data.totalCourses === 1 ? "course" : "courses"}
        </p>
      )}
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {hasStudyable && nextItem ? (
          <Button size="lg" className="gap-2 rounded-parchment" onClick={onStartStudying}>
            <Sparkles className="w-4 h-4" />
            {getStudyCTA(nextItem.reason)}
          </Button>
        ) : (
          <Button size="lg" className="gap-2 rounded-parchment" onClick={onUpload}>
            <Upload className="w-4 h-4" />
            Plant a Seed
          </Button>
        )}
      </div>
    </ParchmentCard>
  );
}

/* ── Course Card ── */
function CourseCard({ course, isRecommended, onClick, onEdit, onDelete }: {
  course: CourseSummary;
  isRecommended: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isProcessing = course.hasProcessing;
  const isClickable = course.totalConcepts > 0;

  return (
    <ParchmentCard
      className={`p-5 flex flex-col items-center gap-4 text-center relative ${
        isClickable ? "cursor-pointer" : "opacity-80"
      } ${isRecommended ? "ring-2 ring-ghibli-moss/40" : ""}`}
      hover={isClickable}
    >
      {isRecommended && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ghibli-forest bg-ghibli-moss/12 px-2 py-0.5 rounded-full border border-ghibli-moss/20">
            Next up
          </span>
        </div>
      )}
      <div className="absolute top-2.5 right-2.5 z-10" onClick={(e) => e.stopPropagation()}>
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
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div onClick={isClickable ? onClick : undefined} className="flex flex-col items-center gap-3 w-full">
        <h3 className="font-serif text-lg font-semibold text-primary line-clamp-2 min-h-[3rem]">
          {course.title}
        </h3>
        {isProcessing && course.totalConcepts === 0 ? (
          <div className="flex items-center justify-center" style={{ width: 64, height: 64 }}>
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <PlantIndicator probability={course.progressPercent} size="md" />
        )}
        <p className="text-xs font-sans text-muted-foreground">
          {course.totalConcepts > 0 ? (
            <span className={`font-medium ${getGardenStatus(course.progressPercent).color}`}>
              {getGardenStatus(course.progressPercent).label}
            </span>
          ) : isProcessing ? (
            <span className="text-primary">Processing...</span>
          ) : (
            <>{course.documentCount} {course.documentCount === 1 ? "doc" : "docs"}</>
          )}
        </p>
        {isClickable && (
          <div className="mt-1 text-ghibli-moss/50">
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </ParchmentCard>
  );
}

/* ── Empty State ── */
function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 max-w-md mx-auto">
      <ParchmentCard className="p-10 flex flex-col items-center gap-6">
        <img
          src="/seedling-add.png"
          alt="Plant your first seed"
          className="w-20 h-20 object-contain select-none"
        />
        <div className="space-y-3">
          <h1 className="font-serif text-3xl font-bold text-primary">Your garden is ready.</h1>
          <p className="text-muted-foreground font-sans leading-relaxed">
            Plant your first seed — upload your study materials and we'll show you where you stand before the exam does.
          </p>
        </div>
        <Button size="lg" className="gap-2 rounded-parchment" onClick={onUpload}>
          <Upload className="w-5 h-5" />
          Plant a Seed
        </Button>
      </ParchmentCard>
    </div>
  );
}
