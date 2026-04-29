import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { supabase } from "@/lib/supabase";
import { subscriptionQueryKeys } from "@/lib/queryKeys";
import { posthog } from "@/lib/posthog";

export type SubscriptionTier = "free" | "premium";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | null;
export type SubscriptionInterval = "monthly" | "annual" | null;

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  /** Billing cadence — null for legacy records and free users. */
  interval: SubscriptionInterval;
  currentPeriodEnd: Date | null;
  /** True when the user has an active premium subscription. */
  isPremium: boolean;
  isLoading: boolean;
}

/**
 * Reads the current user's subscription state from user_profiles.
 * The source of truth is written by the stripe-webhook edge function.
 *
 * isPremium is true when:
 *   - tier === "premium"
 *   - status is "active" or "trialing" (or "past_due" — Stripe retries)
 *   - currentPeriodEnd is in the future (belt-and-suspenders check)
 */
export function useSubscription(): SubscriptionInfo {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: subscriptionQueryKeys.status(user?.id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select(
          "subscription_tier, subscription_status, subscription_interval, current_period_end"
        )
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    // Refresh every 30 s in the background — keeps subscription state
    // reasonably fresh without hammering the DB
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Include auth loading so consumers never flash "free" while the session is resolving
  const isLoading = authLoading || queryLoading;

  const tier: SubscriptionTier = (data?.subscription_tier as SubscriptionTier) ?? "free";
  const status: SubscriptionStatus = (data?.subscription_status as SubscriptionStatus) ?? null;
  const interval: SubscriptionInterval = (data?.subscription_interval as SubscriptionInterval) ?? null;
  const currentPeriodEnd = data?.current_period_end
    ? new Date(data.current_period_end)
    : null;

  // A user is premium if:
  // 1. Their tier is "premium"
  // 2. Their status is active / trialing (past_due kept during Stripe retry window)
  // 3. Their period hasn't expired yet (catches subscriptions Stripe marked deleted
  //    but our webhook hasn't fully processed yet)
  const premiumStatuses: SubscriptionStatus[] = ["active", "trialing", "past_due"];
  const periodValid =
    currentPeriodEnd === null || currentPeriodEnd > new Date();

  const isPremium =
    tier === "premium" &&
    status !== null &&
    premiumStatuses.includes(status) &&
    periodValid;

  useEffect(() => {
    if (!queryLoading && data) {
      posthog.setPersonProperties({ subscription_tier: tier, subscription_status: status, subscription_interval: interval });
    }
  }, [queryLoading, data, tier, status, interval]);

  return { tier, status, interval, currentPeriodEnd, isPremium, isLoading };
}
