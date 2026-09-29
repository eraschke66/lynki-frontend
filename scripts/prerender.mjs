// Build-time prerender for the five PUBLIC routes.
//
// Why this shape, rather than vite-react-ssg or a headless browser:
// the app is client-rendered through createRoot(), and the public pages sit
// behind AuthContext and the Supabase client. Importing them on the server to
// renderToString would drag the whole app graph (and localStorage/window) into
// the build. This script instead writes a static shell per route and touches no
// application code at all, so auth, Stripe, the quiz engine and the Growth
// Garden are provably unaffected.
//
// Nothing changes for a human visitor. React 18's createRoot() CLEARS the
// container on first render, so the markup written into #root below is replaced
// the moment the bundle mounts. It is never hydrated against, so it cannot
// produce a hydration mismatch. What it does change is the first paint for a
// crawler, a social unfurler or anything that does not run JavaScript: today
// they get seven words, after this they get the real page.
//
// Only / /pricing /privacy /terms /cookies are listed here. app.passai.study and
// every logged-in route keep their noindex headers from vercel.json and are not
// prerendered. robots.txt and sitemap.xml are static files in public/ and are
// copied to dist/ by Vite untouched.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const ORIGIN = "https://www.passai.study";
const OG_IMAGE = `${ORIGIN}/og-passai.png`;

// Google truncates around 60 characters of title and 160 of description, and a
// description under about 110 tends to get rewritten. Enforced below, so a copy
// edit that breaks the rule fails the build instead of shipping quietly.
const TITLE_MIN = 50, TITLE_MAX = 60;
const DESC_MIN = 110, DESC_MAX = 160;

const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${ORIGIN}/#organization`,
  name: "PassAI",
  url: `${ORIGIN}/`,
  logo: `${ORIGIN}/pwa-512x512.png`,
  parentOrganization: { "@type": "Organization", name: "Shryn, Inc." },
};

const WEBSITE = {
  "@type": "WebSite",
  "@id": `${ORIGIN}/#website`,
  url: `${ORIGIN}/`,
  name: "PassAI",
  publisher: { "@id": `${ORIGIN}/#organization` },
};

// Every string below is taken from the page it describes. No claim is made here
// that the live page does not already make.
const ROUTES = [
  {
    path: "/",
    out: "index.html",
    title: "PassAI | Turn your course materials into practice quizzes",
    description:
      "Upload your notes, slides and readings and PassAI quizzes you on them, finds your weak topics and plans your study to exam day. Built by an IB teacher.",
    h1: "Find your gaps. Walk into the exam ready.",
    body: [
      "PassAI analyzes your own course material, tests your real understanding, and shows which topics need attention before exam day.",
      "Upload one document. Take your first quiz. See what needs work.",
      "Set your exam date and target grade, then follow a study plan shaped by your progress.",
      "PassAI was shaped by more than 30 years of teaching experience across American and European educational systems, including the International Baccalaureate.",
      "The whole garden, free for 7 days. No credit card. After that it is $9.99/month or $79.99/year.",
    ],
    jsonLd: { "@context": "https://schema.org", "@graph": [ORGANIZATION, WEBSITE] },
  },
  {
    path: "/pricing",
    out: "pricing/index.html",
    title: "PassAI pricing | Try the whole garden free for 7 days",
    description:
      "Every new PassAI account starts with full Pass Pro access and no credit card. Keep it for $9.99 a month or $79.99 a year when the week is up.",
    h1: "Try the whole garden free for 7 days",
    body: [
      "Every new account starts with full Pass Pro access, with no credit card. Keep it for $9.99/month or $79.99/year when the week is up.",
      "7-day free trial: $0 for the first 7 days. No credit card required.",
      "No card needed to start. Subscribe any time during your 7 days and your first charge comes when the free week ends.",
      "Pass Pro: $9.99 per month, or $79.99 per year, which is about $6.67 a month and saves 33 percent.",
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "PassAI",
      url: `${ORIGIN}/`,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      publisher: { "@type": "Organization", name: "Shryn, Inc." },
      offers: [
        {
          "@type": "Offer",
          price: "9.99",
          priceCurrency: "USD",
          category: "subscription",
          name: "Pass Pro monthly",
          url: `${ORIGIN}/pricing`,
        },
        {
          "@type": "Offer",
          price: "79.99",
          priceCurrency: "USD",
          category: "subscription",
          name: "Pass Pro yearly",
          url: `${ORIGIN}/pricing`,
        },
      ],
    },
  },
  {
    path: "/privacy",
    out: "privacy/index.html",
    title: "Privacy Policy | How PassAI handles your study data",
    description:
      "How PassAI collects, uses and stores your account details, the documents you upload and your quiz answers. Operated by Shryn, Inc.",
    h1: "Privacy Policy",
    body: [
      "PassAI, operated by Shryn, Inc. Last updated April 14, 2026.",
      "PassAI is an AI-powered study tool operated by Shryn, Inc. Our website is located at www.passai.study.",
      "Information you provide directly: your email address and name when you create an account, documents you upload (PDFs, notes, slides, text) for quiz generation, your answers to quizzes, and your curriculum type, exam board and exam date.",
    ],
  },
  {
    path: "/terms",
    out: "terms/index.html",
    title: "Terms of Service | Your PassAI account and the rules",
    description:
      "The terms for using PassAI: account rules, the minimum age of 13, what the service does with your uploads, and how accounts can be suspended.",
    h1: "Terms of Service",
    body: [
      "PassAI, operated by Shryn, Inc. Last updated April 14, 2026.",
      "By creating an account or using PassAI, you agree to these Terms of Service. If you do not agree, do not use the Service.",
      "You must be at least 13 years old to use PassAI. If you are between 13 and 18, you confirm that you have permission from a parent or guardian to use the Service.",
      "PassAI is an AI-powered study tool that generates quizzes from your uploaded materials, tracks your knowledge mastery, estimates your probability of passing your exam, and generates study plans.",
    ],
  },
  {
    path: "/cookies",
    out: "cookies/index.html",
    title: "Cookie Policy | Essential and analytics cookies on PassAI",
    description:
      "Which cookies PassAI sets, the Supabase ones that keep you logged in, and the analytics cookies you can opt into or refuse. Operated by Shryn, Inc.",
    h1: "Cookie Policy",
    body: [
      "PassAI, operated by Shryn, Inc. Last updated April 14, 2026.",
      "Cookies are small text files stored on your device when you visit a website. They help the site function properly and can provide information about how you use the site.",
      "Essential cookies are always active and are required for PassAI to work. Supabase authentication keeps you logged in and refreshes your session.",
      "Analytics cookies are opt-in only.",
    ],
  },
];

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// JSON-LD goes inside a <script>, so the only character that can break out is
// "<". Escaping it keeps the payload valid JSON to a parser.
const escLd = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

function head(r) {
  const canonical = `${ORIGIN}${r.path}`;
  const tags = [
    `<title>${esc(r.title)}</title>`,
    `<meta name="description" content="${esc(r.description)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:site_name" content="PassAI">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(r.title)}">`,
    `<meta property="og:description" content="${esc(r.description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(r.title)}">`,
    `<meta name="twitter:description" content="${esc(r.description)}">`,
    `<meta name="twitter:image" content="${OG_IMAGE}">`,
  ];
  if (r.jsonLd) tags.push(`<script type="application/ld+json">${escLd(r.jsonLd)}</script>`);
  return tags.join("\n    ");
}

// Styled to the brand so the pre-hydration frame reads as the page loading
// rather than as a broken document. It is visible only until the bundle mounts,
// where today the visitor sees an empty page instead.
function body(r) {
  const paras = r.body.map((p) => `<p>${esc(p)}</p>`).join("\n        ");
  return `
      <div id="prerender" style="max-width:46rem;margin:0 auto;padding:4rem 1.5rem;font-family:Georgia,'Times New Roman',serif;color:#215037;line-height:1.6">
        <h1 style="font-size:2rem;font-weight:600;line-height:1.15;margin:0 0 1rem">${esc(r.h1)}</h1>
        ${paras}
      </div>`;
}

const template = readFileSync(join(DIST, "index.html"), "utf8");

if (!/<div id="root"><\/div>/.test(template)) {
  throw new Error('prerender: dist/index.html has no empty <div id="root"></div> to fill');
}

const problems = [];
for (const r of ROUTES) {
  if (r.title.length < TITLE_MIN || r.title.length > TITLE_MAX)
    problems.push(`${r.path}: title is ${r.title.length} chars, needs ${TITLE_MIN} to ${TITLE_MAX}`);
  if (r.description.length < DESC_MIN || r.description.length > DESC_MAX)
    problems.push(`${r.path}: description is ${r.description.length} chars, needs ${DESC_MIN} to ${DESC_MAX}`);
  // House copy rule: no em dashes, no en dashes.
  for (const [field, v] of [["title", r.title], ["description", r.description], ["h1", r.h1], ["body", r.body.join(" ")]])
    if (/[–—]/.test(v)) problems.push(`${r.path}: ${field} contains an em or en dash`);
}
if (problems.length) {
  console.error("prerender failed:\n  " + problems.join("\n  "));
  process.exit(1);
}

for (const r of ROUTES) {
  let html = template;
  // Replace Vite's single static <title>, then add the rest of the head.
  html = html.replace(/<title>[\s\S]*?<\/title>/, "__TITLE_SLOT__");
  html = html.replace("__TITLE_SLOT__", head(r));
  html = html.replace('<div id="root"></div>', `<div id="root">${body(r)}\n    </div>`);

  const dest = join(DIST, r.out);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html, "utf8");
  console.log(`prerendered ${r.path.padEnd(9)} -> dist/${r.out}  (title ${r.title.length}, desc ${r.description.length})`);
}

// dist/app.html is the SPA fallback: Vite builds it from the root app.html
// entry, vercel.json rewrites every path with no file on disk to it, and the
// service worker precaches it as navigateFallback. It must stay free of
// prerendered content, and its asset tags must match index.html's, or returning
// visitors would boot a stale bundle on every app route.
const appHtml = readFileSync(join(DIST, "app.html"), "utf8");
if (appHtml.includes('id="prerender"')) {
  throw new Error("prerender: dist/app.html must stay a pristine shell");
}
const assetsOf = (h) => [...h.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]).sort().join(",");
if (assetsOf(appHtml) !== assetsOf(template)) {
  throw new Error(
    "prerender: app.html and index.html reference different build assets.\n" +
      "  Their <head> has drifted. Copy index.html's head into app.html.",
  );
}
console.log("dist/app.html verified (SPA fallback, pristine, assets in sync)");

for (const f of ["robots.txt", "sitemap.xml"]) {
  if (!existsSync(join(DIST, f))) throw new Error(`prerender: dist/${f} is missing after build`);
}
console.log("prerender: robots.txt and sitemap.xml present");
