import { useSyncExternalStore } from "react";
import { setAnalyticsEnabled } from "@/lib/posthog";

const KEY = "passai_cookie_consent";

export type Consent = "all" | "essential" | null;

// Module-level store.
//
// This used to be a per-component useState, which meant every caller held its
// own copy: Settings could clear the consent and the banner mounted in App
// never heard about it, so "Change cookie preferences" looked like a one-way
// switch — you could turn analytics off and never back on without a reload.
// One store + useSyncExternalStore keeps every consumer on the same value.

function read(): Consent {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === "all" || raw === "essential" ? raw : null;
  } catch {
    // Private mode / storage disabled — behave as "not yet asked".
    return null;
  }
}

let current: Consent = read();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changing consent should update this one too.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    current = read();
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Consent {
  return current;
}

/**
 * Set (or clear) consent. Persists to localStorage, tells PostHog to start or
 * stop capturing, and notifies every mounted consumer.
 */
export function writeConsent(next: Consent) {
  try {
    if (next === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // Storage unavailable — keep the in-memory value so the session still
    // reflects the choice.
  }
  current = next;
  setAnalyticsEnabled(next === "all");
  emit();
}

export function useCookieConsent() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    consent,
    analyticsEnabled: consent === "all",
    /** Consent given for analytics. */
    acceptAll: () => writeConsent("all"),
    /** Essential cookies only — analytics off, but the choice is recorded. */
    acceptEssential: () => writeConsent("essential"),
    /** Forget the choice entirely, which re-opens the consent banner. */
    clearConsent: () => writeConsent(null),
    /** Two-way switch used by Settings. */
    setAnalytics: (enabled: boolean) =>
      writeConsent(enabled ? "all" : "essential"),
  };
}
