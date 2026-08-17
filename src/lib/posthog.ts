import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    session_recording: { maskAllInputs: true },
  });
  initialized = true;
}

/**
 * Turn analytics capture on or off at runtime.
 *
 * PostHog cannot be un-initialized, so opting out is done through
 * opt_out_capturing() rather than by tearing the client down. Enabling for the
 * first time in a session initializes it lazily — a user who accepts from
 * Settings gets analytics without needing a reload.
 */
export function setAnalyticsEnabled(enabled: boolean) {
  if (enabled) {
    initPostHog();
    if (initialized) posthog.opt_in_capturing();
    return;
  }
  if (initialized) posthog.opt_out_capturing();
}

export { posthog };
