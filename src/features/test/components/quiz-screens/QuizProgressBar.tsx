export function QuizProgressBar({
  courseName,
  shownStep,
  totalQuestions,
  correctCount,
  progress,
  litDots,
}: {
  courseName: string;
  shownStep: number;
  totalQuestions: number;
  correctCount: number;
  progress: number;
  /** How many of the dot markers should render as "lit" (answered). */
  litDots: number;
}) {
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="font-serif text-sm font-semibold text-primary">
          {courseName}
        </span>
        <span className="font-sans text-xs text-ghibli-bark">
          Step {shownStep} of {totalQuestions} &middot; {correctCount} took root
        </span>
      </div>
      <div className="relative h-5 rounded-full bg-ghibli-mist/70 border border-ghibli-moss/40 overflow-hidden parchment-texture">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress * 100}%`,
            background:
              "linear-gradient(90deg, hsl(var(--ghibli-moss)), hsl(var(--ghibli-forest)))",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-2">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full border transition-colors duration-300 ${
                i < litDots
                  ? "bg-ghibli-sunlight border-ghibli-amber"
                  : "bg-ghibli-ivory border-ghibli-moss/45"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
