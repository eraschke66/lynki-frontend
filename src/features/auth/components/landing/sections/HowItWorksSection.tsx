import { StepCard } from "../shared/StepCard";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative z-10 scroll-mt-24 py-16 md:py-20 px-6 bg-white/30 backdrop-blur-sm border-y border-ghibli-moss/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">
            From your materials to exam readiness
          </h2>
          <p className="text-ghibli-bark font-serif text-base md:text-lg leading-relaxed">
            PassAI turns what you are already studying into a focused plan for what to study next.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StepCard
            number="01"
            plant="/plant-stage-1.webp"
            title="Upload what you are studying"
            text="Add your class notes, teacher's slides, readings or revision documents."
          />
          <StepCard
            number="02"
            plant="/plant-stage-2.webp"
            title="Take quizzes from your course"
            text="PassAI generates targeted questions from the materials your exam is based on."
          />
          <StepCard
            number="03"
            plant="/plant-stage-3.webp"
            title="Find what needs water"
            text="See which concepts are weak, which are growing and where to focus next."
          />
          <StepCard
            number="04"
            plant="/plant-stage-4.webp"
            title="Grow toward your target grade"
            text="Set your exam date and target grade, then follow a study plan shaped by your progress."
          />
        </div>
      </div>
    </section>
  );
}
