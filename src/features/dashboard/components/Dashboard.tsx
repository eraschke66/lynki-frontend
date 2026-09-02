import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useDashboard } from "../hooks/useDashboard";
import { UploadModal } from "./UploadModal";
import { EditCourseDialog } from "./EditCourseDialog";
import { DeleteCourseDialog } from "./DeleteCourseDialog";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { DashboardLoadingScreen } from "./dashboard/DashboardLoadingScreen";
import { DashboardErrorScreen } from "./dashboard/DashboardErrorScreen";
import { DashboardContent } from "./dashboard/DashboardContent";

export function Dashboard() {
  const navigate = useNavigate();
  const dashboard = useDashboard();

  if (!dashboard.user) {
    navigate("/login");
    return null;
  }

  if (dashboard.isLoading) return <DashboardLoadingScreen />;
  if (dashboard.error) return <DashboardErrorScreen onRetry={dashboard.retry} />;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <GhibliBackground />
      <Header />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-6 md:pt-8 pb-8 md:pb-16">
        <DashboardContent
          dashboardData={dashboard.dashboardData!}
          curriculum={dashboard.profileData?.curriculum ?? "percentage"}
          onNavigateToCourse={(courseId) => navigate(`/course/${courseId}`)}
          onStartStudying={() => {
            const nextItem = dashboard.dashboardData?.nextStudyItem;
            if (nextItem) navigate(`/course/${nextItem.courseId}`);
          }}
          onUpload={() => dashboard.openUploadModal()}
          onCreateCourse={() => dashboard.openUploadModal(true)}
          onEditCourse={dashboard.setEditingCourse}
          onDeleteCourse={dashboard.setDeletingCourse}
        />
      </div>

      <UploadModal
        open={dashboard.uploadModalOpen}
        onOpenChange={dashboard.setUploadModalOpen}
        userId={dashboard.user.id}
        onUploadComplete={dashboard.handleUploadComplete}
        startInCreateMode={dashboard.uploadModalCreateMode}
      />
      <EditCourseDialog
        open={!!dashboard.editingCourse}
        onOpenChange={(open) => !open && dashboard.setEditingCourse(null)}
        course={dashboard.editingCourse}
        curriculum={dashboard.profileData?.curriculum ?? "percentage"}
        onSave={dashboard.handleEditCourse}
      />
      <DeleteCourseDialog
        open={!!dashboard.deletingCourse}
        onOpenChange={(open) => !open && dashboard.setDeletingCourse(null)}
        course={dashboard.deletingCourse}
        onConfirm={dashboard.handleDeleteCourse}
      />
    </div>
  );
}
