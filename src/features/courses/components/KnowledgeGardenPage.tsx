import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, RefreshCw, BookOpen } from "lucide-react";
import { gardenQueryKeys } from "@/lib/queryKeys";
import { getGardenStatus } from "@/lib/garden";
import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { Header } from "@/components/layout/Header";
import { VineDecoration } from "@/components/garden/VineDecoration";
import { fetchCourseGardenData } from "../services/courseService";
import type { TopicMastery, ConceptMastery } from "../types";
import { PremiumGate } from "@/features/subscription/components/PremiumGate";

function getConceptIcon(status: ConceptMastery["status"]): string {
  if (status === "mastered") return "🌸";
  if (status === "in_progress") return "🌿";
  return "🌱";
}

// ---------------------------------------------------------------------------
// TopicCard
// ---------------------------------------------------------------------------

function TopicCard({
  topic,
  courseId: _courseId,
  onStudy,
}: {
  topic: TopicMastery;
  courseId: string;
  onStudy: (topicId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const gardenStatus = getGardenStatus(topic.overall_progress);

  return (
    <ParchmentCard className="p-6 mb-4">
      {/* Topic header row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-base font-semibold text-foreground leading-snug">
              {topic.topic_name}
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${gardenStatus.bgColor} ${gardenStatus.color}`}>
              {gardenStatus.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {topic.mastered_concepts} of {topic.total_concepts} concepts mastered
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5 border-[rgba(64,145,108,0.3)] hover:border-[#40916C] hover:text-[#1B4332]"
          onClick={() => onStudy(topic.topic_id)}
          disabled={topic.total_concepts === 0}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Study this topic
        </Button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${topic.overall_progress}%`,
            background: "linear-gradient(90deg, hsl(var(--ghibli-moss)), hsl(var(--ghibli-forest)))",
          }}
        />
      </div>

      {/* Concept rows */}
      {topic.concepts.length > 0 && (
        <>
          <div className={`space-y-2 ${!expanded && topic.concepts.length > 4 ? "max-h-[140px] overflow-hidden relative" : ""}`}>
            {topic.concepts.map((concept) => (
              <div
                key={concept.concept_id}
                className="flex items-center gap-2.5 py-1 px-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <span className="text-base shrink-0" role="img" aria-label={concept.status}>
                  {getConceptIcon(concept.status)}
                </span>
                <span className="text-sm font-sans text-foreground flex-1 min-w-0 truncate">
                  {concept.concept_name}
                </span>
                {concept.n_attempts > 0 && (
                  <span className={`text-xs font-medium shrink-0 ${getGardenStatus(Math.round(concept.p_mastery * 100)).color}`}>
                    {Math.round(concept.p_mastery * 100)}%
                  </span>
                )}
                {concept.n_attempts === 0 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    Not yet explored
                  </span>
                )}
              </div>
            ))}
            {!expanded && topic.concepts.length > 4 && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/80 to-transparent" />
            )}
          </div>

          {topic.concepts.length > 4 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-xs text-muted-foreground hover:text-[#2D6A4F] transition-colors flex items-center gap-1"
            >
              {expanded
                ? "Show less"
                : `Show all ${topic.concepts.length} concepts`}
            </button>
          )}
        </>
      )}
    </ParchmentCard>
  );
}

// ---------------------------------------------------------------------------
// KnowledgeGardenPage
// ---------------------------------------------------------------------------

export function KnowledgeGardenPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data: gardenData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: gardenQueryKeys.progress(courseId ?? "", user?.id ?? ""),
    queryFn: () => fetchCourseGardenData(user!.id, courseId!),
    enabled: !!user && !!courseId,
    staleTime: 30_000,
  });

  const handleStudyTopic = useCallback(
    (topicId: string) => {
      navigate(`/course/${courseId}/topic-quiz/${topicId}`);
    },
    [courseId, navigate],
  );

  if (!user || !courseId) {
    navigate("/home");
    return null;
  }

  const topics = gardenData?.topics ?? [];
  const overallProgress = gardenData?.overall_progress ?? 0;
  const gardenStatus = getGardenStatus(overallProgress);

  return (
    <>
      <GhibliBackground />
      <Header />
      <VineDecoration />
      <PremiumGate
        featureName="Study Garden"
        featureDescription="Watch your knowledge bloom — a visual map of every topic and concept you've mastered."
      >
        {isLoading ? (
          <GardenVideoLoader message="Reading the garden..." />
        ) : error ? (
          <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
            <ParchmentCard className="p-10 text-center flex flex-col items-center gap-4 max-w-sm w-full">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load your garden</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
            </ParchmentCard>
          </div>
        ) : (
          <div className="relative z-10 pt-24 pb-16">
            <div className="max-w-3xl mx-auto px-6">
              {/* Back link */}
              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#2D6A4F] transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Course
              </button>

              {/* Garden header */}
              <div
                className="mb-8 p-6 rounded-2xl text-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(64,145,108,0.06) 0%, rgba(250,243,224,0) 70%)",
                  border: "1px solid rgba(64,145,108,0.12)",
                }}
              >
                <p className="text-xs font-semibold text-[#40916C] uppercase tracking-wider mb-2">
                  Knowledge Garden
                </p>
                <h1 className="text-2xl font-bold mb-4">
                  {gardenData?.course_title ?? "Your Course"}
                </h1>
                <PlantIndicator probability={overallProgress} size="xl" showPercent={true} />
                <p className={`text-sm font-semibold mt-3 ${gardenStatus.color}`}>
                  {gardenStatus.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {gardenData?.mastered_concepts ?? 0} of {gardenData?.total_concepts ?? 0} concepts mastered
                </p>
              </div>

              {/* Topics */}
              {topics.length === 0 ? (
                <ParchmentCard className="p-10 text-center flex flex-col items-center gap-4">
                  <img
                    src="/plant-stage-1.png"
                    alt=""
                    className="w-16 h-16 object-contain"
                    style={{ mixBlendMode: "darken" }}
                  />
                  <div>
                    <h2 className="font-serif text-base font-semibold mb-1">
                      Your garden is still taking shape
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Your materials are being processed. Check back soon to see your topics bloom.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate(`/course/${courseId}`)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Course
                  </Button>
                </ParchmentCard>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-sm font-semibold text-foreground">
                      {topics.length} {topics.length === 1 ? "topic" : "topics"} in your garden
                    </p>
                  </div>
                  {topics.map((topic) => (
                    <TopicCard
                      key={topic.topic_id}
                      topic={topic}
                      courseId={courseId}
                      onStudy={handleStudyTopic}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </PremiumGate>
    </>
  );
}
