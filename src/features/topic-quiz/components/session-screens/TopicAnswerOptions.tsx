import type { TopicQuizQuestion } from "../../services/topicQuizService";
import type { LocalFeedback } from "../../hooks/useTopicQuizSession";

const STONE_LETTERS = ["A", "B", "C", "D"];

function getOptionClasses({
  submitting,
  showFeedback,
  isCorrect,
  isWrong,
  isSelected,
}: {
  submitting: boolean;
  showFeedback: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  isSelected: boolean;
}): string {
  let classes =
    "relative w-full text-left rounded-parchment border-2 px-6 py-5 font-serif text-base font-semibold transition-all duration-300 flex items-center gap-4 parchment-solid text-ghibli-canopy";

  if (submitting && isSelected) {
    classes += " border-ghibli-jungle bg-ghibli-moss/15 cursor-wait";
  } else if (showFeedback) {
    if (isCorrect) {
      classes += " border-ghibli-moss bg-ghibli-moss/20 shadow-md cursor-default";
    } else if (isWrong) {
      classes += " border-ghibli-petal bg-ghibli-petal/20 text-ghibli-bark cursor-default";
    } else {
      classes += " border-ghibli-moss/40 text-ghibli-bark cursor-default";
    }
  } else if (isSelected) {
    classes += " border-ghibli-jungle bg-ghibli-moss/15 shadow-md cursor-wait";
  } else {
    classes += " border-ghibli-moss/50 hover:border-ghibli-jungle hover:shadow-lg cursor-pointer select-none";
  }

  return classes;
}

export function TopicAnswerOptions({
  question,
  selectedOption,
  feedback,
  submitting,
  onSelect,
}: {
  question: TopicQuizQuestion;
  selectedOption: number | null;
  feedback: LocalFeedback | null;
  submitting: boolean;
  onSelect: (optionIndex: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {question.options.map((option) => {
        const isSelected = selectedOption === option.index;
        const showFeedback = feedback !== null;
        const isCorrect = showFeedback && feedback.correct_option_index === option.index;
        const isWrong = showFeedback && isSelected && !feedback.is_correct;

        const optionClasses = getOptionClasses({
          submitting,
          showFeedback,
          isCorrect,
          isWrong,
          isSelected,
        });
        const letter = STONE_LETTERS[option.index] ?? String.fromCharCode(65 + option.index);

        return (
          <button
            key={option.index}
            className={optionClasses}
            onClick={() => onSelect(option.index)}
            disabled={showFeedback || submitting}
          >
            <span
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-sm ${
                isCorrect
                  ? "bg-gradient-to-br from-ghibli-jungle to-ghibli-canopy text-primary-foreground shadow-sm"
                  : isWrong
                  ? "bg-ghibli-petal/45 text-ghibli-bark"
                  : "bg-gradient-to-br from-ghibli-ivory to-ghibli-mist text-ghibli-canopy border border-ghibli-moss/45"
              }`}
            >
              {letter}
            </span>
            <span className="flex-1">{option.text}</span>
            {isCorrect && (
              <img
                src="/leaf-sprout.png"
                alt="Correct!"
                className="w-8 h-8 object-contain animate-scale-in"
              />
            )}
            {isWrong && (
              <img
                src="/water-drop.png"
                alt="Incorrect"
                className="w-7 h-7 object-contain animate-drop"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
