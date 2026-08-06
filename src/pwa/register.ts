/**
 * Cache hygiene for the installed app.
 *
 * Service worker registration itself lives in PWAUpdatePrompt, which needs the
 * registration object to drive the "a new version is ready" flow. This module
 * handles only the part that has to happen regardless of what the UI is doing.
 */

import { supabase } from "@/lib/supabase";
import { clearOfflineData } from "@/lib/offline/db";

/** Runtime caches declared in vite.config.ts that hold user-scoped responses. */
const USER_SCOPED_CACHES = ["passai-supabase", "passai-backend"];

/**
 * Drop everything belonging to the user who just signed out.
 *
 * NetworkFirst keys its entries by URL, so on a shared browser the next person
 * to sign in could otherwise be served the previous person's courses for as
 * long as the network is slow — same for any quiz session in IndexedDB.
 */
async function purgeUserScopedData(): Promise<void> {
  try {
    if (typeof caches !== "undefined") {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => USER_SCOPED_CACHES.includes(n)).map((n) => caches.delete(n)),
      );
    }
  } catch (err) {
    console.error("[pwa] failed to clear runtime caches:", err);
  }

  await clearOfflineData();
}

/**
 * Start listening for sign-out. Returns a teardown function.
 *
 * Guarded so React's StrictMode double-mount doesn't leave two listeners
 * behind, each purging the same caches.
 */
let initialised = false;

export function initPwa(): () => void {
  if (typeof window === "undefined" || initialised) return () => {};
  initialised = true;

  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") void purgeUserScopedData();
  });

  return () => {
    data.subscription.unsubscribe();
    initialised = false;
  };
}
