import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CourseQuiz } from "@/features/test/types";
import { QuizCard } from "./QuizCard";

export function QuizzesList({
  quizzes,
  loading,
  onQuizClick,
}: {
  quizzes: CourseQuiz[];
  loading: boolean;
  onQuizClick: (quiz: CourseQuiz) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-ghibli-jungle" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-ghibli-canopy">Quizzes</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 md:py-12">
          <p className="text-sm text-ghibli-bark animate-pulse">
            Reading the garden path…
          </p>
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="rounded-2xl border-t-2 border-ghibli-moss/15">
          <CardContent className="py-6 md:py-12 text-center">
            <img
              src="/plant-stage-1.webp"
              alt=""
              className="w-16 h-16 object-contain mx-auto mb-3"
              style={{ mixBlendMode: "darken" }}
            />
            <p className="text-sm text-ghibli-bark">
              No quizzes yet. Generate your first one above!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} onClick={() => onQuizClick(quiz)} />
          ))}
        </div>
      )}
    </div>
  );
}
