#!/usr/bin/env node
/**
 * elements-adopt.mjs — prescription generator for the element layer.
 *
 * The rollout has three adoption shapes and telling them apart by hand does not
 * scale across ~40 sites. This probes a live URL and prints exactly which shape
 * it is and what to paste.
 *
 *   node scripts/elements-adopt.mjs https://khatm.bhd.om
 *   node scripts/elements-adopt.mjs --file sites.txt --json
 *
 * Verdicts:
 *   DONE        elements.css already loads
 *   ONE-LINE    --primary resolves; add one <link> and stop
 *   ALIAS       tokens exist but under other names; needs a mapping
 *   CONTRACT    no semantic tokens at all; needs contract.css or an alias
 *
 * It never edits anything. It is a diagnostic, so it is safe to run against
 * production as often as you like.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

let chromium;
for (const base of [import.meta.url, `file://${process.cwd()}/`, `file://${process.env.HOME}/claude/`]) {
  try {
    ({ chromium } = createRequire(base)("playwright"));
    break;
  } catch {
    /* try the next root */
  }
}
if (!chromium) {
  console.error("needs playwright: run from a directory that has it, or npm i -D playwright");
  process.exit(2);
}

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const fileIdx = args.indexOf("--file");
let targets = args.filter((a) => !a.startsWith("--"));

if (fileIdx !== -1) {
  const file = args[fileIdx + 1];
  targets = readFileSync(file, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

if (targets.length === 0) {
  console.error("usage: elements-adopt.mjs <url...> | --file <list> [--json]");
  process.exit(2);
}

const norm = (u) => (u.startsWith("http") ? u : `https://${u.replace(/^\/+/, "")}`);

const PROPS = [
  "--primary",
  "--primary-foreground",
  "--background",
  "--foreground",
  "--border",
  "--muted",
  "--muted-foreground",
  "--radius",
];

const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.route("**/*", (r) => {
  const t = r.request().resourceType();
  if (t === "image" || t === "media" || t === "font") return r.abort();
  return r.continue();
});

const results = [];

for (const raw of targets) {
  const url = norm(raw);
  const page = await ctx.newPage();
  const row = { url, verdict: "UNREACHABLE" };
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    row.http = response ? response.status() : 0;

    // A non-2xx page is NOT the site. This estate has five subdomains behind
    // basic auth that all serve the same styled 401 page, and an earlier version
    // of this tool happily read that error page's palette and reported it as the
    // brand — which then got mistaken for a shared template. Measure nothing
    // from a page we were not actually allowed to see.
    if (row.http < 200 || row.http >= 300) {
      row.verdict = row.http === 401 || row.http === 403 ? "PROTECTED" : `HTTP_${row.http}`;
      await page.close();
      results.push(row);
      if (!asJson) console.log(`${url.padEnd(42)} ${row.verdict.padEnd(11)} HTTP ${row.http} — not measurable, needs credentials or is not public`);
      continue;
    }

    row.data = await page.evaluate((props) => {
      const cs = getComputedStyle(document.documentElement);
      const tokens = {};
      for (const p of props) tokens[p] = cs.getPropertyValue(p).trim();
      const themeColor =
        document.querySelector('meta[name="theme-color"]')?.getAttribute("content") || "";
      // Colours the page actually painted with, for choosing a --primary.
      const hexes = {};
      const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
      const scan = [document.body, ...document.querySelectorAll("header, nav, button, a, .btn, .button")];
      for (const el of scan.slice(0, 40)) {
        if (!el) continue;
        const s = getComputedStyle(el);
        for (const v of [s.backgroundColor, s.color, s.borderTopColor]) {
          const rgb = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (!rgb) continue;
          const [r, g, b] = rgb.slice(1).map(Number);
          if (r + g + b > 720 || r + g + b < 60) continue; // skip white/near-black
          const h = `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
          if (isHex.test(h)) hexes[h] = (hexes[h] || 0) + 1;
        }
      }
      const top = Object.entries(hexes).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([h]) => h);
      return {
        tokens,
        themeColor,
        palette: top,
        elements: [...document.styleSheets].some((s) => (s.href || "").includes("elements.css")),
        contract: [...document.styleSheets].some((s) => (s.href || "").includes("contract.css")),
      };
    }, PROPS);

    const { tokens, elements, themeColor, palette } = row.data;
    if (elements) row.verdict = "DONE";
    else if (tokens["--primary"]) row.verdict = "ONE-LINE";
    else row.verdict = "--radius" in tokens && tokens["--radius"] ? "ALIAS" : "CONTRACT";
    row.themeColor = themeColor;
    row.palette = palette;
    row.tokens = Object.fromEntries(Object.entries(tokens).filter(([, v]) => v));
  } catch (e) {
    row.error = String(e).slice(0, 90);
  }
  await page.close();
  results.push(row);

  if (!asJson) {
    const filled = Object.entries(row.tokens || {}).filter(([, v]) => v);
    console.log(`${row.url.padEnd(42)} ${row.verdict.padEnd(11)} ${row.http ?? ''} tokens:${filled.length}/${PROPS.length}` +
      (row.themeColor ? `  theme:${row.themeColor}` : "") +
      (row.palette?.length ? `  painted:${row.palette.join(",")}` : ""));
    if (row.verdict === "ONE-LINE") {
      console.log(`    -> add: <link rel="stylesheet" href="https://design.bhd.om/elements.css?v=1">`);
    } else if (row.verdict === "ALIAS" || row.verdict === "CONTRACT") {
      console.log(`    -> needs a contract; candidate primary ${row.themeColor || row.palette?.[0] || "(inspect by hand)"}`);
    }
  }
}

await browser.close();

if (asJson) console.log(JSON.stringify(results, null, 2));

const counts = results.reduce((a, r) => ((a[r.verdict] = (a[r.verdict] || 0) + 1), a), {});
console.log(`\nSUMMARY ${JSON.stringify(counts)}`);
