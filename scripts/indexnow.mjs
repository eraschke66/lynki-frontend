// Tell IndexNow the public pages changed, so Bing (and the answer engines that
// read its index) recrawl without waiting to be asked.
//
// PRODUCTION ONLY. Vercel sets VERCEL_ENV, and a preview or a local build must
// never submit: the URLs it would name belong to www.passai.study, so a preview
// ping would claim the live pages changed when they had not.
//
// Runs after the build, from the build script. Vercel has no real post-deploy
// hook, and for an established site that is fine: every URL submitted is already
// live and serving the previous version, and IndexNow is a "come and look"
// signal rather than a content upload. The first ping after this ships is the
// one that matters, since it is the first time the prerendered pages exist.
//
// Never fails the build. A search engine declining a hint is not a deploy
// problem, and an exit code here would block a good deployment.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "www.passai.study";
const ORIGIN = `https://${HOST}`;

function log(...a) {
  console.log("[indexnow]", ...a);
}

if (process.env.VERCEL_ENV !== "production") {
  log(`skipped (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}, only production submits)`);
  process.exit(0);
}

try {
  // The key file must be reachable at ORIGIN/<key>.txt and contain exactly the
  // key. It lives in public/ so the build copies it to the site root; reading
  // the name back from there is what keeps the two in sync.
  const keyFiles = readdirSync(join(ROOT, "public")).filter((f) =>
    /^[a-f0-9]{8,128}\.txt$/.test(f),
  );
  if (keyFiles.length !== 1) {
    log(`skipped: expected exactly one IndexNow key file in public/, found ${keyFiles.length}`);
    process.exit(0);
  }
  const keyFile = keyFiles[0];
  const key = readFileSync(join(ROOT, "public", keyFile), "utf8").trim();
  if (keyFile !== `${key}.txt`) {
    log(`skipped: ${keyFile} does not contain its own key`);
    process.exit(0);
  }

  // Submit exactly what the sitemap lists, so the two can never disagree.
  const sitemap = readFileSync(join(ROOT, "public", "sitemap.xml"), "utf8");
  const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (!urlList.length) {
    log("skipped: no <loc> entries in public/sitemap.xml");
    process.exit(0);
  }

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key, keyLocation: `${ORIGIN}/${keyFile}`, urlList }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.text().catch(() => "");
  // 200 and 202 both mean accepted. 403 means the key file did not validate,
  // which on a first deploy usually means it is not live at the root yet.
  log(`submitted ${urlList.length} urls -> HTTP ${res.status} ${res.statusText}${body ? ` ${body.slice(0, 300)}` : ""}`);
} catch (err) {
  log("ping failed, continuing:", err instanceof Error ? err.message : String(err));
}
