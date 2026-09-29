// stripe-checkout-test — Stripe TEST MODE checkout, for preview deployments.
//
// WHY THIS EXISTS
// There is one Supabase project, and stripe-checkout reads STRIPE_SECRET_KEY,
// which is a LIVE key. So every checkout opened from a preview deployment was a
// live session against a real card: on 2026-09-29 a preview test produced
// cs_live_… sessions showing "Total due today $9.99". Nothing was completed,
// but finishing one would have taken real money.
//
// Preview builds call this function instead (see subscriptionService.ts, which
// picks the name from VITE_DEPLOY_ENV). Production is untouched and still calls
// stripe-checkout.
//
// TWO RULES THIS FILE ENFORCES, because "we meant to use the test key" is not a
// safety mechanism:
//
//   1. It refuses to run unless STRIPE_TEST_SECRET_KEY is a test key. A live key
//      pasted into the test secret by mistake fails closed with a 500 rather
//      than quietly charging somebody.
//   2. It NEVER writes to user_profiles. stripe_customer_id there is the LIVE
//      customer, and a test-mode customer id written over it would break that
//      account's real billing and its Stripe portal. A fresh test customer per
//      session costs nothing in test mode and keeps the two worlds apart.
//
// There is deliberately NO test webhook. Nothing here can grant premium: a
// completed test checkout updates no row anywhere. That is the point. To verify
// what the subscription looked like, read the session in the Stripe test
// dashboard rather than expecting the app to change.

import Stripe from "npm:stripe@^14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const testKey = Deno.env.get("STRIPE_TEST_SECRET_KEY") ?? "";
  if (!testKey) {
    return json(
      { error: "Test checkout is not configured: STRIPE_TEST_SECRET_KEY is unset." },
      500,
    );
  }
  // Rule 1. sk_test_ / rk_test_ only. Anything else, including a live key, stops here.
  if (!/^(sk|rk)_test_/.test(testKey)) {
    console.error("stripe-checkout-test: STRIPE_TEST_SECRET_KEY is not a test key; refusing.");
    return json(
      { error: "Test checkout is misconfigured: the configured key is not a Stripe test key." },
      500,
    );
  }

  const monthlyPrice = Deno.env.get("STRIPE_TEST_MONTHLY_PRICE_ID") ?? "";
  const annualPrice = Deno.env.get("STRIPE_TEST_ANNUAL_PRICE_ID") ?? "";
  if (!monthlyPrice || !annualPrice) {
    return json(
      { error: "Test checkout is not configured: test price ids are unset." },
      500,
    );
  }

  const stripe = new Stripe(testKey, { apiVersion: "2024-06-20" });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error: userError,
  } = await supabaseUser.auth.getUser();
  if (userError || !user) return json({ error: "Invalid or expired token" }, 401);

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let plan: "monthly" | "annual" = "annual";
  try {
    const body = await req.json();
    if (body?.plan === "monthly" || body?.plan === "annual") plan = body.plan;
  } catch {
    // No body or invalid JSON — use default
  }
  const priceId = plan === "monthly" ? monthlyPrice : annualPrice;

  // READ ONLY. Rule 2: nothing in this function writes to user_profiles.
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("subscription_status, current_period_end, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // Same trial rule as stripe-checkout, so a preview run shows the same "due
  // today" and first-charge date a real one would. Kept as its own copy rather
  // than shared: these two functions deploy independently, and a shared module
  // that drifted would make the preview lie about production.
  const TRIAL_DAYS = 7;
  const MIN_TRIAL_LEAD_MS = 48 * 60 * 60 * 1000;
  const parseDate = (v: unknown): Date | null => {
    if (typeof v !== "string" || !v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const onTrial = profile?.subscription_status === "trialing";
  const derivedTrialEnd = (() => {
    const created = parseDate(profile?.created_at);
    if (!created) return null;
    const d = new Date(created);
    d.setDate(d.getDate() + TRIAL_DAYS);
    return d;
  })();
  const trialEnd = !onTrial
    ? null
    : (parseDate((profile as Record<string, unknown> | null)?.trial_ends_at) ??
      parseDate(profile?.current_period_end) ??
      derivedTrialEnd);
  const chargeAtEndOfTrial =
    trialEnd !== null && trialEnd.getTime() - Date.now() >= MIN_TRIAL_LEAD_MS;

  console.log(
    JSON.stringify({
      at: "trial_end_decision",
      mode: "test",
      user_id: user.id,
      plan,
      subscription_status: profile?.subscription_status ?? null,
      on_trial: onTrial,
      trial_end: trialEnd ? trialEnd.toISOString() : null,
      sent_trial_end: chargeAtEndOfTrial,
    }),
  );

  try {
    // A fresh test customer each time. Deliberately NOT reusing
    // user_profiles.stripe_customer_id: that id belongs to the live account and
    // does not exist in test mode, and persisting a test id there would corrupt
    // real billing.
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id, origin: "preview_test_checkout" },
    });

    const frontend = req.headers.get("origin") ?? Deno.env.get("FRONTEND_URL") ?? "";
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      client_reference_id: user.id,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { plan, supabase_user_id: user.id, mode: "test" },
        ...(chargeAtEndOfTrial
          ? { trial_end: Math.floor(trialEnd!.getTime() / 1000) }
          : {}),
      },
      // Back to whichever preview opened this, not to production.
      success_url: `${frontend}/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${frontend}/pricing`,
      automatic_tax: { enabled: false },
    });
    return json({ url: session.url });
  } catch (err) {
    console.error("Stripe TEST checkout error:", err);
    return json({ error: "Failed to create test checkout session" }, 502);
  }
});
