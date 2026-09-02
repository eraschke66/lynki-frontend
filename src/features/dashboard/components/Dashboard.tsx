import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { fetchDashboardData } from "../services/dashboardService";
import { updateCourse, deleteCourse } from "@/features/courses";
import { fetchProfile } from "@/features/settings";
import { courseQueryKeys, profileQueryKeys } from "@/lib/queryKeys";
import { UploadModal } from "./UploadModal";
import { EditCourseDialog } from "./EditCourseDialog";
import { DeleteCourseDialog } from "./DeleteCourseDialog";
import type { CourseSummary } from "../types";
import { supabase } from "@/lib/supabase";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { AddCourseCard } from "@/components/garden/AddCourseCard";
import { DashboardSkeleton } from "@/components/garden/GardenSkeletons";
import { HeroSection } from "./dashboard/HeroSection";
import { CourseCard } from "./dashboard/CourseCard";
import { EmptyState } from "./dashboard/EmptyState";
import { ProcessingBanner } from "./dashboard/ProcessingBanner";

const dashboardQueryKeys = {
  data: (userId: string) => ["dashboard", userId] as const,
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadModalCreateMode, setUploadModalCreateMode] = useState(false);
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

  const openUploadModal = (createMode = false) => {
    setUploadModalCreateMode(createMode);
    setUploadModalOpen(true);
  };

  const handleEditCourse = async (
    courseId: string,
    title: string,
    description: string,
    targetGrade?: number,
    curriculumType?: string | null,
  ) => {
    await updateCourse(courseId, { title, description, targetGrade, curriculumType });
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.data(user!.id) });
    queryClient.invalidateQueries({ queryKey: courseQueryKeys.curriculum(courseId) });
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

  // A 4.3 MB video used to cover this wait, which usually lasts a few hundred
  // milliseconds. The skeleton paints instantly in the real layout instead.
  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <GhibliBackground />
        <Header />
        <DashboardSkeleton />
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
            <p className="font-sans text-sm text-ghibli-bark">Failed to load dashboard</p>
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
          <EmptyState onUpload={() => openUploadModal()} />
        ) : (
          <>
            {hasProcessing && <ProcessingBanner processingCourses={processingCourses} />}

            <HeroSection
              data={dashboardData!}
              curriculum={profileData?.curriculum ?? "percentage"}
              onStartStudying={() => {
                if (nextItem) navigate(`/course/${nextItem.courseId}`);
              }}
              onUpload={() => openUploadModal()}
            />

            {/* Section heading */}
            <div className="flex items-end justify-between mb-5 px-1">
              <div>
                <h3 className="font-serif text-2xl md:text-3xl font-semibold text-ghibli-canopy">
                  Your Study Garden
                </h3>
                <p className="font-sans text-sm text-ghibli-bark italic mt-1">
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
              <AddCourseCard onClick={() => openUploadModal(true)} />
            </div>

            {/* Footer */}
            <p className="text-center text-ghibli-bark text-xs font-sans italic mt-10 md:mt-16 mb-4 tracking-wide">
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
        startInCreateMode={uploadModalCreateMode}
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
