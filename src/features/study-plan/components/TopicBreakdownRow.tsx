import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { getGardenStatus } from "@/lib/garden";
import { testQueryKeys } from "@/lib/queryKeys";
import { getWeakTopics } from "../services/studyPlanService";

export function TopicBreakdownRow({
  topic,
  courseId,
}: {
  topic: ReturnType<typeof getWeakTopics>[number];
  courseId: string;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const status = getGardenStatus(topic.overall_progress);
  const unmasteredConcepts = topic.concepts.filter((c) => !c.is_mastered);

  return (
    <div className="border border-[rgba(64,145,108,0.12)] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[rgba(64,145,108,0.03)] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{topic.topic_name}</p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${status.bgColor} ${status.color}`}
            >
              {status.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {topic.mastered_concepts} of {topic.total_concepts} concepts mastered
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-[rgba(64,145,108,0.3)] hover:border-[#40916C] hover:text-[#1B4332]"
            onClick={(e) => {
              e.stopPropagation();
              queryClient.removeQueries({
                queryKey: testQueryKeys.quiz(courseId, user?.id ?? ""),
              });
              navigate(`/test/${courseId}?topicId=${topic.topic_id}`);
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Study
          </Button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-1.5 border-t border-[rgba(64,145,108,0.08)] pt-3">
          {unmasteredConcepts.map((concept) => {
            const m = Math.round(concept.p_mastery * 100);
            const s = getGardenStatus(m);
            return (
              <div key={concept.concept_id} className="flex items-center gap-2.5 py-1">
                <span className="text-base shrink-0">
                  {concept.status === "in_progress" ? "🌿" : "🌱"}
                </span>
                <span className="text-sm flex-1 min-w-0 truncate">
                  {concept.concept_name}
                </span>
                {concept.n_attempts > 0 ? (
                  <span className={`text-xs font-medium shrink-0 ${s.color}`}>
                    {m}%
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">
                    Not yet explored
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
