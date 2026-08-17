import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

/** How often an open app re-checks for a new build. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Registers the service worker and asks before switching to a new version.
 *
 * vite-plugin-pwa is configured with registerType: 'prompt' rather than
 * 'autoUpdate' precisely so this can be a question. Activating a waiting worker
 * reloads the page, and doing that silently would take a student out of a quiz
 * mid-question.
 */
export function PWAUpdatePrompt() {
  // Both this and the cookie banner pin themselves to the bottom centre, and
  // the banner sits on a higher layer — so a returning user who had not yet
  // answered the consent question never saw the update offer at all, and their
  // app quietly stayed on the old build. Consent is the one-time, blocking
  // question; wait for it and then offer the refresh.
  const { consent } = useCookieConsent();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const timer = setInterval(() => {
        if (navigator.onLine) void registration.update();
      }, UPDATE_CHECK_INTERVAL_MS);

      // The registration outlives this component; clearing on unload just keeps
      // the interval from piling up across hot reloads in development.
      window.addEventListener("beforeunload", () => clearInterval(timer));
    },
    onRegisterError(error) {
      console.error("[pwa] service worker registration failed:", error);
    },
  });

  if (!needRefresh || consent === null) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[9995] flex justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pointer-events-none"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl parchment-solid border border-ghibli-moss/30 p-3 pl-4 shadow-[0_-4px_24px_hsl(var(--ghibli-canopy)/0.12)]">
        <RefreshCw className="size-5 shrink-0 text-ghibli-jungle" aria-hidden />

        <p className="m-0 flex-1 text-sm leading-snug text-ghibli-bark">
          <span className="font-semibold text-ghibli-canopy">
            A fresh version of PassAI is ready.
          </span>{" "}
          Refresh when you're between quizzes.
        </p>

        <button
          onClick={() => setNeedRefresh(false)}
          className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-ghibli-jungle hover:bg-ghibli-mist/70 transition-colors cursor-pointer"
        >
          Later
        </button>
        <button
          onClick={() => void updateServiceWorker(true)}
          className="shrink-0 rounded-lg border-0 bg-gradient-to-br from-ghibli-jungle to-ghibli-canopy px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_2px_8px_hsl(var(--ghibli-canopy)/0.25)] transition-shadow hover:shadow-[0_4px_12px_hsl(var(--ghibli-canopy)/0.35)] cursor-pointer"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
