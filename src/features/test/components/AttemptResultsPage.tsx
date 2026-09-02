import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { getGardenStatus } from "@/lib/garden";
import { fetchAttemptResults } from "../services/quizAttemptService";
import { testQueryKeys } from "@/lib/queryKeys";
import type { AttemptQuestionResult } from "../types";

const stoneLetters = ["A", "B", "C", "D"];

export function AttemptResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: testQueryKeys.attemptResults(attemptId ?? ""),
    queryFn: () => fetchAttemptResults(attemptId!),
    enabled: !!attemptId,
  });

  if (isLoading) {
    return <GardenVideoLoader message="Gathering what grew..." />;
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <GhibliBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <ParchmentCard className="p-10 text-center flex flex-col items-center gap-4 max-w-sm">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-sm text-ghibli-bark">
              We couldn't load these results.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
              <Button size="sm" onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </div>
          </ParchmentCard>
        </div>
      </div>
    );
  }

  const scorePercent =
    data.total_questions > 0
      ? Math.round((data.correct_count / data.total_questions) * 100)
      : 0;
  const status = getGardenStatus(scorePercent);
  const completedDate = (data.completed_at ?? data.started_at)
    ? new Date(data.completed_at ?? data.started_at).toLocaleDateString(
        undefined,
        { month: "long", day: "numeric", year: "numeric" },
      )
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <GhibliBackground />
      <div className="relative z-10 min-h-screen flex flex-col py-10 pb-24">
        <div className="max-w-2xl w-full mx-auto px-6">
          {/* Back */}
          <button
            onClick={() => navigate(`/course/${data.course_id}`)}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ghibli-canopy hover:text-ghibli-canopy transition-colors"
            aria-label="Back to course"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to course
          </button>

          {/* Header / score */}
          <ParchmentCard className="p-8 mb-6 text-center flex flex-col items-center gap-2">
            <h1 className="font-serif text-2xl font-semibold text-ghibli-canopy leading-snug">
              {data.quiz_name}
            </h1>
            {completedDate && (
              <p className="text-xs text-ghibli-bark">{completedDate}</p>
            )}
            <p className="mt-2 font-serif text-3xl font-bold text-ghibli-canopy tabular-nums">
              {data.correct_count} / {data.total_questions}
              <span className="mx-2 text-ghibli-bark">·</span>
              {scorePercent}%
            </p>
            <p className={`text-sm font-semibold ${status.color}`}>
              {status.label}
            </p>
          </ParchmentCard>

          {/* Per-question breakdown */}
          <div className="flex flex-col gap-4">
            {data.questions.map((q, i) => (
              <QuestionResultCard key={q.question_id} question={q} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionResultCard({
  question,
  index,
}: {
  question: AttemptQuestionResult;
  index: number;
}) {
  const notAnswered = question.selected_option_index === null;
  const correctOption = question.options.find(
    (o) => o.index === question.correct_option_index,
  );

  return (
    <ParchmentCard className="p-6" hover={false}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <h2 className="font-serif text-base md:text-lg font-semibold text-ghibli-canopy leading-relaxed">
          <span className="text-ghibli-bark mr-2">{index + 1}.</span>
          {question.question_text}
        </h2>
        {notAnswered && (
          <span className="shrink-0 mt-1 inline-flex items-center rounded-full bg-ghibli-mist px-2.5 py-1 text-xs font-medium text-ghibli-bark">
            Not answered
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {question.options.map((option) => {
          const isCorrect = option.index === question.correct_option_index;
          const isSelected = option.index === question.selected_option_index;
          const isWrongPick = isSelected && !question.is_correct;

          let rowClasses =
            "relative w-full text-left rounded-parchment border-2 px-4 py-3 font-serif text-sm font-medium flex items-center gap-3 ";
          if (isCorrect) {
            rowClasses += "border-ghibli-moss bg-ghibli-moss/15 text-ghibli-canopy";
          } else if (isWrongPick) {
            rowClasses += "border-ghibli-petal bg-ghibli-petal/15 text-ghibli-bark";
          } else {
            rowClasses += "border-ghibli-moss/35 text-ghibli-bark";
          }

          const letter =
            stoneLetters[option.index] ??
            String.fromCharCode(65 + option.index);

          return (
            <div key={option.index} className={rowClasses}>
              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-xs bg-gradient-to-br from-ghibli-ivory to-ghibli-mist text-ghibli-canopy border border-ghibli-moss/45">
                {letter}
              </span>
              <span className="flex-1">{option.text}</span>
              {isSelected && (
                <span
                  className={`shrink-0 text-xs font-medium ${
                    isWrongPick ? "text-ghibli-coral-deep" : "text-ghibli-bark"
                  }`}
                >
                  Your answer
                </span>
              )}
              {isCorrect && (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-ghibli-jungle" />
              )}
              {isWrongPick && (
                /* coral-deep, not coral: the wrong-answer row is petal-tinted and
                   plain coral only reaches 3.4 there. Colour is a reinforcement
                   here, never the only signal — the row also carries the petal
                   border, the petal tint and the "Your answer" label. */
                <XCircle className="w-5 h-5 shrink-0 text-ghibli-coral-deep" />
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation for the correct answer */}
      {correctOption?.explanation && (
        <div className="mt-4 rounded-parchment bg-ghibli-mist/50 border border-ghibli-moss/30 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ghibli-bark mb-1">
            Why
          </p>
          <p className="font-serif text-sm text-ghibli-bark leading-relaxed">
            {correctOption.explanation}
          </p>
        </div>
      )}
    </ParchmentCard>
  );
}
