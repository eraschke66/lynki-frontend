import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { supabase } from "@/lib/supabase";
import { subscriptionQueryKeys } from "@/lib/queryKeys";
import { posthog } from "@/lib/posthog";
import {
  hasFullAccess,
  isOnTrial,
  trialEndsAt,
  type AccessProfile,
} from "../access";

export type SubscriptionTier = "free" | "premium";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | null;
export type SubscriptionInterval = "monthly" | "annual" | null;

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  /** Billing cadence — null for legacy records and free users. */
  interval: SubscriptionInterval;
  currentPeriodEnd: Date | null;
  /** True when the user may use the paid features — paying OR on an unexpired trial. */
  isPremium: boolean;
  /** True only during the free trial (isPremium is also true then). */
  isOnTrial: boolean;
  /** When the free trial ends, or null if it cannot be determined. */
  trialEndsAt: Date | null;
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
      // `*` on purpose. The trial needs created_at, and it needs trial_ends_at
      // the moment that column is added — naming columns explicitly would make
      // this query fail with 42703 before the migration and silently miss the
      // column after it. One self-scoped row; the over-fetch is nothing.
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
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

  // Entitlement now lives in one place — features/subscription/access.ts — so
  // the paying check and the trial check can never drift apart. `isPremium`
  // keeps its name (it is what every gate already reads) but its meaning is now
  // "has full access", which includes an unexpired 7-day trial. That is what the
  // landing page has been promising all along.
  const profile = (data ?? null) as AccessProfile | null;
  const isPremium = hasFullAccess(profile);
  const onTrial = isOnTrial(profile);
  const trialEnds = trialEndsAt(profile);

  useEffect(() => {
    if (!queryLoading && data) {
      posthog.setPersonProperties({ subscription_tier: tier, subscription_status: status, subscription_interval: interval });
    }
  }, [queryLoading, data, tier, status, interval]);

  return {
    tier,
    status,
    interval,
    currentPeriodEnd,
    isPremium,
    isOnTrial: onTrial,
    trialEndsAt: trialEnds,
    isLoading,
  };
}
