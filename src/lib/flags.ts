/**
 * Frontend feature flags.
 *
 * Flags read from Vite env at build time. To override locally, add to .env.local:
 *   VITE_USE_MOCK_TENDING_API=false
 */

const truthy = (v: string | undefined, fallback: boolean): boolean => {
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
};

export const USE_MOCK_TENDING_API = truthy(
  import.meta.env.VITE_USE_MOCK_TENDING_API as string | undefined,
  true,
);
