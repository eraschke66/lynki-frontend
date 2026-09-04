import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "@/app/App";
import { initSentry } from "@/lib/sentry";
import { initPostHog } from "@/lib/posthog";
import { pingBackend } from "@/lib/backend";

initSentry();
if (localStorage.getItem("passai_cookie_consent") === "all") {
  initPostHog();
}

// Wake the Render dyno as early as possible. No-op on failure.
void pingBackend();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
