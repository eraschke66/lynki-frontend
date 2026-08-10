import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sprout, X } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

/**
 * `beforeinstallprompt` is not in lib.dom.
 * https://developer.mozilla.org/docs/Web/API/BeforeInstallPromptEvent
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "passai_install_dismissed_at";

/** Routes where the install offer must never appear. */
const AUTH_ROUTES = new Set(["/signup", "/login", "/auth/callback"]);
/** Once waved off, stay quiet for a month. */
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const MOBILE_MAX_WIDTH = 768;

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function alreadyInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * A one-line "add PassAI to your home screen" offer.
 *
 * Mobile only, and only once the browser has told us the app actually qualifies
 * — desktop Chrome already puts an install button in the address bar, so a
 * banner there would be noise. It also waits for the cookie banner to be
 * answered: two fixed banners stacked on a phone is how a prompt starts feeling
 * like nagging.
 */
export function InstallPrompt() {
  const { consent } = useCookieConsent();
  const { pathname } = useLocation();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_MAX_WIDTH,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (alreadyInstalled() || recentlyDismissed()) return;

    const onBeforeInstallPrompt = (e: Event) => {
      // Hold the event so the offer appears in our own UI rather than the
      // browser's mini-infobar.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      /* private browsing; the offer simply returns next session */
    }
  };

  const install = async () => {
    if (!deferred) return;

    await deferred.prompt();
    const { outcome } = await deferred.userChoice;

    // The event is single-use, whichever way the user answered.
    setDeferred(null);
    if (outcome === "dismissed") dismiss();
  };

  // Never on the auth pages. The banner is bottom-anchored and 91px tall, so on
  // any viewport under ~731px it covers the submit button — measured at 390px,
  // banner y610-701 against a button at y596-640, and it sits on z-9990 while
  // the button's highest ancestor is z-10, so it takes the tap as well as the
  // pixels. Asking a stranger to install before they have an account is the
  // wrong moment regardless.
  if (AUTH_ROUTES.has(pathname)) return null;

  if (!isMobile || hidden || !deferred || consent === null) return null;

  return (
    <div
      role="dialog"
      aria-label="Install PassAI"
      className="fixed inset-x-0 bottom-0 z-[9990] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-2xl parchment-solid border border-ghibli-moss/30 p-3 shadow-[0_-4px_24px_hsl(var(--ghibli-canopy)/0.12)]">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ghibli-mist">
          <Sprout className="size-5 text-ghibli-jungle" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-semibold leading-tight text-ghibli-canopy">
            Add PassAI to your home screen
          </p>
          <p className="m-0 text-xs leading-snug text-ghibli-bark">
            Full screen, and your garden opens offline.
          </p>
        </div>

        <button
          onClick={() => void install()}
          className="shrink-0 rounded-lg border-0 bg-gradient-to-br from-ghibli-jungle to-ghibli-canopy px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_2px_8px_hsl(var(--ghibli-canopy)/0.25)] transition-shadow hover:shadow-[0_4px_12px_hsl(var(--ghibli-canopy)/0.35)] cursor-pointer"
        >
          Add
        </button>

        <button
          onClick={dismiss}
          aria-label="Not now"
          className="shrink-0 rounded-full p-1 text-ghibli-bark hover:bg-ghibli-mist/70 transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
