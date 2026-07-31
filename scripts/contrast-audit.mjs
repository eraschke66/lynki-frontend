#!/usr/bin/env node
/**
 * WCAG contrast audit for the Knowledge Garden (ghibli-*) palette.
 *
 * Reads the token definitions straight out of src/index.css, then:
 *   1. prints the full text-on-surface ratio matrix
 *   2. scans src/ for className strings that pair a bg-ghibli-* with a
 *      text-ghibli-* and flags any shipped pairing below threshold
 *
 * AA thresholds: 4.5 normal body text, 3.0 large text (>=24px, or >=18.66px bold) and UI.
 *
 * Usage: node scripts/contrast-audit.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// ---------- color math ----------
function hslToRgb(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255))
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

function luminance([r, g, b]) {
  const c = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

function ratio(fg, bg) {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

/** Composite a translucent foreground over an opaque background (alpha tokens). */
function over(fg, bg, alpha) {
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)))
}

// ---------- token extraction ----------
const css = readFileSync(join(ROOT, 'src/index.css'), 'utf8')

/** solid tokens: --color-ghibli-NAME: hsl(H S% L%)  |  #hex */
const SOLID = {}
for (const m of css.matchAll(/--color-ghibli-([a-z-]+):\s*hsl\((\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\)/g)) {
  SOLID[m[1]] = hslToRgb(+m[2], +m[3], +m[4])
}
for (const m of css.matchAll(/--color-ghibli-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) {
  SOLID[m[1]] = hexToRgb(m[2])
}

/** alpha tokens: --color-ghibli-NAME-SUFFIX: hsl(var(--ghibli-BASE) / 0.NN) */
const ALPHA = {}
for (const m of css.matchAll(/--color-ghibli-([a-z-]+):\s*hsl\(var\(--ghibli-([a-z-]+)\)\s*\/\s*([\d.]+)\)/g)) {
  ALPHA[m[1]] = { base: m[2], alpha: +m[3] }
}

// Non-ghibli tokens that still carry text (shadcn destructive).
for (const m of css.matchAll(/--destructive:\s*hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/g)) {
  SOLID.destructive ??= hslToRgb(+m[1], +m[2], +m[3])
}

// Surfaces text actually lands on in this app.
const SURFACES = ['parchment', 'cream', 'ivory', 'mist', 'gold', 'sunlight', 'coral', 'petal', 'teal']
// Dark surfaces (buttons, hero tiles) — checked separately for white/light text.
const DARK_SURFACES = ['canopy', 'forest', 'jungle', 'bark', 'moss', 'teal', 'destructive']
// Foregrounds used for words.
const FOREGROUNDS = ['bark', 'forest', 'canopy', 'jungle', 'moss', 'gold', 'coral', 'coral-deep', 'teal', 'white']

/**
 * Tinted surfaces: `bg-ghibli-X/NN` composited over the page. These are real
 * backgrounds text sits on, but sections 3 and 4 only see them when the tint
 * and the text token share one className string — the wrong-answer row puts
 * them on sibling elements, so it is checked here instead.
 */
const TINTED = [
  { label: 'petal/15 (wrong-answer row)', base: 'petal', alpha: 0.15, fgs: ['coral-deep', 'bark', 'canopy'] },
]

const WHITE = [255, 255, 255]
function resolve(name, bgRgb) {
  if (name === 'white') return WHITE
  if (SOLID[name]) return SOLID[name]
  if (ALPHA[name]) {
    const base = SOLID[ALPHA[name].base]
    if (!base || !bgRgb) return null
    return over(base, bgRgb, ALPHA[name].alpha)
  }
  return null
}

const BODY = 4.5
const LARGE = 3.0
const fmt = (n) => n.toFixed(2)
const pad = (s, w) => String(s).padEnd(w)

// ---------- 1. matrix ----------
console.log('\n=== text-on-surface contrast matrix (solid tokens) ===')
const w = 14
console.log(pad('text \\ bg', w) + SURFACES.map((s) => pad(s, 11)).join(''))
for (const fg of FOREGROUNDS) {
  const row = SURFACES.map((bg) => {
    const f = resolve(fg, SOLID[bg])
    if (!f || !SOLID[bg]) return pad('-', 11)
    const r = ratio(f, SOLID[bg])
    const mark = r >= BODY ? ' ' : r >= LARGE ? '~' : '!'
    return pad(fmt(r) + mark, 11)
  })
  console.log(pad(fg, w) + row.join(''))
}
console.log('  (blank = passes AA body 4.5   ~ = large/UI only (>=3.0)   ! = fails 3.0)')

console.log('\n=== light text on dark surfaces ===')
console.log(pad('text \\ bg', w) + DARK_SURFACES.map((s) => pad(s, 11)).join(''))
for (const fg of ['white', 'ivory', 'cream', 'mist', 'sunlight', 'gold', 'parchment']) {
  const row = DARK_SURFACES.map((bg) => {
    const f = resolve(fg, SOLID[bg])
    if (!f || !SOLID[bg]) return pad('-', 11)
    const r = ratio(f, SOLID[bg])
    const mark = r >= BODY ? ' ' : r >= LARGE ? '~' : '!'
    return pad(fmt(r) + mark, 11)
  })
  console.log(pad(fg, w) + row.join(''))
}

// ---------- 2. alpha variants ----------
console.log('\n=== opacity variants, composited on each surface ===')
console.log(pad('token \\ bg', 24) + SURFACES.slice(0, 6).map((s) => pad(s, 11)).join(''))
for (const name of Object.keys(ALPHA).sort()) {
  const row = SURFACES.slice(0, 6).map((bg) => {
    const f = resolve(name, SOLID[bg])
    if (!f) return pad('-', 11)
    const r = ratio(f, SOLID[bg])
    const mark = r >= BODY ? ' ' : r >= LARGE ? '~' : '!'
    return pad(fmt(r) + mark, 11)
  })
  console.log(pad(name, 24) + row.join(''))
}

// ---------- 2b. tinted surfaces ----------
const PAGE = SOLID.parchment // default page surface when no bg is co-located
const label = (t) => (t === 'white' ? 'text-white' : `text-ghibli-${t}`)

console.log('\n=== text on tinted surfaces (tint composited over parchment) ===')
let tintedFails = 0
for (const { label: name, base, alpha, fgs } of TINTED) {
  const bg = over(SOLID[base], PAGE, alpha)
  for (const fg of fgs) {
    const f = resolve(fg, bg)
    if (!f) continue
    const r = ratio(f, bg)
    const mark = r >= BODY ? 'ok  ' : 'FAIL'
    if (r < BODY) tintedFails++
    console.log(`  ${mark} ${fmt(r).padStart(5)}  ${label(fg)} on ${name}`)
  }
}

// ---------- 3. shipped pairings ----------

/**
 * Known-good pairings the static scan can't judge, keyed `file::text-token`.
 * Each entry is a deliberate exemption with the reason it does not owe 4.5.
 * Keep this list short — if it grows, the palette is the problem, not the scan.
 */
const EXEMPT = {
  // Decorative graphics: convey nothing on their own.
  'src/features/test/components/TestPage.tsx::bark-ghost': 'decorative wavy divider (SVG stroke)',
  'src/features/topic-quiz/components/TopicQuizSession.tsx::bark-ghost': 'decorative wavy divider (SVG stroke)',
  'src/features/admin/components/StudentOutcomes.tsx::mist': 'chart gridline stroke, not text',
  'src/features/auth/components/LandingPage.tsx::gold': 'decorative bullet icon beside its own label',
  // Genuinely disabled control, paired with pointer-events-none.
  'src/features/documents/components/FileUploader.tsx::bark-disabled': 'disabled uploader state',
  // UI graphic: 3.0 threshold, not 4.5.
  'src/features/courses/components/CourseDetailPage.tsx::jungle': 'status icon (UI graphic), 4.46 clears the 3.0 bar',
  // Backgrounds the static scan cannot resolve — all verified dark by hand.
  'src/components/ui/badge.tsx::white': 'bg-destructive, white on destructive = 4.80',
  'src/components/ui/button.tsx::white': 'bg-destructive, white on destructive = 4.80',
  'src/components/layout/Header.tsx::sunlight': 'logo mark on jungle->canopy gradient tile',
  'src/features/courses/components/CourseDetailPage.tsx::white': 'over video + canopy/20 scrim + text-shadow-hero',
  'src/features/dashboard/components/Dashboard.tsx::white': 'over video + canopy/20 scrim + text-shadow-hero',
  'src/features/dashboard/components/UploadModal.tsx::white': 'jungle->canopy gradient button, white on jungle = 7.06',
}
const exemptFor = (file, token) => EXEMPT[`${file}::${token}`]

/** Resolve a bg-ghibli-token, honouring a /NN opacity modifier by compositing over the page. */
function resolveBg(name, alphaPct) {
  const base = SOLID[name] ?? resolve(name, PAGE)
  if (!base) return null
  if (alphaPct == null) return base
  return over(base, PAGE, alphaPct / 100)
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(tsx|ts|jsx|js|html)$/.test(p)) out.push(p)
  }
  return out
}

const files = walk(join(ROOT, 'src'))
const BG_RE = /\bbg-ghibli-([a-z-]+?)(?:\/(\d+))?(?=[\s"'`]|$)/g
const FG_RE = /\btext-ghibli-([a-z-]+?)(?:\/(\d+))?(?=[\s"'`]|$)/g

console.log('\n=== shipped bg+text pairings found in one className string ===')
console.log('    (bg-X/NN treated as an NN% tint composited over parchment)')
let failures = 0
let checked = 0
const unpaired = new Map()
const exempted = []

for (const file of files) {
  const rel = file.replace(ROOT + '/', '')
  const src = readFileSync(file, 'utf8')
  src.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/["'`]([^"'`]*)["'`]/g)) {
      const chunk = m[1]
      const bgs = [...chunk.matchAll(BG_RE)].map((x) => ({ name: x[1], a: x[2] ? +x[2] : null }))
      const fgs = [...chunk.matchAll(FG_RE)].map((x) => x[1])
      if (/\btext-white\b/.test(chunk)) fgs.push('white')

      if (!bgs.length) {
        // text sitting on the page surface
        for (const fg of fgs) {
          if (!unpaired.has(fg)) unpaired.set(fg, [])
          unpaired.get(fg).push(`${rel}:${i + 1}`)
        }
        continue
      }
      for (const bg of bgs) {
        const bgRgb = resolveBg(bg.name, bg.a)
        if (!bgRgb) continue
        for (const fg of fgs) {
          const f = resolve(fg, bgRgb)
          if (!f) continue
          checked++
          const r = ratio(f, bgRgb)
          if (r >= BODY) continue
          const bgLabel = `bg-ghibli-${bg.name}${bg.a ? '/' + bg.a : ''}`
          const why = exemptFor(rel, fg)
          if (why) {
            exempted.push(`  ${fmt(r).padStart(5)}  ${label(fg)} on ${bgLabel}  ${rel}:${i + 1}  — ${why}`)
            continue
          }
          failures++
          const level = r >= LARGE ? 'large-only' : 'FAIL'
          console.log(`  ${level.padEnd(10)} ${fmt(r).padStart(5)}  ${label(fg)} on ${bgLabel}  ${rel}:${i + 1}`)
        }
      }
    }
  })
}
console.log(`\n  ${checked} co-located pairings checked, ${failures} unexplained below ${BODY}.`)

// ---------- 4. text with no co-located bg: assumed on the page surface ----------
console.log('\n=== text tokens with no co-located bg (assumed on parchment) ===')
let unpairedFails = 0
for (const [fg, hits] of [...unpaired].sort((a, b) => b[1].length - a[1].length)) {
  const f = resolve(fg, PAGE)
  if (!f) continue
  const r = ratio(f, PAGE)
  if (r >= BODY) continue
  const live = hits.filter((h) => !exemptFor(h.split(':')[0], fg))
  for (const h of hits) {
    const why = exemptFor(h.split(':')[0], fg)
    if (why) exempted.push(`  ${fmt(r).padStart(5)}  ${label(fg)} on parchment  ${h}  — ${why}`)
  }
  if (!live.length) continue
  unpairedFails += live.length
  const level = r >= LARGE ? 'large-only' : 'FAIL'
  console.log(`  ${level.padEnd(10)} ${fmt(r).padStart(5)}  ${label(fg)}  x${live.length}`)
  for (const h of live.slice(0, 6)) console.log(`               ${h}`)
  if (live.length > 6) console.log(`               ... +${live.length - 6} more`)
}
console.log(`\n  ${unpairedFails} unexplained on-page text usages below ${BODY}.`)

// ---------- 5. documented exemptions ----------
console.log(`\n=== documented exemptions (${exempted.length}) ===`)
for (const e of exempted.sort()) console.log(e)

const total = failures + unpairedFails + tintedFails
console.log(`\n${total === 0 ? 'PASS' : 'FAIL'} — ${total} readable text pairing(s) below AA.`)
process.exit(total ? 1 : 0)
