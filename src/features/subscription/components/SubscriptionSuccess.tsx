import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sprout } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import GhibliBackground from "@/components/garden/GhibliBackground";
import { VineDecoration } from "@/components/garden/VineDecoration";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import { subscriptionQueryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth";
import { useSubscription } from "../hooks/useSubscription";

const POLL_INTERVAL_MS = 2_000;
const MAX_WAIT_MS = 30_000;

/**
 * Landing page after a successful Stripe Checkout.
 *
 * The webhook may arrive slightly after the user is redirected here,
 * so we poll the subscription status until isPremium flips true (up to 30 s).
 * On success we show a toast and redirect to /home.
 * If the webhook takes longer, we show a reassurance message.
 */
export function SubscriptionSuccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [timedOut, setTimedOut] = useState(false);
  const startedAt = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPremium) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      toast.success("Welcome to Premium! Your garden is now unlocked.");
      navigate("/home", { replace: true });
      return;
    }

    // Poll by invalidating the subscription query every 2 s
    intervalRef.current = setInterval(() => {
      if (Date.now() - startedAt.current > MAX_WAIT_MS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimedOut(true);
        return;
      }
      if (user) {
        queryClient.invalidateQueries({
          queryKey: subscriptionQueryKeys.status(user.id),
        });
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPremium, navigate, queryClient, user]);

  return (
    <>
      <GhibliBackground />
      <Header />
      <VineDecoration />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full">
          <ParchmentCard className="p-10 text-center">
            {timedOut ? (
              <>
                <div className="flex justify-center mb-5">
                  <Sprout className="w-10 h-10 text-[#40916C]" />
                </div>
                <h2 className="font-serif text-xl font-bold text-[#1B4332] mb-3">
                  Almost there…
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Your payment was received — we're just finishing the activation.
                  This can take a minute. Try refreshing the page, or come back shortly.
                </p>
                <Button
                  onClick={() => {
                    if (user) {
                      queryClient.invalidateQueries({
                        queryKey: subscriptionQueryKeys.status(user.id),
                      });
                    }
                    navigate("/home");
                  }}
                  variant="outline"
                  className="border-[rgba(64,145,108,0.3)] hover:border-[#40916C] hover:text-[#1B4332]"
                >
                  Go to dashboard
                </Button>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-5">
                  <Loader2 className="w-10 h-10 text-[#40916C] animate-spin" />
                </div>
                <h2 className="font-serif text-xl font-bold text-[#1B4332] mb-3">
                  Activating your garden…
                </h2>
                <p className="text-sm text-muted-foreground">
                  Payment confirmed. Unlocking your premium features now.
                </p>
              </>
            )}
          </ParchmentCard>
        </div>
      </div>
    </>
  );
}
