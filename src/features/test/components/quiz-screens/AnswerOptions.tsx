import type { AnswerFeedback, TestQuestion } from "../../types";

const stoneLetters = ["A", "B", "C", "D"];

function getOptionClasses({
  showFeedback,
  isCorrect,
  isWrong,
  isSelected,
}: {
  showFeedback: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  isSelected: boolean;
}): string {
  let classes =
    "relative w-full text-left rounded-parchment border-2 px-6 py-5 font-serif text-base font-semibold transition-all duration-300 cursor-pointer select-none flex items-center gap-4 parchment-solid text-ghibli-canopy";

  if (showFeedback) {
    if (isCorrect) {
      classes += " border-ghibli-moss bg-ghibli-moss/20 shadow-md";
    } else if (isWrong) {
      classes += " border-ghibli-petal bg-ghibli-petal/20 text-ghibli-bark";
    } else {
      classes += " border-ghibli-moss/40 text-ghibli-bark";
    }
    if (!isCorrect && !isWrong) classes += " cursor-default";
  } else if (isSelected) {
    classes += " border-ghibli-jungle bg-ghibli-moss/15 shadow-md";
  } else {
    classes += " border-ghibli-moss/50 hover:border-ghibli-jungle hover:shadow-lg";
  }

  return classes;
}

export function AnswerOptions({
  question,
  selectedOption,
  feedback,
  onSelect,
}: {
  question: TestQuestion;
  selectedOption: number | null;
  feedback: AnswerFeedback | null;
  onSelect: (optionIndex: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {question.options.map((option) => {
        const isSelected = selectedOption === option.index;
        const showFeedback = feedback !== null;
        const isCorrect =
          showFeedback && feedback.correct_option_index === option.index;
        const isWrong = showFeedback && isSelected && !feedback.is_correct;

        const optionClasses = getOptionClasses({ showFeedback, isCorrect, isWrong, isSelected });
        const letter = stoneLetters[option.index] ?? String.fromCharCode(65 + option.index);

        return (
          <button
            key={option.id}
            className={optionClasses}
            onClick={() => onSelect(option.index)}
            disabled={showFeedback}
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
