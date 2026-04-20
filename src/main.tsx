import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "@/app/App";
import { initSentry } from "@/lib/sentry";
import { initPostHog } from "@/lib/posthog";

initSentry();
if (localStorage.getItem("passai_cookie_consent") === "all") {
  initPostHog();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
