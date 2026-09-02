import type { AnswerFeedback } from "../../types";

export function FeedbackBanner({ feedback }: { feedback: AnswerFeedback }) {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-parchment mb-4 ${
        feedback.is_correct
          ? "bg-ghibli-moss/15 border border-ghibli-moss/30"
          : "bg-ghibli-petal/15 border border-ghibli-petal/40"
      }`}
    >
      <img
        src={feedback.is_correct ? "/leaf-sprout.png" : "/water-drop.png"}
        alt=""
        className={`w-8 h-8 object-contain shrink-0 ${
          feedback.is_correct ? "animate-scale-in" : "animate-drop"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="font-serif font-semibold text-ghibli-canopy text-base">
          {feedback.is_correct
            ? "That one took root."
            : "That seed needs more light."}
        </p>
        {!feedback.is_correct && (
          <p className="font-serif font-medium text-ghibli-bark text-base mt-1">
            The correct answer is: {feedback.correct_option_text}
          </p>
        )}
        {feedback.explanation && (
          <p className="font-serif text-ghibli-bark text-base mt-1.5 leading-relaxed">
            {feedback.explanation}
          </p>
        )}
      </div>
    </div>
  );
}
