import { supabase } from "@/lib/supabase";

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/**
 * Creates a Stripe Checkout session for the Premium subscription.
 * Explicitly fetches the session JWT and passes it as the Authorization header.
 *
 * Returns the Stripe-hosted checkout URL to redirect to.
 */
export async function createCheckoutSession(): Promise<string> {
  const token = await getAccessToken();
  const { data, error } = await supabase.functions.invoke("stripe-checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
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
