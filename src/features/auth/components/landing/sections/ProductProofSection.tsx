import { ProofPanel } from "../shared/ProofPanel";
import { MaterialsPreview } from "../previews/MaterialsPreview";
import { QuizPreview } from "../previews/QuizPreview";
import { GardenPreview } from "../previews/GardenPreview";
import { StudyPlanPreview } from "../previews/StudyPlanPreview";

export function ProductProofSection() {
  return (
    <section className="relative z-10 py-16 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">
            See exactly what the product does.
          </h2>
          <p className="text-ghibli-bark font-serif text-base md:text-lg leading-relaxed">
            Four previews based on the real PassAI experience. Every feature shown here is already
            part of the product. Values below are example data, not a live account.
          </p>
        </div>

        <div className="space-y-10 md:space-y-16">
          <ProofPanel
            align="left"
            label="Materials"
            title="Upload your real study materials"
            text="PDFs, slides, readings and images become the source for your practice — no generic question banks."
            visual={<MaterialsPreview />}
          />
          <ProofPanel
            align="right"
            label="Quiz"
            title="Answer questions based on your course"
            text="Practice with questions generated from what you are actually expected to know."
            visual={<QuizPreview />}
          />
          <ProofPanel
            align="left"
            label="Knowledge Garden"
            title="See which topics need attention"
            text="Your Knowledge Garden shows the concepts that need water and the ones already growing."
            visual={<GardenPreview />}
          />
          <ProofPanel
            align="right"
            label="Study Plan"
            title="Study toward your exam goal"
            text="Set an exam date and target grade, then focus on the topics most likely to improve your readiness."
            visual={<StudyPlanPreview />}
          />
        </div>

        <p className="text-center mt-12 text-ghibli-canopy font-serif text-lg md:text-xl italic max-w-2xl mx-auto leading-relaxed">
          PassAI does not simply generate more questions. It helps you decide what to study next.
        </p>
      </div>
    </section>
  );
}
