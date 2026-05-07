import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { initPostHog } from "@/lib/posthog";

export function CookieConsentBanner() {
  const { consent, acceptAll, acceptEssential } = useCookieConsent();
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (consent === null) {
      setVisible(true);
    }
  }, [consent]);

  const dismiss = (action: () => void) => {
    setDismissing(true);
    action();
    setTimeout(() => setVisible(false), 350);
  };

  const handleAcceptAll = () => {
    dismiss(acceptAll);
    initPostHog();
  };

  const handleEssentialOnly = () => {
    dismiss(acceptEssential);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className={`fixed bottom-0 left-0 right-0 z-[9999] parchment-solid border-t border-ghibli-moss/30 px-6 py-5 shadow-[0_-4px_24px_hsl(var(--ghibli-canopy)/0.1)] transition-transform duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        dismissing ? "translate-y-full" : "translate-y-0"
      }`}
      style={{ borderRadius: 0 }}
    >
      <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-4">
        <p className="flex-1 min-w-[200px] text-sm text-ghibli-bark leading-relaxed m-0">
          PassAI uses essential cookies to keep you logged in and optional analytics cookies to improve the product.{" "}
          <Link to="/cookies" className="text-ghibli-jungle hover:text-ghibli-canopy font-medium">
            Learn more
          </Link>
        </p>

        <div className="flex gap-2.5 shrink-0">
          <button
            onClick={handleEssentialOnly}
            className="px-[18px] py-[9px] rounded-lg border-2 border-ghibli-moss/45 bg-transparent text-ghibli-jungle text-sm font-medium hover:bg-ghibli-mist/70 transition-colors cursor-pointer"
          >
            Essential only
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-[18px] py-[9px] rounded-lg border-0 bg-gradient-to-br from-ghibli-jungle to-ghibli-canopy text-primary-foreground text-sm font-medium shadow-[0_2px_8px_hsl(var(--ghibli-canopy)/0.25)] hover:shadow-[0_4px_12px_hsl(var(--ghibli-canopy)/0.35)] transition-shadow cursor-pointer"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
