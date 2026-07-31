import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file.",
  );
}

/**
 * Supabase client instance configured with environment variables.
 * This client is used throughout the application for database operations.
 *
 * flowType is set explicitly: supabase-js defaults to the implicit flow, which
 * returns access_token and refresh_token in the URL fragment after an auth
 * redirect. Umami auto-tracks pageviews from index.html, so those tokens were
 * being sent to a third party. PKCE returns a short-lived ?code= instead, which
 * auth-js exchanges for tokens over the network and then strips from the URL
 * via history.replaceState — nothing credential-shaped ever sits in the address
 * bar for analytics or Sentry breadcrumbs to pick up.
 *
 * detectSessionInUrl stays on: PKCE needs it to spot and exchange the code.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    flowType: "pkce",
    detectSessionInUrl: true,
  },
});
