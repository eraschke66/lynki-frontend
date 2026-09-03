import { Loader2, RotateCcw, X } from "lucide-react";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";
import { Button } from "@/components/ui/button";
import { getGardenStatus } from "@/lib/garden";
import { getGradeLabel } from "@/lib/curricula";

function PassProbabilityDelta({
  beforePct,
  passPercent,
}: {
  beforePct: number;
  passPercent: number;
}) {
  const diff = passPercent - beforePct;
  const verdictColor =
    diff > 0
      ? "text-ghibli-canopy"
      : diff < 0
        ? "text-amber-700"
        : "text-ghibli-bark";
  const deltaLabel =
    diff > 0 ? `+${diff} points` : diff < 0 ? `${diff} points` : "0 points";
  return (
    <div
      className={`mt-2 w-full max-w-md flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm font-sans ${verdictColor}`}
    >
      <span>
        Your pass probability moved from{" "}
        <span className="tabular-nums font-semibold">{beforePct}%</span> to{" "}
        <span className="tabular-nums font-semibold">{passPercent}%</span>.
      </span>
      <span className="tabular-nums font-semibold">{deltaLabel}</span>
    </div>
  );
}

function PassProbabilityCard({
  loadingPassChance,
  passPercent,
  passChanceBefore,
  curriculum,
  targetGrade,
}: {
  loadingPassChance: boolean;
  passPercent: number | null;
  passChanceBefore: number | null;
  curriculum: string;
  targetGrade: number;
}) {
  if (loadingPassChance) {
    return (
      <div className="space-y-3">
        <PlantIndicator probability={40} size="lg" />
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-sm font-sans text-ghibli-bark">Reading the garden...</p>
      </div>
    );
  }

  if (passPercent === null) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-ghibli-bark">Could not calculate passing chance</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 flex flex-col items-center">
      <PlantIndicator probability={passPercent} size="xl" />
      <p className={`text-sm font-semibold ${getGardenStatus(passPercent).color}`}>
        {getGardenStatus(passPercent).label}
      </p>
      <p className="text-sm font-sans text-ghibli-bark">
        {getGardenStatus(passPercent).description}
      </p>
      <p className="text-xs font-sans text-ghibli-bark">
        Growing toward {getGradeLabel(curriculum, targetGrade)}
      </p>
      {passChanceBefore !== null ? (
        <PassProbabilityDelta
          beforePct={Math.round(passChanceBefore * 100)}
          passPercent={passPercent}
        />
      ) : (
        <p className="text-sm font-sans text-ghibli-canopy mt-2">
          Pass probability: <span className="tabular-nums">{passPercent}%</span>
        </p>
      )}
    </div>
  );
}

function ScoreSummary({
  correctCount,
  totalQuestions,
  passPercent,
}: {
  correctCount: number;
  totalQuestions: number;
  passPercent: number | null;
}) {
  const scorePercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-1">
      <p className="font-serif text-lg font-semibold">
        {correctCount} of {totalQuestions} seeds took root
      </p>
      <p className="text-sm font-sans text-ghibli-bark">
        {scorePercent >= 80
          ? "Every seed you planted took root."
          : scorePercent >= 60
            ? "Your garden is growing well."
            : scorePercent >= 40
              ? "The soil is getting richer."
              : "Every garden has days like this."}
      </p>
      {/* The praise above reads the quiz score; the number above THAT
          reads pass probability, and they are different measurements.
          Rendered adjacent with nothing reconciling them, a perfect
          score sat under "A perfect bloom!" and over 56% — which reads
          as the product contradicting itself at the exact moment the
          student is deciding whether to believe the number at all.
          Pass probability is an estimate over every concept in the
          course, most of which this quiz never touched; say so. */}
      {passPercent !== null && scorePercent - passPercent >= 20 && (
        <p className="text-sm font-sans text-ghibli-bark italic pt-1">
          Your pass estimate is still early — it covers every concept in
          the course, and this quiz asked about {totalQuestions}. It will
          sharpen as you tend more of the garden.
        </p>
      )}
    </div>
  );
}

export function QuizResultsScreen({
  totalQuestions,
  correctCount,
  passChance,
  loadingPassChance,
  passChanceBefore,
  targetGrade,
  curriculum,
  topicId,
  onRetake,
  onExit,
  onReturnToGarden,
}: {
  totalQuestions: number;
  correctCount: number;
  passChance: number | null;
  loadingPassChance: boolean;
  passChanceBefore: number | null;
  targetGrade: number;
  curriculum: string;
  topicId: string | null;
  onRetake: () => void;
  onExit: () => void;
  onReturnToGarden: () => void;
}) {
  const passPercent = passChance !== null ? Math.round(passChance * 100) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <GhibliBackground />
      <button
        onClick={onExit}
        className="absolute top-5 right-5 p-2 rounded-full text-ghibli-forest hover:text-ghibli-canopy hover:bg-ghibli-mist/70 transition-colors z-30"
        aria-label="Exit quiz"
      >
        <X className="w-6 h-6" />
      </button>
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <ParchmentCard className="p-6 md:p-10 text-center flex flex-col items-center gap-6 w-full max-w-lg">
          <p className="text-xs font-semibold text-ghibli-forest uppercase tracking-wider">
            Garden Walk Complete
          </p>

          {/* Leads with this quiz's own result — the encouraging, immediate
              feedback — before the course-wide pass-probability card below,
              which can look discouraging in isolation right after a strong
              quiz (that card's own divergence note explains why). */}
          <ScoreSummary
            correctCount={correctCount}
            totalQuestions={totalQuestions}
            passPercent={passPercent}
          />

          <PassProbabilityCard
            loadingPassChance={loadingPassChance}
            passPercent={passPercent}
            passChanceBefore={passChanceBefore}
            curriculum={curriculum}
            targetGrade={targetGrade}
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
            <Button
              size="lg"
              className="flex-1 gap-2 rounded-parchment"
              onClick={onRetake}
            >
              <RotateCcw className="w-4 h-4" />
              {topicId ? "Study Again" : "Retake Quiz"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 gap-2 rounded-parchment border-ghibli-moss/30 hover:border-ghibli-forest hover:text-ghibli-forest"
              onClick={topicId ? onReturnToGarden : onExit}
            >
              <X className="w-4 h-4" />
              {topicId ? "Return to Knowledge Garden" : "Return to Garden"}
            </Button>
          </div>
        </ParchmentCard>
      </div>
    </div>
  );
}
