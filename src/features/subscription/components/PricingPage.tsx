import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Sprout, BookOpenCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { Header } from "@/components/layout/Header";
import { VineDecoration } from "@/components/garden/VineDecoration";
import { useSubscription } from "../hooks/useSubscription";
import { createCheckoutSession } from "../services/subscriptionService";

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

export function PricingPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { isPremium, isLoading: subLoading } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!session?.access_token) {
      toast.error("Please log in to upgrade");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const url = await createCheckoutSession();
      // Hard redirect — Stripe Checkout is an external page
      window.location.href = url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <>
      <GhibliBackground />
      <Header />
      <VineDecoration />

      <div className="relative z-10 min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-3xl font-bold text-[#1B4332] mb-3">
              Grow further with Premium
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Unlock the full garden — visual mastery tracking and AI-guided study plans, built around your exam date.
            </p>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free tier */}
            <ParchmentCard className="p-7 flex flex-col">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Free
                </p>
                <p className="text-3xl font-bold text-foreground">
                  £0
                  <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>
                </p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
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

            {/* Premium tier */}
            <ParchmentCard
              className="p-7 flex flex-col relative overflow-hidden"
              style={{
                borderTop: "3px solid #40916C",
                background:
                  "linear-gradient(135deg, rgba(64,145,108,0.04) 0%, rgba(250,243,224,0) 60%)",
              }}
            >
              {/* "Most popular" badge */}
              <div
                className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: "rgba(64,145,108,0.12)", color: "#2D6A4F" }}
              >
                Recommended
              </div>

              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#40916C] mb-2">
                  Premium
                </p>
                <p className="text-3xl font-bold text-foreground">
                  £5
                  <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>
                </p>
              </div>

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
                    <span className={i === 0 ? "text-muted-foreground" : "text-foreground font-medium"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {isPremium ? (
                <Button
                  variant="outline"
                  disabled
                  className="w-full border-[rgba(64,145,108,0.3)] text-[#2D6A4F]"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Already Premium
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={loading || subLoading}
                  className="w-full shadow-[0_2px_12px_rgba(13,115,119,0.25)]"
                  style={{
                    background: loading
                      ? undefined
                      : "linear-gradient(135deg, #40916C 0%, #1B4332 100%)",
                    color: "white",
                  }}
                >
                  {loading ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Opening checkout…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                    </>
                  )}
                </Button>
              )}

              <p className="text-xs text-muted-foreground mt-3 text-center">
                Cancel anytime · Secured by Stripe
              </p>
            </ParchmentCard>
          </div>
        </div>
      </div>
    </>
  );
}
