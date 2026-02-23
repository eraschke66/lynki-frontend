import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  CheckCircle,
  Circle,
  Loader2,
  AlertCircle,
  Play,
  Trophy,
  Target,
  ArrowLeft,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { fetchCourseProgress } from "../services/studyService";
import { StudySession } from "./StudySession";
import type { ConceptProgress, TopicProgress } from "../types";

const studyQueryKeys = {
  courseProgress: (courseId: string, userId: string) =>
    ["bkt", "progress", courseId, userId] as const,
};

export function CourseStudyPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Which topic is being studied (null = overview)
  const [studyingTopicId, setStudyingTopicId] = useState<string | null>(null);

  const {
    data: progress,
    isLoading,
    error,
  } = useQuery({
    queryKey: studyQueryKeys.courseProgress(courseId ?? "", user?.id ?? ""),
    queryFn: () => fetchCourseProgress(courseId!, user!.id),
    enabled: !!courseId && !!user,
  });

  const handleStartStudying = () => {
    if (!progress) return;
    // Auto-select the best topic: lowest-progress in-progress topic, or first not-started
    const inProgress = progress.topics.filter(
      (t) => t.status === "in_progress",
    );
    if (inProgress.length > 0) {
      const weakest = inProgress.sort(
        (a, b) => a.overall_progress - b.overall_progress,
      )[0];
      setStudyingTopicId(weakest.topic_id);
      return;
    }
    const notStarted = progress.topics.filter(
      (t) => t.status === "not_started",
    );
    if (notStarted.length > 0) {
      setStudyingTopicId(notStarted[0].topic_id);
      return;
    }
    // All mastered — pick first topic for review
    if (progress.topics.length > 0) {
      setStudyingTopicId(progress.topics[0].topic_id);
    }
  };

  const handleStudyTopic = (topicId: string) => {
    setStudyingTopicId(topicId);
  };

  const handleSessionComplete = () => {
    setStudyingTopicId(null);
    queryClient.invalidateQueries({
      queryKey: studyQueryKeys.courseProgress(courseId!, user!.id),
    });
  };

  const handleExitSession = () => {
    setStudyingTopicId(null);
    queryClient.invalidateQueries({
      queryKey: studyQueryKeys.courseProgress(courseId!, user!.id),
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "mastered":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "in_progress":
        return <Target className="w-5 h-5 text-amber-500" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getMasteryPercent = (concept: ConceptProgress) =>
    Math.round(concept.p_mastery * 100);

  const getMasteryColor = (p: number) => {
    if (p >= 0.85) return "text-emerald-600 dark:text-emerald-400";
    if (p >= 0.5) return "text-amber-600 dark:text-amber-400";
    if (p > 0.2) return "text-blue-600 dark:text-blue-400";
    return "text-muted-foreground";
  };

  const getTopicCardStyle = (topic: TopicProgress) => {
    if (topic.status === "mastered") {
      return "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20";
    }
    if (topic.status === "in_progress") {
      return "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10";
    }
    return "border-border";
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  // Show study session if actively studying a topic
  if (studyingTopicId && courseId) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background p-6 md:p-12 pt-28">
          <div className="max-w-4xl mx-auto">
            <StudySession
              topicId={studyingTopicId}
              courseId={courseId}
              onComplete={handleSessionComplete}
              onExit={handleExitSession}
            />
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background p-6 md:p-12 pt-28">
          <div className="flex items-center justify-center min-h-100">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading progress...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !progress) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background p-6 md:p-12 pt-28">
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
                <p className="text-muted-foreground">
                  Failed to load course progress
                </p>
                <Button variant="outline" onClick={() => navigate("/home")}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const allMastered = progress.overall_progress === 100;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background p-6 md:p-12 pt-28">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Back button */}
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {/* Course header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{progress.course_title}</h1>
                <p className="text-muted-foreground">
                  {progress.total_concepts} concepts across{" "}
                  {progress.topics.length} topics
                </p>
              </div>

              {allMastered ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Trophy className="w-6 h-6" />
                  <span className="font-semibold">All Mastered!</span>
                </div>
              ) : (
                <Button onClick={handleStartStudying} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Continue Learning
                </Button>
              )}
            </div>

            {/* Overall progress card */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Mastery</span>
                    <span className="text-sm text-muted-foreground">
                      {progress.mastered_concepts}/{progress.total_concepts}{" "}
                      concepts mastered
                    </span>
                  </div>
                  <Progress value={progress.overall_progress} className="h-3" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BarChart3 className="w-3 h-3" />
                    <span>
                      Mastery threshold:{" "}
                      {Math.round(progress.mastery_threshold * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Topic cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Topics
            </h2>

            <div className="grid gap-4">
              {progress.topics.map((topic) => (
                <Card
                  key={topic.topic_id}
                  className={`transition-all hover:shadow-md ${getTopicCardStyle(topic)}`}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Topic header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(topic.status)}
                          <div>
                            <h3 className="font-semibold text-base">
                              {topic.topic_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {topic.mastered_concepts}/{topic.total_concepts}{" "}
                              concepts mastered
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={
                            topic.status === "mastered" ? "outline" : "default"
                          }
                          onClick={() => handleStudyTopic(topic.topic_id)}
                        >
                          {topic.status === "mastered" ? (
                            <>Review</>
                          ) : topic.status === "in_progress" ? (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Continue
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Topic progress bar */}
                      <Progress
                        value={topic.overall_progress}
                        className="h-2"
                      />

                      {/* Concept chips */}
                      <div className="flex flex-wrap gap-2">
                        {topic.concepts.map((concept) => (
                          <div
                            key={concept.concept_id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              concept.is_mastered
                                ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                                : concept.status === "in_progress"
                                  ? "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                                  : "bg-muted border-border text-muted-foreground"
                            }`}
                            title={`${concept.concept_name}: ${getMasteryPercent(concept)}% mastery (${concept.n_attempts} attempts)`}
                          >
                            <span className="max-w-30 truncate">
                              {concept.concept_name}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${getMasteryColor(concept.p_mastery)}`}
                            >
                              {getMasteryPercent(concept)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
