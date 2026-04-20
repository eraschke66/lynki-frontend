import { useState } from "react";

const KEY = "passai_cookie_consent";
type Consent = "all" | "essential" | null;

export function useCookieConsent() {
  const [consent, setConsent] = useState<Consent>(
    () => localStorage.getItem(KEY) as Consent,
  );

  const acceptAll = () => {
    localStorage.setItem(KEY, "all");
    setConsent("all");
  };

  const acceptEssential = () => {
    localStorage.setItem(KEY, "essential");
    setConsent("essential");
  };

  const clearConsent = () => {
    localStorage.removeItem(KEY);
    setConsent(null);
  };

  return { consent, acceptAll, acceptEssential, clearConsent };
}
