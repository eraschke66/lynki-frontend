import { useNavigate, useParams } from "react-router-dom";
import { PremiumGate } from "@/features/subscription";
import { useTendingFlow } from "../hooks/useTendingFlow";
import { TendingSetupScreen } from "../components/tending-flow/TendingSetupScreen";
import { TendingStageSwitch } from "../components/tending-flow/TendingStageSwitch";
import { TopBar } from "../components/tending-flow/TopBar";
import { LeaveSessionDialog } from "../components/tending-flow/LeaveSessionDialog";

function TendingFlowInner() {
  const { courseId, topicId } = useParams<{ courseId: string; topicId: string }>();
  const navigate = useNavigate();
  const flow = useTendingFlow(courseId, topicId);

  if (!courseId || !topicId) {
    navigate("/home");
    return null;
  }

  if (!flow.isInitialized) {
    return (
      <TendingSetupScreen
        generateError={flow.generateError}
        onRetry={flow.retryGenerate}
        onExit={() => navigate(`/course/${courseId}/garden`)}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        topicTitle={flow.state.topicTitle}
        currentStage={flow.state.currentStage}
        stagesSkipped={flow.state.stagesSkipped}
        onExit={() => flow.setShowExitConfirm(true)}
      />

      <main className="flex-1 flex flex-col px-4 md:px-6 py-8 md:py-12">
        <TendingStageSwitch flow={flow} courseId={courseId} topicId={topicId} />
      </main>

      <LeaveSessionDialog
        open={flow.showExitConfirm}
        onOpenChange={flow.setShowExitConfirm}
        onConfirm={flow.handleConfirmLeave}
      />
    </div>
  );
}

export function TendingFlowPage() {
  return (
    <PremiumGate featureName="Tending Flow" featureDescription="Guided study sessions for one topic at a time.">
      <TendingFlowInner />
    </PremiumGate>
  );
}
