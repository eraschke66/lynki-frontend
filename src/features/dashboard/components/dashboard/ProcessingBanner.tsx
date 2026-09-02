import { Loader2 } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import type { CourseSummary } from "../../types";

export function ProcessingBanner({ processingCourses }: { processingCourses: CourseSummary[] }) {
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
            <h3 className="font-serif text-xl font-bold text-ghibli-canopy">Reading your materials...</h3>
          </div>
          <p className="font-sans text-xs text-ghibli-bark max-w-xs mx-auto">
            We're extracting concepts from {processingCourses.length === 1 ? processingCourses[0].title : `${processingCourses.length} courses`}. This usually takes 1-2 minutes.
          </p>
        </div>
      </div>
      <div className="h-1.5 w-full bg-ghibli-moss/10 overflow-hidden">
        <div className="h-full bg-ghibli-moss animate-pulse" style={{ width: '60%' }} />
      </div>
    </ParchmentCard>
  );
}
