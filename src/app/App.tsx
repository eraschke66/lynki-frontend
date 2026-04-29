import { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth";
import { AppRoutes } from "./routes";
import { queryClient } from "@/lib/queryClient";
import { posthog } from "@/lib/posthog";
import { Sentry } from "@/lib/sentry";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { Footer } from "@/components/layout/Footer";

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    posthog.capture("$pageview");
  }, [location.pathname]);
  return null;
}

export default function App() {
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
          </Sentry.ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
