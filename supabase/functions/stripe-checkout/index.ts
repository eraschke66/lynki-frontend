import Stripe from "npm:stripe@^14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing Authorization header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Validate JWT using a user-scoped client — never the service role key
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error: userError,
  } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Admin client for DB writes (bypasses RLS)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Determine which plan the user selected — defaults to "annual"
  let plan: "monthly" | "annual" = "annual";
  try {
    const body = await req.json();
    if (body?.plan === "monthly" || body?.plan === "annual") {
      plan = body.plan;
    }
  } catch {
    // No body or invalid JSON — use default
  }

  const priceId =
    plan === "monthly"
      ? Deno.env.get("STRIPE_MONTHLY_PRICE_ID")!
      : Deno.env.get("STRIPE_ANNUAL_PRICE_ID")!;

  // `*` on purpose: this needs stripe_customer_id, plus the columns the trial
  // end is read from below, and it must keep working if trial_ends_at is added
  // later. One self-scoped row.
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // WHEN THE FIRST CHARGE LANDS.
  //
  // Subscribing during the free week must not cut the week short: take the
  // card now, charge when the free time actually runs out. Stripe does that
  // with subscription_data.trial_end, an absolute timestamp.
  //
  // The trial end is read from current_period_end, NOT from created_at + 7
  // days. handle_new_user writes an explicit end date at signup and it is not
  // always 7 days out: is_beta_cohort() emails get 30. Deriving 7 days from
  // created_at would bill a beta account on day 8 of a month it was promised.
  // created_at + 7 days stays as the fallback for rows written before the
  // trigger set current_period_end.
  //
  // Anyone whose free time has already run out, or is within Stripe's 48 hour
  // minimum, gets no trial_end and is charged at checkout, which is what the
  // /pricing copy now promises. Note this is also the group that used to be
  // handed a whole extra free week by trial_period_days before that was
  // removed in July.
  const TRIAL_DAYS = 7;
  const MIN_TRIAL_LEAD_MS = 48 * 60 * 60 * 1000;

  const parseDate = (v: unknown): Date | null => {
    if (typeof v !== "string" || !v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  // Everything here hangs off status === "trialing", which is the only thing
  // that says this account HAS free time left to protect. It matters for the
  // accounts handle_new_user deliberately refuses a trial: a repeat signup
  // caught by is_trial_eligible() is written tier=free, status=null, and
  // deriving created_at + 7 days for them would hand Stripe a free week the
  // signup path had just denied. Paying and lapsed accounts fall through here
  // too, and are charged at checkout.
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
    : (parseDate(profile?.trial_ends_at) ??
      parseDate(profile?.current_period_end) ??
      derivedTrialEnd);

  const chargeAtEndOfTrial =
    trialEnd !== null && trialEnd.getTime() - Date.now() >= MIN_TRIAL_LEAD_MS;

  // Why the first charge landed where it did. Without this the only way to tell
  // whether trial_end was sent is to read the Stripe session, and on 2026-09-29
  // a checkout that charged immediately looked like a bug in this function when
  // the row simply said status=null (the signup path had refused that address a
  // trial). No PII: ids and dates only.
  console.log(
    JSON.stringify({
      at: "trial_end_decision",
      user_id: user.id,
      plan,
      subscription_status: profile?.subscription_status ?? null,
      current_period_end: profile?.current_period_end ?? null,
      on_trial: onTrial,
      trial_end: trialEnd ? trialEnd.toISOString() : null,
      sent_trial_end: chargeAtEndOfTrial,
    }),
  );

  let customerId: string;
  if (profile?.stripe_customer_id) {
    customerId = profile.stripe_customer_id;
  } else {
    const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(
      user.id,
    );
    const customer = await stripe.customers.create({
      email: adminUser?.user?.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    // Persist immediately so we never create duplicates on concurrent requests
    await supabaseAdmin
      .from("user_profiles")
      .upsert(
        { user_id: user.id, stripe_customer_id: customerId },
        { onConflict: "user_id" },
      );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // Allow beta comp codes, influencer codes and ambassador codes to be
      // entered at checkout. Without this Stripe hides the promo code field
      // entirely and every promotion code we create is unusable.
      allow_promotion_codes: true,
      // Attach plan to the Stripe Subscription metadata so the webhook can read it.
      //
      // NOTE (Jul 30): trial_period_days was REMOVED here. The 7-day free trial is
      // now granted at signup by the handle_new_user DB trigger (tier=premium,
      // status=trialing, current_period_end=now()+7d). Stripe adding its OWN
      // trial_period_days on top caused a double-trial (~14 free days for anyone
      // subscribing mid-trial). The DB grant is the single source of the trial;
      // checkout now converts that trial into a paid subscription and charges per
      // Stripe's normal billing.
      // trial_end (absolute) rather than trial_period_days (relative): the free
      // week started at signup, not at checkout, so a relative window would
      // hand out a second one. See the note above the calculation.
      subscription_data: {
        metadata: { plan, supabase_user_id: user.id },
        ...(chargeAtEndOfTrial
          ? { trial_end: Math.floor(trialEnd!.getTime() / 1000) }
          : {}),
      },
      success_url: `${Deno.env.get("FRONTEND_URL")}/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${Deno.env.get("FRONTEND_URL")}/pricing`,
      automatic_tax: { enabled: false },
    });
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
