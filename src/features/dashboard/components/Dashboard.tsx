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
import { VineDecoration } from "@/components/garden/VineDecoration";
import { GardenInlineIcon } from "@/components/garden/GardenIcons";

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
      <VineDecoration />
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
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
              <hr className="garden-divider" />
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <GardenInlineIcon type="leaf" size={22} />
                    <h2 className="text-lg font-semibold">Your Courses</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-[#2D6A4F] hover:bg-[rgba(64,145,108,0.06)]"
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
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[rgba(64,145,108,0.25)] p-6 text-muted-foreground hover:border-[#40916C] hover:text-[#2D6A4F] hover:bg-[rgba(64,145,108,0.04)] transition-all duration-200 cursor-pointer min-h-[200px]"
                  >
                    <div className="p-3 rounded-full bg-[rgba(64,145,108,0.08)]">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">New Course</span>
                  </button>
                </div>
              </section>
              {/* Cat napping at the end of today's study path */}
              <div className="flex justify-end pt-1 pr-1 opacity-45">
                <Neko size={52} />
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
    <div
      className="flex flex-col sm:flex-row items-center gap-8 rounded-2xl p-6 sm:p-8"
      style={{
        background: "linear-gradient(135deg, rgba(64,145,108,0.07) 0%, rgba(13,115,119,0.05) 50%, rgba(250,243,224,0) 100%)",
        border: "1px solid rgba(64,145,108,0.15)",
      }}
    >
      <div className="shrink-0 text-center">
        <CircularProgress value={data.overallPassProbability} size={140} strokeWidth={10} labelClassName="text-2xl" />
        <p className={`text-sm font-medium mt-2 ${getGardenStatus(data.overallPassProbability).color}`}>
          {getGardenStatus(data.overallPassProbability).label}
        </p>
      </div>
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
            <span className="font-semibold text-foreground">{data.totalConcepts}</span>{" "}
            concepts across{" "}
            <span className="font-semibold text-foreground">{data.totalCourses}</span>{" "}
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
    <Card
      className={`relative overflow-hidden rounded-2xl transition-all duration-200 ${
        isClickable
          ? "cursor-pointer hover:shadow-[0_6px_24px_rgba(27,67,50,0.12)] hover:-translate-y-0.5 active:translate-y-0"
          : "opacity-80"
      } ${isRecommended ? "ring-2 ring-[rgba(64,145,108,0.4)] shadow-md" : ""}`}
      style={{ borderTop: "3px solid rgba(64,145,108,0.25)" }}
      onClick={isClickable ? onClick : undefined}
    >
      {isRecommended && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1B4332] bg-[rgba(64,145,108,0.12)] px-2 py-0.5 rounded-full border border-[rgba(64,145,108,0.2)]">
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
      <CardContent className="flex flex-col items-center text-center pt-7 pb-5 px-4">
        <div className="mb-4">
          {isProcessing && course.totalConcepts === 0 ? (
            <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <CircularProgress value={course.passProbability} size={80} strokeWidth={7} labelClassName="text-base" />
          )}
        </div>
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1.5 min-h-10">
          {course.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {course.totalConcepts > 0 ? (
            <span className={`font-medium ${getGardenStatus(course.passProbability).color}`}>
              {getGardenStatus(course.passProbability).label}
            </span>
          ) : isProcessing ? (
            <span className="text-primary">Processing...</span>
          ) : (
            <>{course.documentCount} {course.documentCount === 1 ? "doc" : "docs"}</>
          )}
        </p>
        {isClickable && (
          <div className="mt-3 text-[rgba(64,145,108,0.5)]">
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Empty State ── */
function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 max-w-md mx-auto">
      <div className="relative">
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(64,145,108,0.12) 0%, transparent 70%)",
            width: 200, height: 200, top: -40, left: -40
          }}
        />
        <div className="flex items-end gap-4 relative">
          <svg width="28" height="52" viewBox="0 0 28 52" fill="none" className="opacity-50 mb-1">
            <line x1="14" y1="52" x2="14" y2="28" stroke="#40916C" strokeWidth="1.5" />
            <ellipse cx="8" cy="28" rx="7" ry="4.5" fill="#52B788" opacity="0.4" transform="rotate(-10 8 28)" />
            <ellipse cx="20" cy="23" rx="6" ry="4" fill="#40916C" opacity="0.35" transform="rotate(15 20 23)" />
            <ellipse cx="7" cy="18" rx="5" ry="3.5" fill="#74C69D" opacity="0.3" transform="rotate(-20 7 18)" />
          </svg>
          <Neko size={60} className="opacity-60" />
          <svg width="24" height="44" viewBox="0 0 24 44" fill="none" className="opacity-45 mb-2">
            <line x1="12" y1="44" x2="12" y2="24" stroke="#40916C" strokeWidth="1.5" />
            <ellipse cx="17" cy="26" rx="6" ry="3.5" fill="#52B788" opacity="0.4" transform="rotate(10 17 26)" />
            <ellipse cx="7" cy="20" rx="5" ry="3" fill="#40916C" opacity="0.35" transform="rotate(-15 7 20)" />
          </svg>
        </div>
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Your garden is ready.</h1>
        <p className="text-muted-foreground leading-relaxed">
          Plant your first seed — upload your study materials and we'll show you where you stand before the exam does.
        </p>
      </div>
      <Button size="lg" className="gap-2 shadow-[0_4px_16px_rgba(13,115,119,0.25)]" onClick={onUpload}>
        <Upload className="w-5 h-5" />
        Plant a Seed
      </Button>
      <div className="grid grid-cols-3 gap-6 pt-2 text-center w-full">
        {[
          { img: "/plant-seedling-raw.png", label: "Upload your notes" },
          { img: "/plant-young-raw.png", label: "Take the quiz" },
          { img: "/plant-lush-raw.png", label: "See if you'll pass" },
        ].map(({ img, label }) => (
          <div key={label} className="space-y-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "rgba(64,145,108,0.08)", border: "1px solid rgba(64,145,108,0.15)" }}
            >
              <img src={img} alt="" className="w-9 h-9 object-contain" style={{ mixBlendMode: "multiply" }} />
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
