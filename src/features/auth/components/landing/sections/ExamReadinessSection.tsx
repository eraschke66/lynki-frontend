export function ExamReadinessSection() {
  return (
    <section className="relative z-10 pt-14 md:pt-16 pb-2 px-6 bg-white/30 backdrop-blur-sm border-t border-ghibli-moss/10">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">
          Stop guessing whether you are ready.
        </h2>
        <p className="font-serif text-base md:text-lg text-ghibli-canopy leading-relaxed max-w-2xl mx-auto">
          Your exam is getting closer. Your materials are scattered across notes, slides and
          documents. You do not need to revise everything again —{" "}
          <span className="font-semibold text-ghibli-canopy">you need to know what to study next.</span>
        </p>
        <p className="text-ghibli-bark font-serif text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
          PassAI turns your existing materials into a focused path from uncertainty to exam readiness.
        </p>
      </div>
    </section>
  );
}
