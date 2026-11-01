#!/usr/bin/env node
// Licence tripwire for the public design CDN.
//
// design.bhd.om and registry.bhd.om are unauthenticated public hosts. Anything
// committed to src/ here is handed to anyone who requests it, which is fine for
// MIT and fatal for a licence that forbids redistribution.
//
// This scans the public tree for markers of the sources that must NEVER appear
// there and exits non-zero if one shows up. It catches the copy-paste mistake,
// which is the realistic failure mode. It is not a lawyer.
//
//   node scripts/check-licences.mjs
//   node scripts/check-licences.mjs --verbose
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const PUBLIC_TREE = path.join(root, "src");

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "fa", // FontAwesome kit, mirrored separately, licensed
  "vendor", // vendored libs with their own notices, see below
]);
const TEXT_EXT = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".mjs",
  ".json",
  ".md",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
]);

// Markers that mean "this file came from a source we may not redistribute".
const FORBIDDEN = [
  { pattern: /react[\s-]?bits/i, why: "ReactBits is MIT + Commons Clause: no redistribution, incl. ports" },
  { pattern: /commons clause/i, why: "a Commons Clause licence forbids redistributing the components" },
  { pattern: /21st\.dev/i, why: "21st.dev ToS forbids redistribution and copying without a link back" },
  { pattern: /tailwind\s*plus|tailwindcss\.com\/plus/i, why: "Tailwind Plus forbids redistributing components" },
  { pattern: /aceternity/i, why: "Aceternity Pro items are not redistributable" },
];

// Vendored directories are allowed to hold third-party code, but the notice must
// still be present next to it.
const VENDORED = ["vendor"];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = statSync(full, { throwIfNoEntry: false });
    if (!st) continue;
    if (st.isDirectory()) walk(full, out);
    else if (st.isFile() && TEXT_EXT.has(path.extname(name).toLowerCase())) out.push(full);
  }
  return out;
}

const files = walk(PUBLIC_TREE);
const hits = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const { pattern, why } of FORBIDDEN) {
    if (pattern.test(text)) {
      hits.push({ file: path.relative(root, file), why });
    }
  }
}

const verbose = process.argv.includes("--verbose");

// Notice-presence check for vendored libraries.
const notices = [];
for (const dir of VENDORED) {
  const abs = path.join(PUBLIC_TREE, dir);
  const st = statSync(abs, { throwIfNoEntry: false });
  if (!st?.isDirectory()) continue;
  const hasNotice = readdirSync(abs).some((n) => /licen[cs]e/i.test(n));
  notices.push({ dir: `src/${dir}`, ok: hasNotice });
}

if (verbose) {
  console.log(`scanned ${files.length} files under src/`);
  for (const n of notices) {
    console.log(`${n.ok ? "ok  " : "MISS"} ${n.dir} carries a licence file`);
  }
}

if (hits.length > 0) {
  console.error("\nRefusing: restricted-licence code found in the PUBLIC CDN tree.\n");
  for (const h of hits) console.error(`  ${h.file}\n    ${h.why}\n`);
  console.error(
    "design.bhd.om is unauthenticated. Move this to the one application that uses\n" +
      "it, keep its LICENSE.md beside it, and see docs/component-sourcing.md.\n"
  );
  process.exit(1);
}

const missing = notices.filter((n) => !n.ok);
if (missing.length > 0) {
  console.error("\nRefusing: vendored directory without a licence file:");
  for (const m of missing) console.error(`  ${m.dir}`);
  console.error("");
  process.exit(1);
}

console.log(`ok: ${files.length} files under src/, no restricted-licence markers`);
