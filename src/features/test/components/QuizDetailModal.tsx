import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Play,
  RotateCcw,
  CheckCircle2,
  CalendarDays,
  Hash,
  Trophy,
} from "lucide-react";
import { getGardenStatus } from "@/lib/garden";
import type { CourseQuiz } from "@/features/test/types";

interface QuizDetailModalProps {
  quiz: CourseQuiz | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (quizId: string) => void;
  onResume?: (quizId: string, attemptId: string) => void;
}

export function QuizDetailModal({
  quiz,
  open,
  onOpenChange,
  onStart,
  onResume,
}: QuizDetailModalProps) {
  if (!quiz) return null;

  // Let's get all attempts (completed and in-progress) and sort them by started_at descending (newest on top)
  const allAttempts = (quiz.quiz_attempts ?? [])
    .filter((a) => a.status === "completed" || a.status === "in_progress")
    .sort(
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    );

  const completedAttempts = allAttempts.filter((a) => a.status === "completed");
  const inProgressAttempts = allAttempts.filter(
    (a) => a.status === "in_progress",
  );

  const hasHistory = allAttempts.length > 0;
  const hasCompleted = completedAttempts.length > 0;
  const bestAttempt = completedAttempts.reduce(
    (best, curr) =>
      curr.correct_count > (best?.correct_count ?? -1) ? curr : best,
    null as (typeof completedAttempts)[0] | null,
  );
  const bestScore =
    bestAttempt && quiz.total_questions > 0
      ? Math.round((bestAttempt.correct_count / quiz.total_questions) * 100)
      : null;

  const createdDate = new Date(quiz.created_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Header */}
        <DialogHeader className="pb-1">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ghibli-moss/12">
              <ClipboardList className="h-4 w-4 text-ghibli-jungle" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold leading-snug text-ghibli-canopy">
                {quiz.name}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-ghibli-bark">
                Generated quiz
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          <MetaChip
            icon={<Hash className="h-3 w-3" />}
            label={`${quiz.total_questions} questions`}
          />
          <MetaChip
            icon={<CalendarDays className="h-3 w-3" />}
            label={`Created ${createdDate}`}
          />
          {hasHistory && (
            <MetaChip
              icon={<CheckCircle2 className="h-3 w-3" />}
              label={`${allAttempts.length} ${allAttempts.length === 1 ? "attempt" : "attempts"}`}
            />
          )}
          {bestScore !== null && (
            <MetaChip
              icon={<Trophy className="h-3 w-3" />}
              label={`Best: ${bestScore}%`}
              highlighted
            />
          )}
        </div>

        {/* Session history */}
        {hasHistory && (
          <div className="mt-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ghibli-bark">
              Session History
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {allAttempts.map((attempt, i) => {
                const isCompleted = attempt.status === "completed";
                const score =
                  quiz.total_questions > 0
                    ? Math.round(
                        (attempt.correct_count / quiz.total_questions) * 100,
                      )
                    : 0;
                const status = getGardenStatus(score);
                const date = new Date(
                  attempt.completed_at ?? attempt.started_at,
                ).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div
                    key={attempt.id}
                    className="flex items-center gap-3 rounded-xl bg-ghibli-mist/50 border border-ghibli-moss/40 px-4 py-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ghibli-ivory to-ghibli-mist text-xs font-bold text-ghibli-canopy border border-ghibli-moss/45">
                      {allAttempts.length - i}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ghibli-bark">{date}</p>
                      {!isCompleted && (
                        <p className="text-xs font-medium text-ghibli-amber">
                          In Progress
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {isCompleted ? (
                        <>
                          <p className="text-sm font-bold text-ghibli-canopy">
                            {attempt.correct_count}/{quiz.total_questions}
                          </p>
                          <p className={`text-xs font-medium ${status.color}`}>
                            {score}% · {status.label}
                          </p>
                        </>
                      ) : (
                        onResume && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-ghibli-amber/10 text-ghibli-amber hover:bg-ghibli-amber/20 border-ghibli-amber/20"
                            onClick={() => {
                              onOpenChange(false);
                              onResume(quiz.id, attempt.id);
                            }}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Resume
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasHistory && (
          <div className="mt-2 rounded-xl border border-dashed border-ghibli-moss/50 py-8 text-center">
            <p className="text-sm text-ghibli-bark">No sessions yet.</p>
            <p className="mt-0.5 text-xs text-ghibli-bark">
              Take this quiz to start tracking your progress.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-2 flex justify-end gap-2 border-t border-ghibli-moss/30 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          <Button
            className="gap-2"
            onClick={() => {
              onOpenChange(false);
              onStart(quiz.id);
            }}
          >
            {hasHistory ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                Start Fresh Attempt
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Take Quiz
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetaChip({
  icon,
  label,
  highlighted = false,
}: {
  icon: React.ReactNode;
  label: string;
  highlighted?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        highlighted
          ? "bg-ghibli-moss/15 text-ghibli-canopy"
          : "bg-ghibli-mist text-ghibli-bark"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}
