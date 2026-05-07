interface SkipStageLinkProps {
  onSkip: () => void;
  label?: string;
}

/**
 * Subtle skip affordance — bottom-right, ~12px, gray, no underline until hover.
 * Used by every stage component except mastery_delta.
 */
export function SkipStageLink({ onSkip, label = "Skip stage" }: SkipStageLinkProps) {
  return (
    <div className="flex justify-end mt-6">
      <button
        type="button"
        onClick={onSkip}
        className="text-xs text-gray-400 hover:text-gray-600 hover:underline transition-colors"
      >
        {label}
      </button>
    </div>
  );
}
