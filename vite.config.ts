import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Build a RegExp that matches everything served from `url`'s origin.
 *
 * Workbox serialises a runtimeCaching `urlPattern` with
 * Function.prototype.toString(), so a callback that closes over anything in
 * this file becomes an undefined identifier inside sw.js — it builds clean and
 * then throws ReferenceError on every request. RegExps serialise as
 * self-contained literals, so the origin has to be baked in here.
 * `scripts/verify-pwa-build.mjs` fails the build if that rule is broken.
 */
function originPattern(url: string | undefined): RegExp | null {
  if (!url) return null;
  try {
    const { origin } = new URL(url);
    return new RegExp("^" + origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "/");
  } catch {
    return null;
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vercel supplies these via process.env; local dev via .env (gitignored).
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const backendPattern = originPattern(env.VITE_API_URL);
  const supabasePattern = originPattern(env.VITE_SUPABASE_URL);
  const supabaseAuthPattern = env.VITE_SUPABASE_URL
    ? new RegExp(originPattern(env.VITE_SUPABASE_URL)!.source.replace(/\/$/, "") + "/auth/v1/")
    : null;

  return {
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        exportType: "default",
        ref: true,
        svgo: false,
        titleProp: true,
      },
      include: "**/*.svg?react",
    }),
    tailwindcss(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG ?? "passai",
      project: "lynki-frontend",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.SENTRY_AUTH_TOKEN,
    }),
    VitePWA({
      // 'prompt', not 'autoUpdate'. autoUpdate means skipWaiting, which
      // reloads the page out from under whoever is using it — and a student is
      // usually mid-question. PWAUpdatePrompt asks instead, and re-checks for a
      // new build hourly so the offer still turns up in a long session.
      registerType: "prompt",
      injectRegister: null, // registration lives in PWAUpdatePrompt
      includeAssets: [
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-maskable-192x192.png",
        "pwa-maskable-512x512.png",
        "apple-touch-icon-180x180.png",
      ],
      manifest: {
        name: "PassAI",
        short_name: "PassAI",
        description:
          "Turn your course documents into AI-generated quizzes and watch your knowledge garden grow.",
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        // Ghibli palette: --color-ghibli-forest on --color-ghibli-cream.
        theme_color: "#215037",
        background_color: "#FBF3E0",
        categories: ["education", "productivity"],
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Code, not media. public/ holds ~57MB of garden art, loader video and
        // ambient audio; precaching that would make the first visit download
        // the whole thing before the app is usable. Those come through the
        // runtime image/media rules below, on demand. The PWA icons are pulled
        // back in explicitly via includeAssets.
        globPatterns: ["**/*.{js,css,html,svg,ico,woff,woff2}"],
        // Sentry uploads sourcemaps and then they are dead weight in the SW.
        globIgnores: ["**/*.map", "**/node_modules/**"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          // Auth is never cached. A stale session response is worse than an
          // error, and it must not outlive a sign-out.
          ...(supabaseAuthPattern
            ? [{ urlPattern: supabaseAuthPattern, handler: "NetworkOnly" as const }]
            : []),
          // Supabase reads. Workbox registers runtime routes for GET only, so
          // writes are untouched. Purged on sign-out by src/pwa/register.ts.
          ...(supabasePattern
            ? [
                {
                  urlPattern: supabasePattern,
                  handler: "NetworkFirst" as const,
                  options: {
                    cacheName: "passai-supabase",
                    networkTimeoutSeconds: 5,
                    expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 },
                    cacheableResponse: { statuses: [200] },
                  },
                },
              ]
            : []),
          // The FastAPI backend on Render, which also sleeps — a cached last
          // response is a better answer than a cold-start timeout.
          ...(backendPattern
            ? [
                {
                  urlPattern: backendPattern,
                  handler: "NetworkFirst" as const,
                  options: {
                    cacheName: "passai-backend",
                    networkTimeoutSeconds: 10,
                    expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 },
                    cacheableResponse: { statuses: [200] },
                  },
                },
              ]
            : []),
          {
            // Fraunces is loaded from Google Fonts in index.html. Without this
            // the offline app falls back to a system serif and every screen
            // shifts.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-files",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Garden art, on demand. Bounded so the cache can't grow to the
            // full 57MB of public/.
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin && (request.destination === "image" || request.destination === "font"),
            handler: "CacheFirst",
            options: {
              cacheName: "passai-media",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Off so `npm run dev` keeps normal HMR. Flip on to exercise the SW.
        enabled: false,
        type: "module",
      },
    }),
  ],
  build: {
    sourcemap: true,
    // Routes are React.lazy'd in src/app/routes.tsx, which already yields a
    // chunk per screen. These manual boundaries pin the heavy vendor libs so a
    // future static import can't quietly hoist them back into the entry.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Rollup's virtual CommonJS interop helpers live outside
          // node_modules, so they fall through the guard below and get parked
          // in whichever vendor chunk needs them first — which then becomes a
          // hard dependency of the entry. Pin them explicitly.
          if (id.includes("commonjsHelpers") || id.includes("commonjs-dynamic-modules")) {
            return "vendor-utils";
          }

          if (!id.includes("node_modules")) return;

          // MUST stay first. Rollup hoists a shared dependency into whichever
          // manual chunk claims it first, so if a heavy lib claimed
          // react/react-dom, every chunk would transitively import that lib and
          // it would land on the critical path. React is eager by design —
          // first paint needs it.
          if (
            /node_modules\/(react|react-dom|scheduler|react-is)\//.test(id) ||
            id.includes("react-router")
          ) {
            return "vendor-react";
          }

          // Same hoisting hazard, via cn() -> clsx + tailwind-merge. Tiny, so
          // loading them eagerly costs nothing.
          if (
            /node_modules\/(clsx|tailwind-merge|class-variance-authority)\//.test(id)
          ) {
            return "vendor-utils";
          }

          // Markdown rendering — only the study plan renders markdown.
          if (
            id.includes("react-markdown") ||
            id.includes("remark-") ||
            id.includes("rehype-") ||
            id.includes("micromark") ||
            id.includes("mdast-") ||
            id.includes("hast-") ||
            id.includes("unist-") ||
            id.includes("unified")
          ) {
            return "vendor-markdown";
          }

          // Observability. Needed app-wide, but split out so it is visible in
          // the build output rather than hidden inside the entry.
          if (id.includes("@sentry")) return "vendor-sentry";
          if (id.includes("posthog")) return "vendor-posthog";

          if (id.includes("@supabase")) return "vendor-supabase";

          // Everything else is left to Rollup's default chunking.
          return;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
