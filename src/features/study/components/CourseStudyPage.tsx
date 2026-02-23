import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Play,
  Trophy,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  Lock,
  RotateCcw,
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

  const [studyingTopicId, setStudyingTopicId] = useState<string | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const {
    data: progress,
    isLoading,
    error,
  } = useQuery({
    queryKey: studyQueryKeys.courseProgress(courseId ?? "", user?.id ?? ""),
    queryFn: () => fetchCourseProgress(courseId!, user!.id),
    enabled: !!courseId && !!user,
  });

  /* ── Handlers ─────────────────────────────────────── */

  const handleStartStudying = () => {
    if (!progress) return;
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
    if (progress.topics.length > 0) {
      setStudyingTopicId(progress.topics[0].topic_id);
    }
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

  /* ── Guard states ─────────────────────────────────── */

  if (!user) {
    navigate("/login");
    return null;
  }

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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading progress...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !progress) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load course progress
            </p>
            <Button variant="outline" onClick={() => navigate("/home")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </>
    );
  }

  const allMastered = progress.overall_progress === 100;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          {/* Back */}
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>

          {/* ── Hero: ring + course info + CTA ── */}
          <div className="flex flex-col items-center text-center mb-12">
            <CircularProgress
              value={progress.overall_progress}
              size={160}
              strokeWidth={12}
              labelClassName="text-3xl"
              className="mb-5"
            />

            <h1 className="text-2xl font-bold mb-1">
              {progress.course_title}
            </h1>
            <p className="text-sm text-muted-foreground mb-5">
              {progress.mastered_concepts} of {progress.total_concepts} concepts
              mastered
            </p>

            {allMastered ? (
              <div className="flex items-center gap-2 text-emerald-500 font-semibold">
                <Trophy className="w-5 h-5" />
                All Mastered!
              </div>
            ) : (
              <Button size="lg" className="gap-2" onClick={handleStartStudying}>
                <Sparkles className="w-4 h-4" />
                Continue Learning
              </Button>
            )}
          </div>

          {/* ── Learning Path ── */}
          <div className="relative">
            {progress.topics.map((topic, index) => {
              const isLast = index === progress.topics.length - 1;
              const isExpanded = expandedTopicId === topic.topic_id;

              return (
                <PathNode
                  key={topic.topic_id}
                  topic={topic}
                  index={index}
                  isLast={isLast}
                  isExpanded={isExpanded}
                  onToggleExpand={() =>
                    setExpandedTopicId(
                      isExpanded ? null : topic.topic_id,
                    )
                  }
                  onStudy={() => setStudyingTopicId(topic.topic_id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
 * PathNode — a single node in the vertical learning path
 * ═══════════════════════════════════════════════════════ */

function PathNode({
  topic,
  index,
  isLast,
  isExpanded,
  onToggleExpand,
  onStudy,
}: {
  topic: TopicProgress;
  index: number;
  isLast: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStudy: () => void;
}) {
  const isMastered = topic.status === "mastered";
  const isInProgress = topic.status === "in_progress";

  const nodeColor = isMastered
    ? "bg-emerald-500 text-white"
    : isInProgress
      ? "bg-primary text-primary-foreground"
      : "bg-muted text-muted-foreground";

  const lineColor = isMastered
    ? "bg-emerald-500"
    : "bg-border";

  return (
    <div className="relative flex gap-5">
      {/* ── Vertical connector line + circle ── */}
      <div className="flex flex-col items-center shrink-0 w-10">
        {/* Circle node */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 z-10 ${nodeColor}`}
        >
          {isMastered ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            index + 1
          )}
        </div>

        {/* Connector line to next node */}
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-6 ${lineColor}`} />
        )}
      </div>

      {/* ── Content card ── */}
      <div className={`flex-1 ${!isLast ? "pb-6" : "pb-0"}`}>
        <Card
          className={`transition-all duration-200 overflow-hidden ${
            isMastered
              ? "border-emerald-200 dark:border-emerald-800/50"
              : isInProgress
                ? "border-primary/30 shadow-sm"
                : "border-border"
          }`}
        >
          <CardContent className="pt-5 pb-4 px-5">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">
                  {topic.topic_name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {topic.mastered_concepts}/{topic.total_concepts} mastered
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Mini ring */}
                <CircularProgress
                  value={topic.overall_progress}
                  size={40}
                  strokeWidth={4}
                  labelClassName="text-[10px]"
                />

                {/* Action button */}
                <Button
                  size="sm"
                  variant={isMastered ? "outline" : "default"}
                  className="gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStudy();
                  }}
                >
                  {isMastered ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Review
                    </>
                  ) : isInProgress ? (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Continue
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Start
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Expand toggle for concept detail */}
            {topic.concepts.length > 0 && (
              <button
                onClick={onToggleExpand}
                className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
                {isExpanded ? "Hide" : "Show"} {topic.concepts.length} concepts
              </button>
            )}

            {/* Concept detail panel (collapsible) */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                {topic.concepts.map((concept) => (
                  <ConceptRow key={concept.concept_id} concept={concept} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * ConceptRow — single concept inside the expand panel
 * ═══════════════════════════════════════════════════════ */

function ConceptRow({ concept }: { concept: ConceptProgress }) {
  const pct = Math.round(concept.p_mastery * 100);

  const barColor = concept.is_mastered
    ? "bg-emerald-500"
    : concept.status === "in_progress"
      ? "bg-amber-500"
      : "bg-muted-foreground/20";

  const textColor = concept.is_mastered
    ? "text-emerald-600 dark:text-emerald-400"
    : concept.status === "in_progress"
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 py-1.5">
      {/* Status indicator */}
      <div className="w-4 shrink-0 flex justify-center">
        {concept.is_mastered ? (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        ) : concept.status === "not_started" ? (
          <Lock className="w-3 h-3 text-muted-foreground/40" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-amber-500" />
        )}
      </div>

      {/* Name */}
      <span className="flex-1 text-sm truncate">{concept.concept_name}</span>

      {/* Mini bar */}
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Pct */}
      <span className={`text-xs font-medium tabular-nums w-8 text-right shrink-0 ${textColor}`}>
        {pct}%
      </span>
    </div>
  );
}
