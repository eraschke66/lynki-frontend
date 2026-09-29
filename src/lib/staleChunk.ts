/**
 * Recover from a chunk that no longer exists on the server.
 *
 * Routes are React.lazy'd, so the bundle for a screen is fetched the moment
 * someone navigates to it. Deploy while a tab is open and that tab is still
 * asking for the PREVIOUS build's hashed filenames, which Vercel no longer
 * serves. The import rejects and the screen never renders:
 *
 *   Failed to fetch dynamically imported module: .../PricingPage-<hash>.js
 *
 * Sentry JAVASCRIPT-REACT-7/8/9. Those three came from headless test runs
 * during a deploy, but the mechanism is not specific to tests: any student with
 * the app open when we ship hits it the next time they navigate.
 *
 * A reload fixes it, because the fresh document references the new hashes.
 *
 * THE RELOAD CAN HAPPEN AT MOST ONCE. If the chunk is missing for any reason a
 * reload cannot fix (a genuinely broken deploy, an offline device, a blocking
 * extension) then reloading on every failure is an infinite refresh loop, which
 * is far worse than the error. The sessionStorage flag is what makes that
 * impossible: set before reloading, cleared only once the page has come up and
 * stayed up, and scoped to the tab so one bad tab cannot wedge the others.
 */

const FLAG = "passai_chunk_reloaded";

/** Matches what browsers throw for a module that 404s or fails to parse. */
function isStaleChunkError(reason: unknown): boolean {
  const msg =
    reason instanceof Error
      ? `${reason.name}: ${reason.message}`
      : typeof reason === "string"
        ? reason
        : "";
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) || // Safari
    // A chunk that 404s is answered by the SPA rewrite with app.html, so the
    // browser rejects the HTML where it wanted JavaScript.
    /Failed to load module script/i.test(msg) ||
    /Expected a JavaScript module script/i.test(msg)
  );
}

function alreadyReloaded(): boolean {
  try {
    return sessionStorage.getItem(FLAG) === "1";
  } catch {
    // Private mode or storage disabled: treat as "already reloaded" so the
    // absence of a flag can never authorise a loop.
    return true;
  }
}

function markReloaded(): void {
  try {
    sessionStorage.setItem(FLAG, "1");
  } catch {
    /* handled by alreadyReloaded returning true */
  }
}

function reloadOnce(reason: unknown): boolean {
  if (alreadyReloaded()) return false;
  markReloaded();
  console.warn("[staleChunk] reloading once to pick up the current build:", reason);
  // replace(), not reload(): reload can re-post and would add a history entry
  // the back button walks straight back into.
  window.location.replace(window.location.href);
  return true;
}

/**
 * Install the handlers. Call once, before the app renders.
 */
export function installStaleChunkRecovery(): void {
  // Vite's own signal for a failed modulepreload. Calling preventDefault stops
  // Vite throwing it onward, so this is the clean path when it fires.
  window.addEventListener("vite:preloadError", (event) => {
    const e = event as Event & { payload?: unknown };
    if (reloadOnce(e.payload ?? "vite:preloadError")) event.preventDefault();
  });

  // React.lazy() failures surface as an unhandled rejection rather than through
  // vite:preloadError, so the same check has to run here too.
  window.addEventListener("unhandledrejection", (event) => {
    if (isStaleChunkError(event.reason) && reloadOnce(event.reason)) {
      event.preventDefault();
    }
  });

  // The page is up. Anything that fails from here is a fresh failure and gets
  // its own single reload. Delayed so it does not clear the flag while the
  // reloaded page is still fetching the chunk that failed a moment ago.
  window.addEventListener("load", () => {
    setTimeout(() => {
      try {
        sessionStorage.removeItem(FLAG);
      } catch {
        /* nothing to clear */
      }
    }, 10_000);
  });
}

export const __test__ = { isStaleChunkError, FLAG };
