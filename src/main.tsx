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

// Wake the Render dyno as early as possible. No-op on failure.
// Strips trailing /api/v1 because the FastAPI root is the only 200 route
// today. Replace with /api/v1/health once Peter adds it.
const apiBase = (import.meta.env.VITE_API_URL ?? "")
  .replace(/\/api\/v\d+\/?$/, "")
  .replace(/\/$/, "");
if (apiBase) {
  fetch(apiBase + "/", { method: "GET", cache: "no-store" }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
