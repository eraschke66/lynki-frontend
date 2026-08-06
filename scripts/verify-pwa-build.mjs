#!/usr/bin/env node
/**
 * Post-build checks on the generated PWA artefacts.
 *
 * The important one is the last: Workbox serialises a runtimeCaching
 * `urlPattern` callback with Function.prototype.toString(), so anything the
 * callback closed over in vite.config.ts silently becomes an undefined
 * identifier inside sw.js. Nothing about the build fails, the manifest looks
 * right, and every request then blows up with a ReferenceError at runtime.
 * So we actually run sw.js against stubs and call each matcher.
 *
 * Run: node scripts/verify-pwa-build.mjs   (chained off `npm run build`)
 */
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

// --- manifest ---------------------------------------------------------------
const manifestPath = join(DIST, "manifest.webmanifest");
check(existsSync(manifestPath), "dist/manifest.webmanifest is missing");

if (existsSync(manifestPath)) {
  const raw = readFileSync(manifestPath, "utf8");
  check(!raw.trimStart().startsWith("<"), "manifest.webmanifest is HTML, not JSON (SPA fallback?)");

  const manifest = JSON.parse(raw);
  for (const field of ["name", "short_name", "start_url", "display", "theme_color", "background_color"]) {
    check(Boolean(manifest[field]), `manifest is missing "${field}"`);
  }
  check(manifest.display === "standalone", `manifest display should be standalone, got "${manifest.display}"`);

  const icons = manifest.icons ?? [];
  check(icons.some((i) => i.sizes === "192x192"), "manifest has no 192x192 icon");
  check(icons.some((i) => i.sizes === "512x512"), "manifest has no 512x512 icon");
  check(
    icons.some((i) => (i.purpose ?? "").split(/\s+/).includes("maskable")),
    "manifest has no maskable icon"
  );

  const html = readFileSync(join(DIST, "index.html"), "utf8");
  // Deliberately requires the href: a bare `rel="manifest"` string can also
  // come from a comment, and a link with no href is not a manifest link.
  check(
    /<link[^>]+rel="manifest"[^>]+href="[^"]+"/.test(html),
    'index.html has no <link rel="manifest" href="...">',
  );
}

// --- precache weight --------------------------------------------------------
// A first visit downloads the whole precache before the app is usable offline,
// so this is a real budget, not a style rule.
const PRECACHE_BUDGET_BYTES = 6 * 1024 * 1024;

// --- service worker ---------------------------------------------------------
const swPath = join(DIST, "sw.js");
check(existsSync(swPath), "dist/sw.js is missing");

if (existsSync(swPath)) {
  const source = readFileSync(swPath, "utf8");
  check(!source.trimStart().startsWith("<"), "sw.js is HTML, not JavaScript (SPA fallback?)");

  const precached = [...source.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);
  check(precached.includes("index.html"), "the app shell (index.html) is not precached");
  check(precached.some((u) => u.endsWith(".js")), "no JS chunks are precached");
  check(precached.some((u) => u.endsWith(".css")), "no CSS is precached");
  check(!precached.some((u) => u.endsWith(".map")), "sourcemaps leaked into the precache");
  // public/ holds ~57MB of garden art, audio and video. Precaching it would
  // make the first visit download the lot before the app is usable.
  const heavy = precached.filter((u) => /\.(mp3|mp4|jpe?g)$/.test(u));
  check(heavy.length === 0, `media leaked into the precache: ${heavy.slice(0, 5).join(", ")}`);

  let precacheBytes = 0;
  for (const rel of precached) {
    const abs = join(DIST, rel);
    if (existsSync(abs)) precacheBytes += statSync(abs).size;
  }
  check(
    precacheBytes <= PRECACHE_BUDGET_BYTES,
    `precache is ${(precacheBytes / 1024 / 1024).toFixed(1)}MB, over the ` +
      `${PRECACHE_BUDGET_BYTES / 1024 / 1024}MB budget — check globPatterns`,
  );
  console.log(`  precache: ${precached.length} entries, ${(precacheBytes / 1024 / 1024).toFixed(2)}MB`);

  // Execute sw.js against stubs and call every function-style route matcher, so
  // an identifier lost during serialisation fails the build instead of the app.
  const routeMatchers = [];
  const noop = () => {};
  const workboxStub = new Proxy(
    {
      precacheAndRoute: noop,
      cleanupOutdatedCaches: noop,
      clientsClaim: noop,
      createHandlerBoundToURL: () => noop,
      registerRoute: (pattern) => { if (typeof pattern === "function") routeMatchers.push(pattern); },
    },
    {
      // Everything else (NetworkFirst, ExpirationPlugin, NavigationRoute, ...)
      // just needs to be constructible.
      get: (target, prop) => target[prop] ?? function Stub() {},
    }
  );

  const sandbox = {
    self: { addEventListener: noop, skipWaiting: noop, clients: {}, location: new URL("https://app.passai.study/") },
    define: (_deps, factory) => factory(workboxStub),
    URL,
    Promise,
    console,
  };
  sandbox.self.define = sandbox.define;

  try {
    runInContext(source, createContext(sandbox));
  } catch (err) {
    failures.push(`sw.js threw while loading: ${err.message}`);
  }

  // Any URL will do: a lost identifier throws on the first call, whatever the
  // input. These just mirror the shapes the app actually issues.
  const probes = [
    { url: new URL("https://app.passai.study/plant-stage-1.png"), sameOrigin: true },
    { url: new URL("https://lynki-backend.onrender.com/api/v1/topic-quiz/session/u/c/t"), sameOrigin: false },
    { url: new URL("https://uvvcniogunfacurkhyid.supabase.co/rest/v1/courses"), sameOrigin: false },
    { url: new URL("https://uvvcniogunfacurkhyid.supabase.co/auth/v1/user"), sameOrigin: false },
    { url: new URL("https://fonts.gstatic.com/s/fraunces/v1/font.woff2"), sameOrigin: false },
  ];

  for (const matcher of routeMatchers) {
    for (const probe of probes) {
      try {
        matcher({ ...probe, request: { method: "GET", destination: "image", url: probe.url.href }, event: {} });
      } catch (err) {
        failures.push(
          `a runtimeCaching urlPattern threw for ${probe.url.href}: ${err.message}. ` +
            `Callbacks are serialised with toString(), so they cannot reference anything ` +
            `declared outside themselves in vite.config.ts.`
        );
      }
    }
  }
}

if (failures.length) {
  console.error("\nPWA build verification failed:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error("");
  process.exit(1);
}

console.log("PWA build verified: manifest, icons, precached shell, and runtime routes all load.");
