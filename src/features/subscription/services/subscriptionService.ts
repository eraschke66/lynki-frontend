import { supabase } from "@/lib/supabase";

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/**
 * Which checkout function this build talks to.
 *
 * There is one Supabase project and stripe-checkout holds a LIVE Stripe key, so
 * until now a checkout opened from a preview deployment was a real live session
 * against a real card (cs_live_… showing "Total due today $9.99", seen on
 * 2026-09-29). Preview and local builds now go to stripe-checkout-test, which
 * refuses to run with anything but a Stripe test key.
 *
 * Production is decided by the deploy, not by a runtime check: VITE_DEPLOY_ENV
 * is baked in from VERCEL_ENV at build time, so a preview build cannot be
 * talked into using the live function.
 */
const CHECKOUT_FN =
  import.meta.env.VITE_DEPLOY_ENV === "production"
    ? "stripe-checkout"
    : "stripe-checkout-test";

/**
 * Creates a Stripe Checkout session for the chosen plan.
 * Passes `plan` in the POST body so the edge function picks the correct Price ID.
 *
 * Returns the Stripe-hosted checkout URL to redirect to.
 */
export async function createCheckoutSession(
  plan: "monthly" | "annual" = "annual",
): Promise<string> {
  const token = await getAccessToken();
  const { data, error } = await supabase.functions.invoke(CHECKOUT_FN, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: { plan },
  });
  if (error) throw new Error(error.message ?? "Failed to start checkout");
  return (data as { url: string }).url;
}

/**
 * Creates a Stripe Customer Portal session so the user can manage their
 * subscription (cancel, update payment method, etc.).
 *
 * Returns the Stripe-hosted portal URL to redirect to.
 */
export async function createPortalSession(): Promise<string> {
  const token = await getAccessToken();
  const { data, error } = await supabase.functions.invoke("stripe-portal", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) throw new Error(error.message ?? "Failed to open billing portal");
  return (data as { url: string }).url;
}
