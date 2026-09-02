import { ParchmentCard } from "@/components/garden/ParchmentCard";

export function QuestionCard({ question }: { question: string }) {
  return (
    <ParchmentCard className="p-8 md:p-10 mb-6">
      <div className="flex justify-center mb-4">
        <svg width="80" height="12" viewBox="0 0 80 12" className="text-ghibli-bark-ghost">
          <path
            d="M0 6 Q10 0 20 6 Q30 12 40 6 Q50 0 60 6 Q70 12 80 6"
            stroke="currentColor"
            fill="none"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <h2 className="font-serif text-xl md:text-2xl font-semibold text-ghibli-canopy text-center leading-relaxed">
        {question}
      </h2>
      <div className="flex justify-center mt-4">
        <svg width="80" height="12" viewBox="0 0 80 12" className="text-ghibli-bark-ghost">
          <path
            d="M0 6 Q10 12 20 6 Q30 0 40 6 Q50 12 60 6 Q70 0 80 6"
            stroke="currentColor"
            fill="none"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </ParchmentCard>
  );
}
