/**
 * Single entry point for every call to the FastAPI backend.
 *
 * Peter's backend is about to verify the Supabase JWT on every /api/v1/*
 * request, so the access token has to ride along on all of them. Routing
 * every call through here means there is exactly one place that knows the
 * base URL and exactly one place that attaches the Authorization header —
 * no call site builds either for itself.
 */

import { supabase } from "@/lib/supabase";

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:8000/api/v1";

/**
 * The service root, i.e. API_URL with the trailing /api/v1 stripped.
 * Only the wake ping uses it: FastAPI's "/" is the only 200 route outside
 * the versioned prefix today.
 */
const BACKEND_ROOT = API_URL.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "");

const WAKE_TIMEOUT_MS = 30_000;

function authorizedHeaders(
  init: RequestInit,
  token: string | undefined,
): Headers {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

/**
 * Fetch a backend path (e.g. "/test/answer") with the current Supabase
 * access token attached.
 *
 * On a 401 the session is refreshed once and the request replayed. A second
 * 401 means the session is genuinely dead, so we sign out rather than leave
 * the user clicking through a UI that can no longer talk to the backend.
 *
 * Returns the Response untouched — callers keep their own status handling.
 */
export async function backendFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let headers = authorizedHeaders(init, session?.access_token);
  let res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    const { data } = await supabase.auth.refreshSession();
    if (data.session?.access_token) {
      headers = authorizedHeaders(init, data.session.access_token);
      res = await fetch(`${API_URL}${path}`, { ...init, headers });
    }
    if (res.status === 401) {
      await supabase.auth.signOut();
      throw new Error("Session expired");
    }
  }

  return res;
}

/**
 * Wake the Render dyno. Unauthenticated on purpose — it hits the service
 * root, not /api/v1, and runs before the user has necessarily signed in.
 * Never throws; a failed ping just means the next real call pays the cold
 * start it would have paid anyway.
 */
export async function pingBackend(): Promise<boolean> {
  if (!BACKEND_ROOT) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WAKE_TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND_ROOT}/`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    return res.ok;
  } catch (err) {
    console.warn("Backend wake-up ping failed (may be cold starting):", err);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
