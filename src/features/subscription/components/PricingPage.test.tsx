/**
 * Which /pricing buttons are live, per subscription state.
 *
 * The regression this guards: isCurrentPlan used to read a null billing
 * interval as "on the annual plan". During the free trial isPremium is true
 * and interval is null (Stripe holds nothing yet), so the annual card rendered
 * a disabled "Your plan" and the monthly button's matching condition disabled
 * it too. A trialing user could not subscribe from anywhere in the app: these
 * two buttons are the only callers of createCheckoutSession, and /settings
 * showed text only during the trial.
 *
 * The fix gates both predicates on hasStripeSubscription. The paying cases
 * below are here to prove that behaviour did not move for them, including the
 * legacy null-interval row the original fallback existed for.
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SubscriptionInfo } from "../hooks/useSubscription";

const mockSubscription = vi.fn<() => SubscriptionInfo>();

vi.mock("../hooks/useSubscription", () => ({
  useSubscription: () => mockSubscription(),
}));
vi.mock("@/features/auth", () => ({
  useAuth: () => ({ session: { access_token: "test-token" }, user: { id: "u1" } }),
}));
vi.mock("../services/subscriptionService", () => ({
  createCheckoutSession: vi.fn(),
}));
vi.mock("@/lib/posthog", () => ({ posthog: { capture: vi.fn() } }));
vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("@/components/garden/GhibliBackground", () => ({ default: () => null }));
vi.mock("@/components/garden/VineDecoration", () => ({ VineDecoration: () => null }));

import { PricingPage } from "./PricingPage";

const base: SubscriptionInfo = {
  tier: "free",
  status: null,
  interval: null,
  currentPeriodEnd: null,
  isPremium: false,
  isOnTrial: false,
  trialEndsAt: null,
  hasStripeSubscription: false,
  isLoading: false,
};

function renderWith(state: Partial<SubscriptionInfo>) {
  mockSubscription.mockReturnValue({ ...base, ...state });
  render(
    <MemoryRouter>
      <PricingPage />
    </MemoryRouter>,
  );
}

/** The two checkout buttons, found by the text each card renders. */
const monthlyBtn = () => screen.getByRole("button", { name: /get started/i });
const annualBtn = () => screen.getByRole("button", { name: /upgrade/i });

describe("PricingPage plan buttons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("leaves both plans purchasable during the free trial", () => {
    // isPremium true (the trial grants access), interval null, Stripe has nothing.
    renderWith({
      tier: "premium",
      status: "trialing",
      isPremium: true,
      isOnTrial: true,
      hasStripeSubscription: false,
      trialEndsAt: new Date(Date.now() + 5 * 86_400_000),
    });

    expect(monthlyBtn()).toBeEnabled();
    expect(annualBtn()).toBeEnabled();
    // The trial must not be mistaken for an owned plan.
    expect(screen.queryByText(/your plan/i)).not.toBeInTheDocument();
  });

  it("leaves both plans purchasable once the trial has lapsed", () => {
    renderWith({ tier: "free", status: null, isPremium: false });

    expect(monthlyBtn()).toBeEnabled();
    expect(annualBtn()).toBeEnabled();
    expect(screen.queryByText(/your plan/i)).not.toBeInTheDocument();
  });

  it("marks the monthly plan owned and blocks the switch for a monthly subscriber", () => {
    renderWith({
      tier: "premium",
      status: "active",
      interval: "monthly",
      isPremium: true,
      hasStripeSubscription: true,
    });

    expect(screen.getByText(/your plan/i)).toBeInTheDocument();
    expect(annualBtn()).toBeDisabled();
  });

  it("marks the annual plan owned and blocks the switch for an annual subscriber", () => {
    renderWith({
      tier: "premium",
      status: "active",
      interval: "annual",
      isPremium: true,
      hasStripeSubscription: true,
    });

    expect(screen.getByText(/your plan/i)).toBeInTheDocument();
    expect(monthlyBtn()).toBeDisabled();
  });

  it("still treats a legacy paid row with no interval as annual", () => {
    // Why the null-means-annual fallback exists at all: older paid rows were
    // written without an interval. It is kept, but now requires Stripe to
    // actually hold a subscription, which is what excludes the trial.
    renderWith({
      tier: "premium",
      status: "active",
      interval: null,
      isPremium: true,
      hasStripeSubscription: true,
    });

    expect(screen.getByText(/your plan/i)).toBeInTheDocument();
    expect(monthlyBtn()).toBeDisabled();
  });
});
