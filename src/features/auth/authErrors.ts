import type { AuthError } from "@supabase/supabase-js";

/**
 * Human copy for Supabase auth errors.
 *
 * Every auth surface used to fall through to `error.message`, which puts the
 * raw string on screen. A student who signed up during a burst got
 * "email rate limit exceeded" at the top of the form — which doesn't say what
 * happened, whose fault it is, or whether their account now exists.
 *
 * Matching prefers `error.code` (supabase-js exposes stable codes) and falls
 * back to the message text, because the codes are newer than some of the errors
 * the API still returns and OAuth errors arrive without one.
 *
 * Tone follows the garden voice, with one rule that outranks it: never assert
 * account state we haven't confirmed. Telling someone their account wasn't
 * created, when the API only told us an email failed to send, would be a
 * confident lie at the exact moment they're deciding whether to trust us.
 */

export interface HumanAuthError {
  /** Shown to the user. */
  message: string;
  /** True when retrying the same action later is the right move. */
  retryable: boolean;
}

const GENERIC: HumanAuthError = {
  message:
    "Something went wrong on our end. Give it a moment and try again — nothing you typed was lost.",
  retryable: true,
};

interface Rule {
  codes?: string[];
  match?: RegExp;
  result: HumanAuthError;
}

const RULES: Rule[] = [
  {
    // The one that actually bit us: Supabase's built-in email sender is rate
    // limited per hour, and it trips within a couple of signups.
    codes: ["over_email_send_rate_limit"],
    match: /email rate limit exceeded|rate limit.*email/i,
    result: {
      message:
        "We're sending a lot of seeds right now. Give it a few minutes and try again — you haven't lost your place.",
      retryable: true,
    },
  },
  {
    codes: ["over_request_rate_limit"],
    match: /too many requests|rate limit/i,
    result: {
      message:
        "That's a few too many tries in a row. Take a short breather and have another go.",
      retryable: true,
    },
  },
  {
    codes: ["user_already_exists", "email_exists"],
    match: /already registered|already been registered|user already exists/i,
    result: {
      message:
        "There's already a garden growing under this email. Try signing in instead.",
      retryable: false,
    },
  },
  {
    codes: ["invalid_credentials"],
    match: /invalid login credentials|invalid credentials/i,
    result: {
      message:
        "That email and password don't match. Worth another try — check for a stray capital letter.",
      retryable: true,
    },
  },
  {
    codes: ["email_not_confirmed"],
    match: /email not confirmed/i,
    result: {
      message:
        "Almost there — open the link we emailed you to finish planting your garden.",
      retryable: false,
    },
  },
  {
    codes: ["otp_expired"],
    match: /invalid or has expired|token has expired|expired/i,
    result: {
      message:
        "That link has wilted — they only last a short while. Send yourself a fresh one and it'll work.",
      retryable: true,
    },
  },
  {
    codes: ["weak_password"],
    match: /password.*(weak|should be)/i,
    result: {
      message:
        "That password is a little too easy to guess. Try a longer one with a capital letter and a number.",
      retryable: false,
    },
  },
  {
    codes: ["validation_failed"],
    match: /unable to validate email|invalid email/i,
    result: {
      message: "That email address doesn't look quite right. Mind checking it?",
      retryable: false,
    },
  },
  {
    codes: ["signup_disabled", "email_provider_disabled"],
    result: {
      message:
        "New signups are paused right now. Please try again a bit later.",
      retryable: true,
    },
  },
  {
    // Offline / DNS / CORS — supabase-js surfaces these as AuthRetryableFetchError.
    match: /failed to fetch|network|fetch error/i,
    result: {
      message:
        "We can't reach the garden — that usually means the connection dropped. Check your wifi and try again.",
      retryable: true,
    },
  },
];

/** Map a Supabase auth error (or anything thrown) to copy safe to show a user. */
export function toHumanAuthError(
  error: AuthError | Error | null | undefined,
): HumanAuthError {
  if (!error) return GENERIC;

  const code =
    typeof (error as AuthError).code === "string"
      ? (error as AuthError).code
      : undefined;
  const message = typeof error.message === "string" ? error.message : "";

  for (const rule of RULES) {
    if (code && rule.codes?.includes(code)) return rule.result;
    if (rule.match?.test(message)) return rule.result;
  }

  return GENERIC;
}

/** Convenience for the common `setError(...)` call sites. */
export function humanAuthMessage(
  error: AuthError | Error | null | undefined,
): string {
  return toHumanAuthError(error).message;
}
