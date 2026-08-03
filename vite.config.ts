import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
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
});
