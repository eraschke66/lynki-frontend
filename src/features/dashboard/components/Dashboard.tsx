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
  Loader2,
  AlertCircle,
  RefreshCw,
  Upload,
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
import { getGardenStatus, getStudyCTA } from "@/lib/garden";
import { getGradeLabel } from "@/lib/curricula";
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
        <div className="absolute inset-0 bg-ghibli-canopy/20" />
        <div className="relative z-10 text-center pb-16 space-y-3">
          <p className="text-white text-base font-medium tracking-wide text-shadow-hero">
            Getting your materials together...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <GhibliBackground />
        <Header />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 flex items-center justify-center">
          <ParchmentCard className="p-10 text-center flex flex-col items-center gap-4 max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="font-sans text-sm text-ghibli-bark/80">Failed to load dashboard</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.data(user.id) })}
              className="rounded-full border-ghibli-moss/40 hover:border-ghibli-forest hover:bg-ghibli-ivory/60"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </ParchmentCard>
        </div>
      </div>
    );
  }

  const hasNoCourses = !dashboardData || dashboardData.courses.length === 0;
  const processingCourses = dashboardData?.courses.filter(c => c.hasProcessing) ?? [];
  const hasProcessing = processingCourses.length > 0;
  const nextItem = dashboardData?.nextStudyItem;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <GhibliBackground />
      <Header />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-6 md:pt-8 pb-8 md:pb-16">
        {hasNoCourses ? (
          <EmptyState onUpload={() => setUploadModalOpen(true)} />
        ) : (
          <>
            {/* Prominent Processing Indicator */}
            {hasProcessing && (
              <ParchmentCard className="p-0 mb-10 overflow-hidden border-ghibli-moss/30 shadow-glow-soft animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="relative h-32 md:h-40 flex items-center justify-center">
                  <video
                    src="/garden-loader.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-linear-to-r from-ghibli-cream via-ghibli-cream/20 to-ghibli-cream" />
                  <div className="relative z-10 text-center space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-ghibli-canopy" />
                      <h3 className="font-serif text-xl font-bold text-ghibli-canopy">Reading your materials...</h3>
                    </div>
                    <p className="font-sans text-xs text-ghibli-bark/80 max-w-xs mx-auto">
                      We're extracting concepts from {processingCourses.length === 1 ? processingCourses[0].title : `${processingCourses.length} courses`}. This usually takes 1-2 minutes.
                    </p>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-ghibli-moss/10 overflow-hidden">
                  <div className="h-full bg-ghibli-moss animate-pulse" style={{ width: '60%' }} />
                </div>
              </ParchmentCard>
            )}

            <HeroSection
              data={dashboardData!}
              curriculum={profileData?.curriculum ?? "percentage"}
              onStartStudying={() => {
                if (nextItem) navigate(`/course/${nextItem.courseId}`);
              }}
              onUpload={() => setUploadModalOpen(true)}
            />

            {/* Section heading */}
            <div className="flex items-end justify-between mb-5 px-1">
              <div>
                <h3 className="font-serif text-2xl md:text-3xl font-semibold text-ghibli-canopy">
                  Your Study Garden
                </h3>
                <p className="font-sans text-sm text-ghibli-bark/70 italic mt-1">
                  {dashboardData!.courses.length} {dashboardData!.courses.length === 1 ? "course" : "courses"} planted • last tended today
                </p>
              </div>
            </div>

            {/* Course grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
              <AddCourseCard onClick={() => setUploadModalOpen(true)} />
            </div>

            {/* Footer */}
            <p className="text-center text-ghibli-bark/50 text-xs font-sans italic mt-10 md:mt-16 mb-4 tracking-wide">
              🌿 Study gently · grow steadily · breathe deeply 🌿
            </p>
          </>
        )}
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
    </div>
  );
}

/* ── Hero Section — oasis "Tend Your Study Garden" two-column ── */
function HeroSection({ data, curriculum, onStartStudying, onUpload }: {
  data: DashboardData;
  curriculum: string;
  onStartStudying: () => void;
  onUpload: () => void;
}) {
  const hasStudyable = data.courses.some((c) => c.totalConcepts > 0);
  const nextItem = data.nextStudyItem;

  // No quiz activity yet → hide the bar, nudge toward a first quiz.
  const hasAnyMastery = data.courses.some((c) => c.masteredConcepts > 0);
  // Target grade for the bar caption: the course furthest from passing.
  const lowestPassCourse = data.courses.length
    ? data.courses.reduce(
        (min, c) => (c.passProbability < min.passProbability ? c : min),
        data.courses[0],
      )
    : null;
  const targetGrade = lowestPassCourse?.targetGrade ?? 0.5;

  const primaryAction = hasStudyable && nextItem ? onStartStudying : onUpload;
  const ctaLabel = !hasAnyMastery && hasStudyable
    ? "Generate Your First Quiz"
    : hasStudyable && nextItem
      ? getStudyCTA(nextItem.reason)
      : "Plant a Seed";

  return (
    <ParchmentCard className="p-5 md:p-12 mb-6 md:mb-10 overflow-hidden" glow>
      <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
        <div className="text-center md:text-left order-2 md:order-1">
          <span className="inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-moss mb-3 px-3 py-1 rounded-full bg-ghibli-mist/60">
            Your Sanctuary
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-ghibli-canopy leading-tight mb-4">
            Tend Your<br />Study Garden
          </h2>
          {hasAnyMastery ? (
            <div className="max-w-[360px] mx-auto md:mx-0 mb-6">
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-ghibli-bark">
                  Growing toward {getGradeLabel(curriculum, targetGrade)}
                </span>
                <span className="text-sm font-medium text-ghibli-canopy">
                  {data.overallPassProbability}% pass probability
                </span>
              </div>
              <div
                className="relative h-2.5 rounded-full overflow-hidden"
                style={{ background: "#e8e3d5" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${data.overallPassProbability}%`, background: "#6b8e4e" }}
                />
                <div
                  className="absolute"
                  style={{ left: "85%", width: "2px", top: "-3px", bottom: "-3px", background: "#4a6b3a" }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-ghibli-canopy/65">
                <span>Needs water</span>
                <span className="mr-[13%]">Thriving</span>
              </div>
            </div>
          ) : (
            <p className="font-sans text-base text-ghibli-bark/80 leading-relaxed mb-4 md:mb-6 max-w-md mx-auto md:mx-0">
              Take your first quiz to see your pass probability.
            </p>
          )}
          <Button
            size="lg"
            onClick={primaryAction}
            className="gap-2 rounded-full px-8 py-6 text-base font-semibold bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-lg hover:shadow-glow transition-all"
          >
            {hasStudyable && nextItem ? (
              <Sparkles className="w-4 h-4" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {ctaLabel}
          </Button>
        </div>
        <div className="order-1 md:order-2 flex justify-center">
          <PlantIndicator probability={data.overallProgress} size="xl" glow showPercent />
        </div>
      </div>
    </ParchmentCard>
  );
}

/* ── Course Card — oasis arched parchment frame ── */
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
      hover={isClickable}
      className={`relative p-6 flex flex-col gap-3 group overflow-hidden ${isClickable ? "" : "pointer-events-none"} ${isRecommended ? "ring-2 ring-ghibli-moss/40" : ""}`}
    >
      {/* Header: title + status pill + 3-dot */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <h3 className="font-serif text-xl font-semibold text-ghibli-canopy leading-snug line-clamp-2 flex-1">
          {course.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {course.totalConcepts > 0 ? (
            <span className={`text-[10px] font-sans font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-ghibli-mist/70 ${status.color}`}>
              {status.label} · {course.passProbability}%
            </span>
          ) : isProcessing ? (
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-ghibli-mist/70 text-primary">
              Processing…
            </span>
          ) : null}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center w-7 h-7 rounded-full text-ghibli-canopy/60 hover:text-ghibli-canopy hover:bg-ghibli-ivory/60 transition-colors shrink-0">
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

      {/* Centerpiece: large plant illustration */}
      <div className="flex justify-center py-4 relative z-10">
        {isProcessing && course.totalConcepts === 0 ? (
          <div className="flex items-center justify-center" style={{ width: 140, height: 140 }}>
            <Loader2 className="w-12 h-12 animate-spin text-ghibli-forest" />
          </div>
        ) : (
          <div className="relative">
            {/* Soft glow halo behind plant */}
            <div className="absolute inset-0 rounded-full bg-ghibli-sunlight/30 blur-2xl scale-110 -z-10" />
            <PlantIndicator probability={course.progressPercent} size="lg" showPercent={false} />
          </div>
        )}
      </div>

      {/* Progress vine */}
      <div className="flex flex-col gap-2 relative z-10">
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
        <span className="font-sans text-xs text-ghibli-bark italic text-center">
          Tend regularly to keep it thriving
        </span>
      </div>

      {/* Walk the Path CTA */}
      <Button
        onClick={onClick}
        disabled={!isClickable}
        className="w-full rounded-full font-sans text-sm font-semibold tracking-wide bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy text-primary-foreground shadow-md hover:shadow-lg transition-all disabled:opacity-60 relative z-10"
      >
        Walk the Path →
      </Button>
    </ParchmentCard>
  );
}

/* ── Empty State ── */
function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
      <ParchmentCard glow className="p-6 md:p-12 flex flex-col items-center gap-6">
        <div className="space-y-3">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ghibli-canopy">Your garden is ready.</h1>
          <p className="text-ghibli-bark/80 font-sans leading-relaxed">
            Plant your first seed — upload your study materials and we'll show you where you stand before the exam does.
          </p>
        </div>
        <Button
          size="lg"
          onClick={onUpload}
          className="gap-2 rounded-full px-8 py-6 text-base font-semibold bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-lg hover:shadow-glow transition-all"
        >
          <Upload className="w-5 h-5" />
          Plant a Seed
        </Button>
      </ParchmentCard>
    </div>
  );
}
