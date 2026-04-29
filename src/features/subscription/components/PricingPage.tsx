import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Sprout, BookOpenCheck, Sparkles, Zap, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { Header } from "@/components/layout/Header";
import { VineDecoration } from "@/components/garden/VineDecoration";
import { useSubscription } from "../hooks/useSubscription";
import { createCheckoutSession } from "../services/subscriptionService";
import { posthog } from "@/lib/posthog";

const FREE_FEATURES = [
  "Unlimited courses",
  "Document upload & AI processing",
  "Adaptive quizzes (BKT engine)",
  "Mock exam sessions",
  "Pass probability tracking",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "Study Garden — visualise mastery as a living garden",
  "Smart Study Plan — AI-tailored growth guide",
  "More premium features coming soon",
];

function FeatureList() {
  return (
    <ul className="space-y-2.5 mb-8 flex-1">
      {PREMIUM_FEATURES.map((f, i) => (
        <li key={f} className="flex items-start gap-2 text-sm">
          {i === 0 ? (
            <Check className="w-4 h-4 text-[#40916C] mt-0.5 shrink-0" />
          ) : i === 1 ? (
            <Sprout className="w-4 h-4 text-[#40916C] mt-0.5 shrink-0" />
          ) : i === 2 ? (
            <BookOpenCheck className="w-4 h-4 text-[#40916C] mt-0.5 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-[#40916C] mt-0.5 shrink-0" />
          )}
          <span
            className={
              i === 0 ? "text-muted-foreground" : "text-foreground font-medium"
            }
          >
            {f}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PricingPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { isPremium, interval, isLoading: subLoading } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<"monthly" | "annual" | null>(null);

  const handleUpgrade = async (plan: "monthly" | "annual") => {
    if (!session?.access_token) {
      toast.error("Please log in to upgrade");
      navigate("/login");
      return;
    }

    setLoadingPlan(plan);
    posthog.capture("checkout_initiated", { plan });
    try {
      const url = await createCheckoutSession(plan);
      // Hard redirect — Stripe Checkout is an external page
      window.location.href = url;
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setLoadingPlan(null);
    }
  };

  const isCurrentPlan = (plan: "monthly" | "annual") =>
    isPremium && (interval === plan || (interval === null && plan === "annual"));

  return (
    <>
      <GhibliBackground />
      <Header />
      <VineDecoration />

      <div className="relative z-10 min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-3xl font-bold text-[#1B4332] mb-3">
              Grow further with Premium
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Unlock the full garden — visual mastery tracking and AI-guided
              study plans, built around your exam date.
            </p>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ── Free tier ── */}
            <ParchmentCard className="p-7 flex flex-col">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Free
                </p>
                <p className="text-3xl font-bold text-foreground">$0</p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <Check className="w-4 h-4 text-[#40916C] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant="outline"
                disabled
                className="w-full border-[rgba(64,145,108,0.3)]"
              >
                Current plan
              </Button>
            </ParchmentCard>

            {/* ── Monthly tier ── */}
            <ParchmentCard
              className="p-7 flex flex-col relative overflow-hidden"
              style={{
                borderTop: "3px solid #74B49B",
              }}
            >
              <div className="flex items-center gap-1.5 mb-5">
                <Clock className="w-3.5 h-3.5 text-[#40916C]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#40916C]">
                  Monthly
                </p>
              </div>

              <div className="mb-5">
                <p className="text-3xl font-bold text-foreground">
                  $9.99
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / month
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Billed monthly · cancel anytime
                </p>
              </div>

              <FeatureList />

              {isCurrentPlan("monthly") ? (
                <Button
                  variant="outline"
                  disabled
                  className="w-full border-[rgba(64,145,108,0.3)] text-[#2D6A4F]"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Your plan
                </Button>
              ) : (
                <Button
                  onClick={() => handleUpgrade("monthly")}
                  disabled={!!loadingPlan || subLoading || (isPremium && interval !== "monthly")}
                  variant="outline"
                  className="w-full border-[#40916C] text-[#2D6A4F] hover:bg-[rgba(64,145,108,0.06)]"
                >
                  {loadingPlan === "monthly" ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Opening checkout…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get Started
                    </>
                  )}
                </Button>
              )}

              <p className="text-xs text-muted-foreground mt-3 text-center">
                Secured by Stripe
              </p>
            </ParchmentCard>

            {/* ── Annual tier ── */}
            <ParchmentCard
              className="p-7 flex flex-col relative overflow-hidden"
              style={{
                borderTop: "3px solid #40916C",
                background:
                  "linear-gradient(135deg, rgba(64,145,108,0.05) 0%, rgba(250,243,224,0) 60%)",
              }}
            >
              {/* Save badge */}
              <div
                className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(64,145,108,0.14)",
                  color: "#2D6A4F",
                }}
              >
                Save 34%
              </div>

              <div className="flex items-center gap-1.5 mb-5">
                <Calendar className="w-3.5 h-3.5 text-[#40916C]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#40916C]">
                  Annual · Best Value
                </p>
              </div>

              <div className="mb-5">
                <p className="text-3xl font-bold text-foreground">
                  $79
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / year
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ~$6.58/mo · billed once a year
                </p>
              </div>

              <FeatureList />

              {isCurrentPlan("annual") ? (
                <Button
                  variant="outline"
                  disabled
                  className="w-full border-[rgba(64,145,108,0.3)] text-[#2D6A4F]"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Your plan
                </Button>
              ) : (
                <Button
                  onClick={() => handleUpgrade("annual")}
                  disabled={!!loadingPlan || subLoading || (isPremium && interval !== "annual")}
                  className="w-full shadow-[0_2px_12px_rgba(13,115,119,0.25)]"
                  style={{
                    background:
                      loadingPlan === "annual"
                        ? undefined
                        : "linear-gradient(135deg, #40916C 0%, #1B4332 100%)",
                    color: "white",
                  }}
                >
                  {loadingPlan === "annual" ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Opening checkout…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upgrade — Best Value
                    </>
                  )}
                </Button>
              )}

              <p className="text-xs text-muted-foreground mt-3 text-center">
                Cancel anytime · Secured by Stripe
              </p>
            </ParchmentCard>
          </div>

          {/* Bottom note */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            Both plans unlock all premium features. Upgrade or downgrade anytime
            via your account settings.
          </p>
        </div>
      </div>
    </>
  );
}
