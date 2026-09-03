import { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
// Direct path, not the "@/features/auth" barrel: the barrel re-exports every
// auth screen, which would pull them all back into the entry chunk.
import { AuthProvider } from "@/features/auth/hooks/useAuth";
import { AppRoutes } from "./routes";
import { queryClient } from "@/lib/queryClient";
import { posthog } from "@/lib/posthog";
import { Sentry } from "@/lib/sentry";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { Footer } from "@/components/layout/Footer";
import { initPwa } from "@/pwa/register";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineStatus } from "@/components/pwa/OfflineStatus";
import { Toaster } from "@/components/ui/sonner";

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    posthog.capture("$pageview");
  }, [location.pathname]);
  return null;
}

export default function App() {
  // Clears user-scoped caches on sign-out. Service worker registration itself
  // happens in PWAUpdatePrompt.
  useEffect(() => initPwa(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PageViewTracker />
        <AuthProvider>
          <Sentry.ErrorBoundary fallback={<p>Something went wrong.</p>}>
            <div className="flex flex-col min-h-screen">
              <AppRoutes />
              <Footer />
            </div>
            <CookieConsentBanner />
            <OfflineStatus />
            <InstallPrompt />
            <PWAUpdatePrompt />
            <Toaster />
          </Sentry.ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
