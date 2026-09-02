import { useNavigate } from "react-router-dom";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  FilePlus,
  FileText,
  ClipboardCheck,
  Leaf,
  Loader2,
  Pencil,
  Sparkles,
} from "lucide-react";

interface CourseHeroProps {
  courseId: string;
  title: string;
  description: string | null;
  docCount: number;
  showProcessingHint: boolean;
  processingCount: number;
  completedCount: number;
  targetLabel: string;
  passPercent: number | null;
  quizzesCount: number;
  demoteHeroCtas: boolean;
  onEditClick: () => void;
  onGenerateQuiz: () => void;
}

export function CourseHero({
  courseId,
  title,
  description,
  docCount,
  showProcessingHint,
  processingCount,
  completedCount,
  targetLabel,
  passPercent,
  quizzesCount,
  demoteHeroCtas,
  onEditClick,
  onGenerateQuiz,
}: CourseHeroProps) {
  const navigate = useNavigate();
  const hasDocs = docCount > 0;

  return (
    <ParchmentCard className="p-5 md:p-12 mb-6 md:mb-10 overflow-hidden" glow>
      <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
        <div className="text-center md:text-left order-2 md:order-1">
          <span className="inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest mb-3 px-3 py-1 rounded-full bg-ghibli-mist/60">
            Your Garden
          </span>
          <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold text-ghibli-canopy leading-tight">
              {title}
            </h1>
            <button
              onClick={onEditClick}
              aria-label="Edit course settings"
              className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full text-ghibli-forest hover:text-ghibli-forest hover:bg-ghibli-ivory/60 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          {description && (
            <p className="font-sans text-base text-ghibli-bark leading-relaxed mb-4 max-w-md mx-auto md:mx-0">
              {description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm font-sans text-ghibli-bark mb-4 md:mb-6 justify-center md:justify-start">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              {docCount} {docCount === 1 ? "document" : "documents"}
              {showProcessingHint && (
                <span
                  className="inline-flex items-center gap-1 text-ghibli-forest"
                  title="New material is being read"
                >
                  <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                  {processingCount} processing
                </span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4" />
              {completedCount} {completedCount === 1 ? "quiz" : "quizzes"}{" "}
              completed
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Target: {targetLabel}
            </span>
          </div>
          {demoteHeroCtas ? (
            /* Activation moment — the card below carries the only button.
               These stay reachable, but as links, so nothing competes. */
            <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center md:justify-start font-sans text-sm">
              <button
                onClick={() => navigate(`/course/${courseId}/garden`)}
                disabled={!hasDocs}
                className="inline-flex items-center gap-1.5 py-1 text-ghibli-forest hover:text-ghibli-canopy hover:underline transition-colors disabled:opacity-40 disabled:hover:no-underline"
              >
                <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
                Knowledge Garden
              </button>
              <button
                onClick={() => navigate(`/course/${courseId}/study-plan`)}
                disabled={!hasDocs}
                className="inline-flex items-center gap-1.5 py-1 text-ghibli-forest hover:text-ghibli-canopy hover:underline transition-colors disabled:opacity-40 disabled:hover:no-underline"
              >
                <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                Study Plan
              </button>
              <button
                onClick={() => navigate(`/documents?courseId=${courseId}`)}
                className="inline-flex items-center gap-1.5 py-1 text-ghibli-forest hover:text-ghibli-canopy hover:underline transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5" aria-hidden="true" />
                Add materials
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Button
                size="lg"
                onClick={onGenerateQuiz}
                disabled={!hasDocs}
                className="gap-2 rounded-full px-8 py-6 text-base font-semibold bg-linear-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy shadow-lg hover:shadow-glow transition-all"
              >
                <Sparkles className="w-4 h-4" />
                {quizzesCount > 0 ? "Generate New Quiz" : "Begin Growing"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(`/course/${courseId}/garden`)}
                disabled={!hasDocs}
                className="gap-2 rounded-full px-6 py-6 border-ghibli-moss/40 text-ghibli-canopy hover:border-ghibli-forest hover:text-ghibli-forest hover:bg-ghibli-ivory/60"
              >
                <Leaf className="w-4 h-4" />
                Knowledge Garden
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(`/course/${courseId}/study-plan`)}
                disabled={!hasDocs}
                className="gap-2 rounded-full px-6 py-6 border-ghibli-moss/40 text-ghibli-canopy hover:border-ghibli-forest hover:text-ghibli-forest hover:bg-ghibli-ivory/60"
              >
                <CalendarDays className="w-4 h-4" />
                Study Plan
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(`/documents?courseId=${courseId}`)}
                className="gap-2 rounded-full px-6 py-6 border-ghibli-moss/40 text-ghibli-canopy hover:border-ghibli-forest hover:text-ghibli-forest hover:bg-ghibli-ivory/60"
              >
                <FilePlus className="w-4 h-4" />
                Add materials
              </Button>
            </div>
          )}
        </div>
        <div className="order-1 md:order-2 flex flex-col items-center gap-2">
          {passPercent !== null ? (
            <>
              <PlantIndicator
                probability={passPercent}
                size="xl"
                glow
                showPercent
              />
              <p className="font-sans text-xs text-ghibli-bark italic">
                growing toward {targetLabel}
              </p>
            </>
          ) : (
            <>
              <PlantIndicator
                probability={0}
                size="xl"
                showPercent={false}
              />
              <p className="font-sans text-xs text-ghibli-bark italic max-w-56 text-center leading-relaxed">
                Generate a quiz to see your garden
              </p>
            </>
          )}
        </div>
      </div>
    </ParchmentCard>
  );
}
