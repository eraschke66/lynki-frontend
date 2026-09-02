import { GardenStatusChip } from "../shared/GardenStatusChip";
import { BigGardenPreview } from "../previews/BigGardenPreview";

export function KnowledgeGardenSection() {
  return (
    <section id="knowledge-garden" className="relative z-10 scroll-mt-24 py-16 md:py-24 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
        <div className="space-y-5">
          <span className="inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest px-3 py-1 rounded-full bg-ghibli-mist/60 border border-ghibli-moss/15">
            Knowledge Garden
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy leading-tight">
            See your knowledge grow.
          </h2>
          <p className="text-ghibli-bark font-serif text-base md:text-lg leading-relaxed">
            Every topic in your course becomes part of your Knowledge Garden. Concepts you
            understand begin to grow. Topics that need attention are marked clearly, so you can
            stop reviewing everything and focus on what matters most.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md pt-2">
            <GardenStatusChip dot="var(--color-marketing-status-water)" label="Needs Water" />
            <GardenStatusChip dot="var(--color-marketing-status-sprouting)" label="Sprouting" />
            <GardenStatusChip dot="var(--color-marketing-status-growing)" label="Growing" />
            <GardenStatusChip dot="var(--color-marketing-status-blooming)" label="Thriving" />
          </div>
        </div>
        <div>
          <BigGardenPreview />
        </div>
      </div>
    </section>
  );
}
