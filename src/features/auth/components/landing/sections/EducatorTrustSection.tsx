import { ParchmentCard } from "@/components/garden/ParchmentCard";

export function EducatorTrustSection() {
  return (
    <section className="relative z-10 pb-10 md:pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        <ParchmentCard
          className="px-7 py-7 md:px-10 md:py-8 grid md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-center"
          hover={false}
        >
          <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-2 md:w-44 shrink-0">
            <span className="inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest font-semibold px-3 py-1 rounded-full bg-ghibli-mist/60 border border-ghibli-moss/15">
              Built from the classroom
            </span>
            <img
              src="/leaf-sprout.png"
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="hidden md:block w-10 h-10 object-contain opacity-70"
              style={{ mixBlendMode: "darken" }}
            />
          </div>
          <div className="space-y-3">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-ghibli-canopy leading-tight">
              Designed by an educator, not just a technology company.
            </h2>
            <p className="font-serif text-base md:text-lg text-ghibli-bark leading-relaxed">
              PassAI was shaped by more than 30 years of teaching experience across American and
              European educational systems, including the International Baccalaureate. It is built
              around a problem students face every year: having piles of materials, an approaching
              exam, and no clear sense of what they actually know.
            </p>
            <p className="font-serif text-sm md:text-base text-ghibli-canopy italic leading-relaxed">
              PassAI helps students focus their effort where it can make the greatest difference.
            </p>
          </div>
        </ParchmentCard>
      </div>
    </section>
  );
}
