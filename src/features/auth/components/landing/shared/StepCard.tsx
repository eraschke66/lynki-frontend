import { ParchmentCard } from "@/components/garden/ParchmentCard";

export function StepCard({
  number,
  plant,
  title,
  text,
}: {
  number: string;
  plant: string;
  title: string;
  text: string;
}) {
  return (
    <ParchmentCard className="p-6 md:p-7 h-full flex flex-col" hover={false}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest font-semibold">
          Step {number}
        </span>
      </div>
      <div className="relative flex items-center justify-center mb-4 h-24 md:h-28">
        <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-ghibli-sunlight/15 blur-2xl" />
        <img
          src={plant}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="relative h-24 md:h-28 w-auto object-contain opacity-95 select-none"
        />
      </div>
      <h3 className="font-serif text-lg font-semibold text-ghibli-canopy mb-2 leading-snug">
        {title}
      </h3>
      <p className="font-sans text-sm text-ghibli-bark leading-relaxed">{text}</p>
    </ParchmentCard>
  );
}
