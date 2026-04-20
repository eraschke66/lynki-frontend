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

export { posthog };
