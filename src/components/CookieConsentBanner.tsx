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
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: dismissing ? "translateY(100%)" : "translateY(0)",
        transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        background: "white",
        boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.1)",
        borderTop: "1px solid rgba(64, 145, 108, 0.15)",
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 16,
        }}
      >
        <p style={{ flex: 1, minWidth: 200, fontSize: 14, color: "#374151", lineHeight: 1.5, margin: 0 }}>
          PassAI uses essential cookies to keep you logged in and optional analytics cookies to improve the product.{" "}
          <Link to="/cookies" style={{ color: "#2D6A4F", fontWeight: 500, textDecoration: "none" }}>
            Learn more
          </Link>
        </p>

        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button
            onClick={handleEssentialOnly}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "1.5px solid rgba(64, 145, 108, 0.4)",
              background: "transparent",
              color: "#2D6A4F",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(64,145,108,0.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            Essential only
          </button>
          <button
            onClick={handleAcceptAll}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)",
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(27,67,50,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(27,67,50,0.25)";
            }}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
