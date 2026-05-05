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
import { AddCourseCard } from "@/components/garden/AddCourseCard";

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
      <GhibliBackground />
      <div className="relative overflow-x-hidden">
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
                <div className="flex items-end justify-between mb-5 px-1">
                  <h2 className="font-serif text-2xl md:text-3xl font-semibold text-ghibli-canopy">Your Courses</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-ghibli-canopy/70 hover:text-ghibli-forest hover:bg-ghibli-ivory/60"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Material
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <AddCourseCard onClick={() => setUploadModalOpen(true)} />
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
    <ParchmentCard glow className="p-8 md:p-12 flex flex-col items-center gap-4 overflow-hidden">
      <h2 className="font-serif text-2xl md:text-3xl font-semibold text-ghibli-canopy mb-1 text-center">
        {name ? `Welcome back, ${name}` : "Your Learning Garden"}
      </h2>
      <PlantIndicator probability={data.overallProgress} size="xl" glow showPercent />
      <p className="text-sm md:text-base font-sans text-ghibli-bark/80 mt-2 text-center max-w-md leading-relaxed">
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
          <Button
            size="lg"
            onClick={onStartStudying}
            className="gap-2 rounded-full px-8 py-6 text-base font-semibold bg-gradient-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-lg hover:shadow-glow transition-all"
          >
            <Sparkles className="w-4 h-4" />
            {getStudyCTA(nextItem.reason)}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={onUpload}
            className="gap-2 rounded-full px-8 py-6 text-base font-semibold bg-gradient-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-lg hover:shadow-glow transition-all"
          >
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
  const status = getGardenStatus(course.progressPercent);

  return (
    <ParchmentCard
      className={`p-6 flex flex-col gap-4 group ${
        isClickable ? "" : "opacity-80"
      } ${isRecommended ? "ring-2 ring-ghibli-moss/40" : ""}`}
      hover={isClickable}
    >
      {/* Header: title + status badge + menu */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl font-semibold text-ghibli-canopy leading-snug line-clamp-2 flex-1">
          {course.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {course.totalConcepts > 0 ? (
            <span className={`text-[10px] font-sans font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-ghibli-mist/60 ${status.color}`}>
              {status.label}
            </span>
          ) : isProcessing ? (
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-ghibli-mist/60 text-primary">
              Processing…
            </span>
          ) : null}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-ghibli-ivory/60 transition-colors flex-shrink-0">
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
        </div>
      </div>

      {/* Body: plant + animated vine */}
      <div
        onClick={isClickable ? onClick : undefined}
        className={`flex items-center gap-4 ${isClickable ? "cursor-pointer" : ""}`}
      >
        {isProcessing && course.totalConcepts === 0 ? (
          <div className="flex items-center justify-center shrink-0" style={{ width: 64, height: 64 }}>
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <PlantIndicator probability={course.progressPercent} size="md" showPercent />
        )}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {course.totalConcepts > 0 ? (
            <svg viewBox="0 0 100 8" className="w-full h-2.5 overflow-visible" preserveAspectRatio="none" aria-hidden>
              <path
                d="M0 4 Q 25 0, 50 4 T 100 4"
                fill="none"
                stroke="hsl(var(--ghibli-mist))"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0 4 Q 25 0, 50 4 T 100 4"
                fill="none"
                stroke="hsl(var(--ghibli-forest))"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="100"
                strokeDashoffset={100 - course.progressPercent}
                style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
              />
            </svg>
          ) : (
            <p className="text-xs font-sans text-muted-foreground">
              {course.documentCount} {course.documentCount === 1 ? "doc" : "docs"}
            </p>
          )}
          <span className="font-sans text-xs text-muted-foreground italic line-clamp-1">
            Tend regularly to keep it thriving
          </span>
        </div>
      </div>

      {/* CTA */}
      {isClickable && (
        <Button
          onClick={onClick}
          className="w-full rounded-full font-sans text-sm font-semibold tracking-wide bg-gradient-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy text-primary-foreground shadow-md hover:shadow-lg transition-all gap-1"
        >
          Walk the Path
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </ParchmentCard>
  );
}

/* ── Empty State ── */
function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 max-w-md mx-auto">
      <ParchmentCard glow className="p-10 md:p-12 flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-ghibli-sunlight/30 blur-2xl scale-125" />
          <img
            src="/seedling-add.png"
            alt="Plant your first seed"
            className="relative w-20 h-20 object-contain select-none animate-glow-soft"
          />
        </div>
        <div className="space-y-3">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ghibli-canopy">Your garden is ready.</h1>
          <p className="text-ghibli-bark/80 font-sans leading-relaxed">
            Plant your first seed — upload your study materials and we'll show you where you stand before the exam does.
          </p>
        </div>
        <Button
          size="lg"
          onClick={onUpload}
          className="gap-2 rounded-full px-8 py-6 text-base font-semibold bg-gradient-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-lg hover:shadow-glow transition-all"
        >
          <Upload className="w-5 h-5" />
          Plant a Seed
        </Button>
      </ParchmentCard>
    </div>
  );
}
