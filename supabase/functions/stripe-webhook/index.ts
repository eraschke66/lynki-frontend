import Stripe from "npm:stripe@^14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method !== "POST")
    return new Response("Method Not Allowed", { status: 405 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing Stripe-Signature", { status: 400 });

  // Must read raw body BEFORE any parsing — required for Stripe signature verification
  const body = await req.text();

  let event: Stripe.Event;
  try {
    // constructEventAsync uses Web Crypto API (works in Deno edge runtime)
    // The sync constructEvent uses Node.js crypto — does NOT work in Deno
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  // Always return 200 after verification — log DB errors but never let Stripe retry on them
  try {
    await handleEvent(event);
  } catch (err) {
    console.error(
      `Webhook handler error for ${event.id} (${event.type}):`,
      err,
    );
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await onSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      await onPaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function upsertByCustomer(
  customerId: string,
  updates: Record<string, unknown>,
) {
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (!profile) {
    console.warn(`No user_profiles row for stripe_customer_id=${customerId}`);
    return;
  }
  await supabaseAdmin
    .from("user_profiles")
    .update(updates)
    .eq("stripe_customer_id", customerId);
}

function tsToIso(ts: number | null | undefined): string | null {
  return ts == null ? null : new Date(ts * 1000).toISOString();
}

/**
 * Derive the billing interval from a Stripe Subscription.
 * Prefers the plan metadata we set at checkout; falls back to the price
 * recurring interval (month → "monthly", year → "annual").
 */
function resolveInterval(
  subscription: Stripe.Subscription,
): "monthly" | "annual" {
  const meta = subscription.metadata?.plan;
  if (meta === "monthly" || meta === "annual") return meta;

  // Fallback: inspect the first line-item's recurring interval
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  return interval === "month" ? "monthly" : "annual";
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  if (!customerId || !subscriptionId) {
    console.error(
      "Missing customer/subscription in checkout.session.completed",
      session.id,
    );
    return;
  }
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const interval = resolveInterval(subscription);

  await upsertByCustomer(customerId, {
    subscription_tier: "premium",
    subscription_status: "active",
    stripe_subscription_id: subscriptionId,
    current_period_end: tsToIso(subscription.current_period_end),
    subscription_interval: interval,
  });
  console.log(
    `User upgraded to premium (customer=${customerId}, interval=${interval})`,
  );
}

async function onSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const tier =
    subscription.status === "active" || subscription.status === "trialing"
      ? "premium"
      : "free";
  const interval = resolveInterval(subscription);

  await upsertByCustomer(customerId, {
    subscription_tier: tier,
    subscription_status: subscription.status,
    current_period_end: tsToIso(subscription.current_period_end),
    subscription_interval: tier === "premium" ? interval : null,
  });
}

async function onSubscriptionDeleted(subscription: Stripe.Subscription) {
  await upsertByCustomer(subscription.customer as string, {
    subscription_tier: "free",
    subscription_status: "canceled",
    stripe_subscription_id: null,
    current_period_end: null,
    subscription_interval: null,
  });
}

async function onPaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.customer) return;
  await upsertByCustomer(invoice.customer as string, {
    subscription_status: "past_due",
  });
}
