import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { toast } from "sonner";
import { fetchDashboardData } from "../services/dashboardService";
import { updateCourse, deleteCourse } from "@/features/courses";
import { fetchProfile } from "@/features/settings";
import { courseQueryKeys, profileQueryKeys } from "@/lib/queryKeys";
import type { CourseSummary } from "../types";
import { supabase } from "@/lib/supabase";

const dashboardQueryKeys = {
  data: (userId: string) => ["dashboard", userId] as const,
};

/** Dashboard's queries, realtime subscription, and the course edit/delete/upload handlers. */
export function useDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadModalCreateMode, setUploadModalCreateMode] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseSummary | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<CourseSummary | null>(null);

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.data(user!.id) });
  };

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
    invalidateDashboard();
    queryClient.invalidateQueries({ queryKey: courseQueryKeys.curriculum(courseId) });
    queryClient.invalidateQueries({ queryKey: ["test"] });
    toast.success("Course updated");
  };

  const handleDeleteCourse = async (courseId: string) => {
    await deleteCourse(courseId);
    invalidateDashboard();
    toast.success("Course deleted");
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dashboard-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "documents", filter: `user_id=eq.${user.id}` }, () => {
        invalidateDashboard();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bkt_mastery", filter: `user_id=eq.${user.id}` }, () => {
        invalidateDashboard();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- invalidateDashboard closes over user/queryClient, both already tracked below.
  }, [user, queryClient]);

  return {
    user,
    dashboardData,
    isLoading,
    error,
    profileData,
    retry: invalidateDashboard,
    uploadModalOpen,
    setUploadModalOpen,
    uploadModalCreateMode,
    openUploadModal,
    handleUploadComplete: invalidateDashboard,
    editingCourse,
    setEditingCourse,
    deletingCourse,
    setDeletingCourse,
    handleEditCourse,
    handleDeleteCourse,
  };
}
