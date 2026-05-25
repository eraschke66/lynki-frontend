import { useSubscription } from "./useSubscription";

/**
 * §12 Block F (frontend) — seed balance display.
 *
 * Stubbed against the signup-gift default of 1 until Block E ships the real
 * field on the auth/me response. When that lands, swap the body for either:
 *   - a useQuery hit against user_profiles (mirror useSubscription's pattern), or
 *   - read from the auth context if Block E embeds it in the session payload.
 *
 * Either swap is a one-file change; consumers keep the same shape.
 */

export interface SeedBalance {
  /** Number of Tending Flow credits remaining. 0+. Always 1 in the stub. */
  balance: number;
  /** Whether the user is on Pass Pro. Pro users don't consume seeds; surface
   *  "Pass Pro · unlimited" instead of a numeric balance. */
  isPremium: boolean;
  /** True while either auth or subscription queries are pending. */
  isLoading: boolean;
}

export function useSeedBalance(): SeedBalance {
  const { isPremium, isLoading } = useSubscription();
  return { balance: 1, isPremium, isLoading };
}
