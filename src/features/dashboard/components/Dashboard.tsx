import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sparkles,
  Plus,
  FileText,
  Clock,
  Trophy,
  Loader2,
  ChevronRight,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { fetchDashboardData } from "../services/dashboardService";
import { UploadModal } from "./UploadModal";
import type { MaterialSummary } from "../types";
import { formatDistanceToNow } from "date-fns";

const dashboardQueryKeys = {
  data: (userId: string) => ["dashboard", userId] as const,
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: dashboardQueryKeys.data(user?.id ?? ""),
    queryFn: () => fetchDashboardData(user!.id),
    enabled: !!user,
  });

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.data(user!.id),
    });
  };

  const handleContinueStudying = () => {
    if (dashboardData?.nextStudyItem) {
      navigate(`/study/${dashboardData.nextStudyItem.documentId}`);
    }
  };

  const getStatusBadge = (material: MaterialSummary) => {
    switch (material.status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Queued
          </span>
        );
      case "processing":
        return (
          <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case "error":
        return (
          <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        );
      default:
        return null;
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background p-6 md:p-12 pt-28">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background p-6 md:p-12 pt-28">
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
                <p className="text-muted-foreground">
                  Failed to load dashboard
                </p>
                <Button
                  variant="outline"
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
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const hasNoMaterials = !dashboardData || dashboardData.materials.length === 0;
  const hasStudyableMaterials = dashboardData?.materials.some(
    (m) => m.status === "completed" && m.totalConcepts > 0
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background p-6 md:p-12 pt-28">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Welcome / Hero Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">
                {hasNoMaterials
                  ? "Welcome to PassAI"
                  : `Welcome back${user.email ? `, ${user.email.split("@")[0]}` : ""}!`}
              </h1>
              <p className="text-muted-foreground mt-1">
                {hasNoMaterials
                  ? "Upload your study materials to get started"
                  : dashboardData?.nextStudyItem
                    ? "Ready to continue your learning journey?"
                    : "All caught up! Upload more materials or review what you've learned."}
              </p>
            </div>

            {/* Primary Action Card */}
            {hasStudyableMaterials && dashboardData?.nextStudyItem ? (
              <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {dashboardData.nextStudyItem.reason === "continue" && (
                          <Target className="w-5 h-5 text-primary" />
                        )}
                        {dashboardData.nextStudyItem.reason === "new" && (
                          <BookOpen className="w-5 h-5 text-primary" />
                        )}
                        {dashboardData.nextStudyItem.reason === "review" && (
                          <Clock className="w-5 h-5 text-primary" />
                        )}
                        <span className="text-sm font-medium text-primary">
                          {dashboardData.nextStudyItem.reason === "continue"
                            ? "Continue where you left off"
                            : dashboardData.nextStudyItem.reason === "new"
                              ? "Start new material"
                              : "Time to review"}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold">
                        {dashboardData.nextStudyItem.documentTitle}
                      </h2>
                      {dashboardData.nextStudyItem.conceptName && (
                        <p className="text-sm text-muted-foreground">
                          {dashboardData.nextStudyItem.conceptName}
                        </p>
                      )}
                    </div>
                    <Button
                      size="lg"
                      className="gap-2 shrink-0"
                      onClick={handleContinueStudying}
                    >
                      <Sparkles className="w-5 h-5" />
                      Continue Studying
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-br from-muted/50 to-transparent border-dashed">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center gap-4 py-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Plus className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold">
                        {hasNoMaterials
                          ? "Upload your first material"
                          : "Add more materials"}
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Upload PDFs, documents, or images. We'll extract key
                        concepts and create personalized study sessions.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="gap-2"
                      onClick={() => setUploadModalOpen(true)}
                    >
                      <Plus className="w-5 h-5" />
                      Upload Material
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Stats Overview */}
          {!hasNoMaterials && dashboardData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {dashboardData.totalMaterials}
                      </p>
                      <p className="text-xs text-muted-foreground">Materials</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {dashboardData.totalConceptsMastered}
                      </p>
                      <p className="text-xs text-muted-foreground">Mastered</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {dashboardData.totalConcepts}
                      </p>
                      <p className="text-xs text-muted-foreground">Concepts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {dashboardData.reviewsDue.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Reviews Due</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Materials List */}
          {!hasNoMaterials && dashboardData && dashboardData.materials.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Materials</CardTitle>
                  <CardDescription>
                    Study materials and progress
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setUploadModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.materials.map((material) => (
                    <div
                      key={material.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        material.status === "completed"
                          ? "hover:bg-muted/50 cursor-pointer"
                          : "bg-muted/20"
                      }`}
                      onClick={() => {
                        if (material.status === "completed") {
                          navigate(`/study/${material.id}`);
                        }
                      }}
                    >
                      <div className="p-2 bg-muted rounded-lg shrink-0">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{material.title}</h3>
                          {getStatusBadge(material)}
                        </div>

                        {material.status === "completed" && material.totalConcepts > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {material.masteredConcepts}/{material.totalConcepts} concepts
                              </span>
                              <span className="font-medium">{material.progressPercent}%</span>
                            </div>
                            <Progress value={material.progressPercent} className="h-1.5" />
                          </div>
                        )}

                        {material.status === "completed" && material.totalConcepts === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            No concepts extracted yet
                          </p>
                        )}

                        {(material.status === "pending" || material.status === "processing") && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Analyzing content...
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {material.conceptsDueForReview > 0 && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            {material.conceptsDueForReview} due
                          </span>
                        )}

                        {material.progressPercent === 100 && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="w-4 h-4" />
                          </span>
                        )}

                        {material.status === "completed" && (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews Due */}
          {dashboardData && dashboardData.reviewsDue.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Reviews Due
                </CardTitle>
                <CardDescription>
                  Concepts ready for spaced repetition review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.reviewsDue.map((review) => (
                    <div
                      key={review.conceptId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/study/${review.documentId}`)}
                    >
                      <div>
                        <p className="font-medium">{review.conceptName}</p>
                        <p className="text-xs text-muted-foreground">
                          from {review.documentTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Due {formatDistanceToNow(new Date(review.dueAt), { addSuffix: true })}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        userId={user.id}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
}
