import { Loader2 } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { useElapsedTime } from "@/features/documents/hooks/useElapsedTime";
import { getProcessingProgressPercent, getProcessingStageMessage } from "@/lib/garden";
import type { CourseSummary } from "../../types";

export function ProcessingBanner({ processingCourses }: { processingCourses: CourseSummary[] }) {
  // The furthest-along course sets the headline — once anything reaches
  // "analyzing" that's the more informative thing to say.
  const leadCourse =
    processingCourses.find((c) => c.processingStage === "analyzing") ??
    processingCourses.find((c) => c.processingStage === "extracting") ??
    processingCourses[0];
  const elapsedMs = useElapsedTime(leadCourse?.processingStartedAt);
  const message = getProcessingStageMessage(leadCourse?.processingStage, elapsedMs);
  const progressPercent = getProcessingProgressPercent("processing", leadCourse?.processingStage);

  return (
    <ParchmentCard className="p-0 mb-10 overflow-hidden border-ghibli-moss/30 shadow-glow-soft animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="relative h-32 md:h-40 flex items-center justify-center">
        {/* Still frame, not the 4.3 MB video: this banner can sit on
            screen for minutes while materials process, and the motion
            was almost entirely hidden by the wash above it anyway. */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url(/garden-loader-poster.webp)" }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-ghibli-cream via-ghibli-cream/20 to-ghibli-cream" />
        <div className="relative z-10 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-ghibli-canopy" />
            <h3 className="font-serif text-xl font-bold text-ghibli-canopy">{message.title}</h3>
          </div>
          <p className="font-sans text-xs text-ghibli-bark max-w-xs mx-auto">
            We're extracting concepts from {processingCourses.length === 1 ? processingCourses[0].title : `${processingCourses.length} courses`}. {message.detail}
          </p>
        </div>
      </div>
      <div className="h-1.5 w-full bg-ghibli-moss/10 overflow-hidden">
        <div
          className="h-full bg-ghibli-moss transition-[width] duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </ParchmentCard>
  );
}
