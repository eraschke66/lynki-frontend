/**
 * Single source of truth for "may this account use the paid features".
 *
 * The product promises, on the landing page and on /pricing, that every new
 * account gets seven days of the whole garden with no credit card. Until now
 * nothing implemented that: signup writes subscription_tier = 'free' and
 * nothing else, so a brand-new account was permanently a free user and the
 * Study Garden and Smart Study Plan — the two features that are the product —
 * were locked at the front door.
 *
 * TRIAL SOURCE, IN ORDER OF PREFERENCE
 *   1. `trial_ends_at`, once that column exists. Explicit, and lets a trial be
 *      extended or revoked per account.
 *   2. `current_period_end`, which handle_new_user writes at signup and is the
 *      real length of the grant (30 days for a beta cohort address, 7 otherwise).
 *   3. `created_at + TRIAL_DAYS`, for a trialing row written before the trigger
 *      populated current_period_end.
 *
 * All three are gated on subscription_status = 'trialing'. Reading (3) on its
 * own, as this did until 2026-09-29, granted a free week to accounts the signup
 * path had explicitly refused one. See trialEndsAt for the detail.
 *
 * Deliberately NOT Stripe trials: those require a card on file, which
 * contradicts "No credit card".
 */

export const TRIAL_DAYS = 7;

/** The subset of user_profiles this module reasons about. */
export interface AccessProfile {
  subscription_tier?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
  /** Present only after the trial_ends_at migration. */
  trial_ends_at?: string | null;
  created_at?: string | null;
}

/**
 * Statuses that count as paying. `past_due` is included on purpose — Stripe
 * retries failed payments for days, and locking someone out mid-retry punishes
 * them for a bank's timing.
 */
const PAYING_STATUSES = new Set(["active", "trialing", "past_due"]);

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * When this account's free trial ends, or null if it does not have one.
 *
 * Reads the grant the DATABASE made, rather than deriving a week from
 * created_at. handle_new_user decides at signup whether a trial is granted and
 * how long it runs, and writes the answer to subscription_status plus
 * current_period_end. Two things that decision knows and created_at does not:
 *
 *   - is_beta_cohort() emails get 30 days, not 7. A derived week expired their
 *     trial on day 8 in the UI while the paywall, which reads current_period_end
 *     through isPaying(), still let them in until day 30.
 *   - is_trial_eligible() REFUSES a trial to a repeat signup (the normalized
 *     address is already in trial_ledger) and writes tier=free, status=null.
 *     Deriving created_at + 7 days handed those accounts the free week the
 *     signup path had just denied, which made trial_ledger decorative: any
 *     address could take another week by signing up again with a +tag.
 *
 * So: no trial unless the row says "trialing". created_at + TRIAL_DAYS survives
 * only as the fallback for a trialing row written before current_period_end was
 * populated. This is the same order stripe-checkout uses to pick trial_end, so
 * /settings, the paywall and the first charge date cannot disagree.
 */
export function trialEndsAt(
  profile: AccessProfile | null | undefined,
): Date | null {
  if (!profile) return null;
  if (profile.subscription_status !== "trialing") return null;

  const explicit = parseDate(profile.trial_ends_at);
  if (explicit) return explicit;

  const granted = parseDate(profile.current_period_end);
  if (granted) return granted;

  const created = parseDate(profile.created_at);
  if (!created) return null;

  const derived = new Date(created);
  derived.setDate(derived.getDate() + TRIAL_DAYS);
  return derived;
}

/** True while the free trial is still running. */
export function isOnTrial(
  profile: AccessProfile | null | undefined,
  now: Date = new Date(),
): boolean {
  const ends = trialEndsAt(profile);
  return ends !== null && ends > now;
}

/** True when the account is a paying subscriber in good standing. */
export function isPaying(
  profile: AccessProfile | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!profile) return false;
  const tier = profile.subscription_tier ?? "free";
  const status = profile.subscription_status ?? null;
  if (tier !== "premium" || status === null) return false;
  if (!PAYING_STATUSES.has(status)) return false;

  // Catches a subscription Stripe has ended but our webhook hasn't processed.
  const periodEnd = parseDate(profile.current_period_end);
  return periodEnd === null || periodEnd > now;
}

/**
 * The one gate. Paying subscribers and unexpired trials get everything;
 * everyone else sees the upgrade screens.
 */
export function hasFullAccess(
  profile: AccessProfile | null | undefined,
  now: Date = new Date(),
): boolean {
  return isPaying(profile, now) || isOnTrial(profile, now);
}
