import { CheckCircle2, ChevronRight, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CourseQuiz } from "@/features/test/types";

export function QuizCard({
  quiz,
  onClick,
}: {
  quiz: CourseQuiz;
  onClick: () => void;
}) {
  const completedAttempts = (quiz.quiz_attempts ?? []).filter(
    (a) => a.status === "completed",
  );
  const hasCompleted = completedAttempts.length > 0;

  // Best score across all completed attempts
  const bestScore = hasCompleted
    ? Math.max(
        ...completedAttempts.map((a) =>
          quiz.total_questions > 0
            ? Math.round((a.correct_count / quiz.total_questions) * 100)
            : 0,
        ),
      )
    : null;

  const formattedDate = new Date(quiz.created_at).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    },
  );

  return (
    <Card
      className={`group rounded-xl overflow-hidden transition-all duration-200 hover:shadow-[0_4px_20px_hsl(var(--ghibli-canopy)/0.10)] hover:border-ghibli-moss/45 cursor-pointer border-l-[3px] ${
        hasCompleted ? "border-l-ghibli-moss/55" : "border-l-ghibli-moss/20"
      }`}
      onClick={onClick}
    >
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-4">
          {/* Status icon */}
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
              hasCompleted
                ? "bg-ghibli-moss/12 text-ghibli-jungle group-hover:bg-ghibli-moss/20"
                : "bg-ghibli-moss/8 text-ghibli-forest group-hover:bg-ghibli-moss/12"
            }`}
          >
            {hasCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{quiz.name}</p>
            <p className="text-xs text-ghibli-bark mt-0.5">
              {formattedDate} &middot; {quiz.total_questions} questions
              {hasCompleted && (
                <>
                  {" "}
                  &middot; {completedAttempts.length}{" "}
                  {completedAttempts.length === 1 ? "attempt" : "attempts"}
                </>
              )}
            </p>
          </div>

          {/* Best score + chevron */}
          <div className="flex items-center gap-2 shrink-0">
            {bestScore !== null && (
              <span className="text-sm font-bold text-ghibli-jungle">
                {bestScore}%
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-ghibli-forest transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ghibli-canopy" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
