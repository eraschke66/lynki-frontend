import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, BookOpenCheck, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { GardenVideoLoader } from "@/components/garden/GardenVideoLoader";
import { useSubscription } from "../hooks/useSubscription";

interface PremiumGateProps {
  children: ReactNode;
  /** Shown in the upgrade wall heading, e.g. "Study Garden" */
  featureName: string;
  /** One-line description shown below the heading */
  featureDescription?: string;
}

const PREMIUM_FEATURES = [
  {
    icon: Sprout,
    title: "Study Garden",
    description: "Visualise your mastery as a living garden — watch your knowledge bloom.",
  },
  {
    icon: BookOpenCheck,
    title: "Smart Study Plan",
    description: "AI-generated growth guide tailored to your weakest areas and exam date.",
  },
  {
    icon: Sparkles,
    title: "More features coming",
    description: "Premium expands with the app — unlock everything, now and future.",
  },
];

function UpgradeWall({
  featureName,
  featureDescription,
}: {
  featureName: string;
  featureDescription?: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full">
        <ParchmentCard className="p-8 text-center">
          {/* Lock icon */}
          <div className="flex justify-center mb-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(64,145,108,0.1)" }}
            >
              <Lock className="w-6 h-6 text-[#40916C]" />
            </div>
          </div>

          <h2 className="font-serif text-xl font-bold text-[#1B4332] mb-2">
            {featureName} is a Premium feature
          </h2>

          {featureDescription && (
            <p className="text-sm text-muted-foreground mb-6">{featureDescription}</p>
          )}

          {/* Feature list */}
          <div className="space-y-3 mb-8 text-left">
            {PREMIUM_FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <div
                  className="mt-0.5 w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: "rgba(64,145,108,0.08)" }}
                >
                  <Icon className="w-4 h-4 text-[#40916C]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => navigate("/pricing")}
            className="w-full shadow-[0_2px_12px_rgba(13,115,119,0.25)]"
            style={{
              background: "linear-gradient(135deg, #40916C 0%, #1B4332 100%)",
              color: "white",
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Unlock Premium
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Cancel anytime. No hidden fees.
          </p>
        </ParchmentCard>
      </div>
    </div>
  );
}

/**
 * Wraps premium-only content.
 * - While loading: shows the standard garden loader
 * - If premium: renders children
 * - If free: renders the UpgradeWall CTA
 */
export function PremiumGate({ children, featureName, featureDescription }: PremiumGateProps) {
  const { isPremium, isLoading } = useSubscription();

  if (isLoading) {
    return <GardenVideoLoader />;
  }

  if (!isPremium) {
    return (
      <UpgradeWall featureName={featureName} featureDescription={featureDescription} />
    );
  }

  return <>{children}</>;
}
