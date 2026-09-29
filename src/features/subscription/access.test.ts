/**
 * Entitlement, against the shapes handle_new_user actually writes.
 *
 * trialEndsAt used to be `trial_ends_at ?? created_at + 7 days`, with no regard
 * for what the database granted. That disagreed with the trigger in two
 * directions at once, and both showed up in production on 2026-09-29.
 */
import { describe, it, expect } from "vitest";
import {
  trialEndsAt,
  isOnTrial,
  isPaying,
  hasFullAccess,
  type AccessProfile,
} from "./access";

const DAY = 86_400_000;
const at = (days: number) => new Date(Date.now() + days * DAY).toISOString();

/** What handle_new_user writes for an eligible signup: 7 days, or 30 for beta. */
const granted = (daysAgo: number, lengthDays: number): AccessProfile => ({
  subscription_tier: "premium",
  subscription_status: "trialing",
  current_period_end: at(-daysAgo + lengthDays),
  created_at: at(-daysAgo),
});

describe("trial length follows the database grant", () => {
  it("gives a beta account its full 30 days on day 10", () => {
    // The bug: created_at + 7 days expired this trial on day 8 in the UI, while
    // isPaying kept the paywall open until day 30. /settings branches on
    // isOnTrial, so a beta user was shown the lapsed "Manage Subscription"
    // card, which opens a Stripe portal they have no customer record for.
    const beta = granted(10, 30);

    expect(isOnTrial(beta)).toBe(true);
    expect(hasFullAccess(beta)).toBe(true);
    const ends = trialEndsAt(beta)!;
    expect(Math.round((ends.getTime() - Date.now()) / DAY)).toBe(20);
  });

  it("ends a standard trial on day 7, not later", () => {
    expect(isOnTrial(granted(3, 7))).toBe(true);
    expect(isOnTrial(granted(8, 7))).toBe(false);
    expect(hasFullAccess(granted(8, 7))).toBe(false);
  });

  it("grants nothing to an account the signup path refused a trial", () => {
    // is_trial_eligible() found the normalized address in trial_ledger, so
    // handle_new_user wrote tier=free, status=null. Deriving created_at + 7
    // days used to hand this account a free week anyway, which is what made
    // the repeat-trial check decorative: any address could take another week
    // by signing up again with a +tag.
    const refused: AccessProfile = {
      subscription_tier: "free",
      subscription_status: null,
      current_period_end: null,
      created_at: at(-1),
    };

    expect(trialEndsAt(refused)).toBeNull();
    expect(isOnTrial(refused)).toBe(false);
    expect(hasFullAccess(refused)).toBe(false);
  });

  it("prefers trial_ends_at over the granted period when present", () => {
    const extended: AccessProfile = { ...granted(2, 7), trial_ends_at: at(45) };
    expect(Math.round((trialEndsAt(extended)!.getTime() - Date.now()) / DAY)).toBe(45);
  });

  it("falls back to created_at + 7 days for a trialing row with no period end", () => {
    const legacy: AccessProfile = {
      subscription_tier: "premium",
      subscription_status: "trialing",
      current_period_end: null,
      created_at: at(-2),
    };
    expect(Math.round((trialEndsAt(legacy)!.getTime() - Date.now()) / DAY)).toBe(5);
    expect(isOnTrial(legacy)).toBe(true);
  });
});

describe("paying access is unchanged", () => {
  it("lets an active subscriber in", () => {
    const paying: AccessProfile = {
      subscription_tier: "premium",
      subscription_status: "active",
      current_period_end: at(20),
      created_at: at(-90),
    };
    expect(isPaying(paying)).toBe(true);
    expect(hasFullAccess(paying)).toBe(true);
    // Paying is not "on trial", whatever created_at says.
    expect(isOnTrial(paying)).toBe(false);
  });

  it("keeps a past_due subscriber in while Stripe retries", () => {
    expect(
      isPaying({
        subscription_tier: "premium",
        subscription_status: "past_due",
        current_period_end: at(3),
      }),
    ).toBe(true);
  });

  it("locks out a lapsed subscriber", () => {
    expect(
      hasFullAccess({
        subscription_tier: "premium",
        subscription_status: "active",
        current_period_end: at(-1),
        created_at: at(-200),
      }),
    ).toBe(false);
  });
});
