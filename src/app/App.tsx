import { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth";
import { AppRoutes } from "./routes";
import { queryClient } from "@/lib/queryClient";
import { posthog } from "@/lib/posthog";

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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
