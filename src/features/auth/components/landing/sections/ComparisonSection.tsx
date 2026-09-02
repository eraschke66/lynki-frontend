import { ComparisonCard } from "../shared/ComparisonCard";

export function ComparisonSection() {
  return (
    <section className="relative z-10 py-16 md:py-20 px-6 bg-white/30 backdrop-blur-sm border-y border-ghibli-moss/10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">
            Not another generic quiz generator.
          </h2>
          <p className="text-ghibli-bark font-serif text-base md:text-lg leading-relaxed">
            Most study tools give you flashcards or AI questions detached from your actual class.
            PassAI begins with your own course materials, then uses your quiz progress to show
            what you understand and what still needs work before the exam.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          <ComparisonCard
            tone="muted"
            heading="Ordinary study tools"
            items={[
              "Generic flashcards or prompts",
              "One-off quiz scores",
              "No clear exam path",
              "Students still guess what to revise",
            ]}
          />
          <ComparisonCard
            tone="primary"
            heading="PassAI"
            items={[
              "Questions from your own materials",
              "Concept-by-concept progress",
              "Weak topics clearly identified",
              "A study path toward your target grade",
            ]}
          />
        </div>
      </div>
    </section>
  );
}
