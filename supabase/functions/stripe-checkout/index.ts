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

  // Get or create Stripe customer — never create duplicates
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

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
      // Attach plan to the Stripe Subscription metadata so the webhook can read it
      subscription_data: {
        metadata: { plan },
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
