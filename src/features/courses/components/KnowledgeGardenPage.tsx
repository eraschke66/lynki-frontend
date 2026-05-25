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
    <ParchmentCard className="p-5 md:p-6 mb-3 md:mb-4">
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
          <p className="text-xs text-ghibli-bark mt-1">
            Average mastery: {topic.overall_progress}% · {topic.mastered_concepts} of {topic.total_concepts} fully mastered
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5"
          onClick={() => onStudy(topic.topic_id)}
          disabled={topic.total_concepts === 0}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Study this topic
        </Button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-ghibli-mist overflow-hidden mb-4">
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
                className="flex items-center gap-2.5 py-1 px-2 rounded-lg hover:bg-ghibli-ivory/70 transition-colors"
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
                  <span className="text-xs text-ghibli-bark shrink-0">
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
              className="mt-2 text-xs text-ghibli-canopy/70 hover:text-ghibli-jungle transition-colors flex items-center gap-1"
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
              <p className="text-sm text-ghibli-bark">Could not load your garden</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
            </ParchmentCard>
          </div>
        ) : (
          <div className="relative z-10 max-w-5xl mx-auto px-6 pt-6 md:pt-8 pb-8 md:pb-16">
            {/* Back link */}
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="flex items-center gap-1.5 text-sm font-sans text-ghibli-canopy/70 hover:text-ghibli-forest transition-colors mb-4 md:mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Course
            </button>

            {/* Hero — oasis two-column */}
            <ParchmentCard glow className="p-5 md:p-12 mb-6 md:mb-10 overflow-hidden">
              <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
                <div className="text-center md:text-left order-2 md:order-1">
                  <span className="inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-moss mb-3 px-3 py-1 rounded-full bg-ghibli-mist/60">
                    Knowledge Garden
                  </span>
                  <h1 className="font-serif text-4xl md:text-5xl font-semibold text-ghibli-canopy leading-tight mb-4">
                    {gardenData?.course_title ?? "Your Course"}
                  </h1>
                  <p className={`font-sans text-base font-semibold mb-2 ${gardenStatus.color}`}>
                    {gardenStatus.label}
                  </p>
                  <p className="font-sans text-base text-ghibli-bark/80 leading-relaxed max-w-md mx-auto md:mx-0">
                    {gardenData?.mastered_concepts ?? 0} of {gardenData?.total_concepts ?? 0} concepts mastered.
                    {topics.length > 0 && (
                      <>
                        {" "}A grove of{" "}
                        <span className="font-semibold text-ghibli-forest">
                          {topics.length} {topics.length === 1 ? "topic" : "topics"}
                        </span>
                        {" "}is taking root.
                      </>
                    )}
                  </p>
                </div>
                <div className="order-1 md:order-2 flex justify-center">
                  <PlantIndicator probability={overallProgress} size="xl" glow showPercent />
                </div>
              </div>
            </ParchmentCard>

            {/* Topics */}
            {topics.length === 0 ? (
              <ParchmentCard className="p-6 md:p-10 text-center flex flex-col items-center gap-4">
                <img
                  src="/plant-stage-1.png"
                  alt=""
                  className="w-16 h-16 object-contain animate-pulse-soft"
                  style={{ mixBlendMode: "darken" }}
                />
                <div>
                  <h2 className="font-serif text-xl font-semibold text-ghibli-canopy mb-1">
                    Your garden is still taking shape
                  </h2>
                  <p className="font-sans text-sm text-ghibli-bark/80 max-w-xs mx-auto">
                    Your materials are being processed. Check back soon to see your topics bloom.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/course/${courseId}`)}
                  className="mt-2 rounded-full border-ghibli-moss/40 text-ghibli-canopy hover:border-ghibli-forest hover:bg-ghibli-ivory/60"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Course
                </Button>
              </ParchmentCard>
            ) : (
              <div>
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
        )}
      </PremiumGate>
    </>
  );
}
