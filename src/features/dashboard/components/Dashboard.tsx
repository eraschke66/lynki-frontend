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
  Plus,
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
import { getGardenStatus, getStudyCTA, getDashboardSubtitle } from "@/lib/garden";
import { Neko } from "@/components/garden/Neko";
import { VineDecoration } from "@/components/garden/VineDecoration";

const dashboardQueryKeys = {
  data: (userId: string) => ["dashboard", userId] as const,
};

/** Map a pass probability to one of our plant PNG assets */
function getPlantImage(probability: number): string {
  if (probability >= 75) return "/plant-lush-raw.png";
  if (probability >= 55) return "/plant-flower-raw.png";
  if (probability >= 35) return "/plant-young-raw.png";
  return "/plant-seedling-raw.png";
}

/** Map a pass probability to a bonsai/tree image for the hero */
function getHeroTreeImage(probability: number): string {
  if (probability >= 75) return "/thriving-tree-icon.png";
  if (probability >= 55) return "/blooming-icon.png";
  if (probability >= 35) return "/growing-icon.png";
  return "/plant-young-raw.png";
}

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
      {/* Sleeping cat — bottom right corner, tail wagging */}
      <Neko placement="bottom-right" width={150} />
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

              {/* Garden divider */}
              <hr className="garden-divider" />

              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2
                    style={{
                      fontFamily: "'Lora', Georgia, serif",
                      fontSize: 20,
                      fontWeight: 600,
                      color: "#1B4332",
                    }}
                  >
                    Your Learning Garden
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-[#2D6A4F] hover:bg-[rgba(64,145,108,0.06)]"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Course
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
                  {/* Add new course card */}
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl transition-all duration-200 cursor-pointer min-h-[200px]"
                    style={{
                      border: "2px dashed rgba(64,145,108,0.3)",
                      background: "rgba(250,243,224,0.4)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(64,145,108,0.55)";
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(64,145,108,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(64,145,108,0.3)";
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(250,243,224,0.4)";
                    }}
                  >
                    <img
                      src="/plant-seedling-raw.png"
                      alt=""
                      style={{ width: 40, height: 40, objectFit: "contain", mixBlendMode: "multiply", opacity: 0.5 }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#40916C" }}>
                      Plant a New Course
                    </span>
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

/* ── Hero Section — bonsai tree replacing the orange donut ── */
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
  const status = getGardenStatus(data.overallPassProbability);
  const treeImg = getHeroTreeImage(data.overallPassProbability);

  return (
    <div
      className="rounded-2xl p-6 sm:p-8"
      style={{
        background: "linear-gradient(135deg, rgba(250,243,224,0.8) 0%, rgba(232,238,216,0.6) 100%)",
        border: "1px solid rgba(64,145,108,0.18)",
        boxShadow: "0 2px 20px rgba(27,67,50,0.08)",
      }}
    >
      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "#7a9a7a",
          marginBottom: 8,
          fontFamily: "'Lora', Georgia, serif",
          fontStyle: "italic",
        }}
      >
        Your Learning Garden
      </p>

      {/* Bonsai hero tree */}
      <div className="flex flex-col items-center mb-6">
        <div style={{ position: "relative", width: 160, height: 160 }}>
          <img
            src={treeImg}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              mixBlendMode: "multiply",
              filter: "drop-shadow(0 4px 12px rgba(27,67,50,0.15))",
            }}
          />
        </div>
        {/* Status label below tree */}
        <p
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 17,
            fontWeight: 600,
            color: "#1B4332",
            marginTop: 4,
          }}
        >
          {status.label}
        </p>
        <p style={{ fontSize: 12, color: "#7a9a7a", marginTop: 2 }}>
          {status.japanese} · {Math.round(data.overallPassProbability)}% overall
        </p>
      </div>

      {/* Welcome text + CTA */}
      <div className="text-center space-y-3">
        <div>
          <h1
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 22,
              fontWeight: 600,
              color: "#1B4332",
            }}
          >
            {name ? `Welcome back, ${name}` : "Welcome back"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
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
        <div className="flex flex-wrap gap-3 justify-center">
          {hasStudyable && nextItem ? (
            <button
              onClick={onStartStudying}
              style={{
                background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)",
                color: "#FEFAE0",
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "'Nunito', sans-serif",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(27,67,50,0.28)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(27,67,50,0.38)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(27,67,50,0.28)";
              }}
            >
              {getStudyCTA(nextItem.reason)}
            </button>
          ) : (
            <button
              onClick={onUpload}
              style={{
                background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)",
                color: "#FEFAE0",
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "'Nunito', sans-serif",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(27,67,50,0.28)",
                transition: "all 0.2s",
              }}
            >
              Plant a Seed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Course Card — Ghibli parchment + plant image ── */
function CourseCard({ course, isRecommended, onClick, onEdit, onDelete }: {
  course: CourseSummary;
  isRecommended: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isProcessing = course.hasProcessing;
  const isClickable = course.totalConcepts > 0;
  const status = getGardenStatus(course.passProbability);
  const plantImg = getPlantImage(course.passProbability);

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      style={{
        background: "linear-gradient(160deg, #FEFAE0 0%, #FDF5D0 60%, #FAF0C0 100%)",
        border: isRecommended
          ? "2px solid rgba(64,145,108,0.5)"
          : "1px solid rgba(64,145,108,0.18)",
        borderRadius: 18,
        padding: "20px 16px 16px",
        cursor: isClickable ? "pointer" : "default",
        opacity: isClickable ? 1 : 0.8,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        boxShadow: isRecommended
          ? "0 4px 20px rgba(27,67,50,0.14)"
          : "0 2px 12px rgba(27,67,50,0.08)",
        transition: "all 0.2s",
        minHeight: 200,
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(27,67,50,0.18)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = isRecommended
          ? "0 4px 20px rgba(27,67,50,0.14)"
          : "0 2px 12px rgba(27,67,50,0.08)";
      }}
    >
      {/* "Next up" badge */}
      {isRecommended && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#1B4332",
            background: "rgba(64,145,108,0.12)",
            border: "1px solid rgba(64,145,108,0.2)",
            borderRadius: 20,
            padding: "2px 7px",
          }}
        >
          Next up
        </div>
      )}

      {/* Three-dot menu */}
      <div
        style={{ position: "absolute", top: 6, right: 6, zIndex: 10 }}
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
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Plant image */}
      <div style={{ marginTop: 12, marginBottom: 8, height: 72 }}>
        {isProcessing && course.totalConcepts === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#40916C" }} />
          </div>
        ) : (
          <img
            src={plantImg}
            alt=""
            style={{
              height: "100%",
              width: "auto",
              objectFit: "contain",
              mixBlendMode: "multiply",
              filter: "drop-shadow(0 2px 6px rgba(27,67,50,0.12))",
            }}
          />
        )}
      </div>

      {/* Course name */}
      <h3
        style={{
          fontFamily: "'Lora', Georgia, serif",
          fontWeight: 600,
          fontSize: 14,
          color: "#1B4332",
          lineHeight: 1.35,
          marginBottom: 4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {course.title}
      </h3>

      {/* Status label */}
      <p style={{ fontSize: 11, color: "#7a9a7a", marginBottom: 12 }}>
        {course.totalConcepts > 0 ? (
          status.label
        ) : isProcessing ? (
          <span style={{ color: "#40916C" }}>Processing...</span>
        ) : (
          `${course.documentCount} ${course.documentCount === 1 ? "doc" : "docs"}`
        )}
      </p>

      {/* Walk the Path button */}
      {isClickable && (
        <button
          style={{
            marginTop: "auto",
            background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)",
            color: "#FEFAE0",
            border: "none",
            borderRadius: 10,
            padding: "8px 18px",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Nunito', sans-serif",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(27,67,50,0.25)",
            letterSpacing: "0.01em",
          }}
        >
          Walk the Path
        </button>
      )}
    </div>
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
          <img src="/plant-seedling-raw.png" alt="" style={{ width: 32, height: 56, objectFit: "contain", mixBlendMode: "multiply", opacity: 0.5, marginBottom: 4 }} />
          <Neko size={60} className="opacity-60" />
          <img src="/plant-young-raw.png" alt="" style={{ width: 28, height: 48, objectFit: "contain", mixBlendMode: "multiply", opacity: 0.45, marginBottom: 8 }} />
        </div>
      </div>
      <div className="space-y-3">
        <h1
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 28,
            fontWeight: 600,
            color: "#1B4332",
          }}
        >
          Your garden is ready.
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Plant your first seed — upload your study materials and we'll show you where you stand before the exam does.
        </p>
      </div>
      <button
        onClick={onUpload}
        style={{
          background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)",
          color: "#FEFAE0",
          border: "none",
          borderRadius: 14,
          padding: "14px 32px",
          fontSize: 16,
          fontWeight: 600,
          fontFamily: "'Nunito', sans-serif",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(27,67,50,0.3)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Upload className="w-5 h-5" />
        Plant a Seed
      </button>
      <div className="grid grid-cols-3 gap-6 pt-2 text-center w-full">
        {[
          { img: "/plant-seedling-raw.png", label: "Upload your notes" },
          { img: "/plant-young-raw.png", label: "Take the quiz" },
          { img: "/plant-lush-raw.png", label: "See if you'll pass" },
        ].map(({ img, label }) => (
          <div key={label} className="space-y-2">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
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
