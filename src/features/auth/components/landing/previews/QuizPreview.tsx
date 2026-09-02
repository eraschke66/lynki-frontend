import { CheckCircle2 } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PreviewBadge } from "../shared/PreviewBadge";

export function QuizPreview() {
  return (
    <ParchmentCard className="p-6 md:p-7" hover={false}>
      <div className="flex items-center justify-between mb-4">
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest font-semibold">
          Topic Quiz · Cellular Respiration
        </span>
        <PreviewBadge />
      </div>
      <p className="font-sans text-[11px] text-ghibli-bark italic mb-3">
        Example question. Yours come from your own course materials.
      </p>
      <div className="h-1.5 w-full rounded-full bg-ghibli-mist/80 overflow-hidden mb-5">
        <div className="h-full rounded-full bg-ghibli-moss" style={{ width: "50%" }} />
      </div>
      <h4 className="font-serif text-lg font-semibold text-ghibli-canopy leading-snug mb-4">
        In which stage of cellular respiration is the majority of ATP produced?
      </h4>
      <div className="space-y-2.5">
        {[
          { letter: "A", text: "Glycolysis", state: "idle" as const },
          { letter: "B", text: "Citric acid cycle", state: "idle" as const },
          { letter: "C", text: "Oxidative phosphorylation", state: "correct" as const },
          { letter: "D", text: "Fermentation", state: "idle" as const },
        ].map((o) => {
          const isCorrect = o.state === "correct";
          return (
            <div
              key={o.letter}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border font-sans text-sm ${
                isCorrect
                  ? "bg-ghibli-moss/12 border-ghibli-moss/40 text-ghibli-canopy"
                  : "bg-white/55 border-ghibli-moss/15 text-ghibli-canopy"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 ${
                  isCorrect
                    ? "bg-ghibli-forest text-white"
                    : "bg-ghibli-mist text-ghibli-forest"
                }`}
              >
                {o.letter}
              </span>
              <span className="flex-1 leading-snug">{o.text}</span>
              {isCorrect && <CheckCircle2 className="w-4 h-4 text-ghibli-forest" />}
            </div>
          );
        })}
      </div>
    </ParchmentCard>
  );
}
