# VPS rollout map — where the three layers land

**Audited:** 2 Nov 2026, against the live VPS `147.93.20.54` (156 nginx vhosts, pm2 + docker apps).
**Goal:** every BHD site gets the right layer, and nothing gets a layer its licence or stack cannot take.

## The three layers, and who can take each

| Layer | What it is | Reach | Constraint |
| --- | --- | --- | --- |
| **L1 — `elements.css`** | switches, checkboxes, spinners, progress, badges, chips, tooltips, segmented, dividers, card lift | **every** site, any stack | none — pure CSS, no JS, no build |
| **L2 — `@bhd` registry** | `bhd-marquee`, `bhd-blur-fade`, `bhd-number-ticker`, `bhd-bento`, `bhd-currency`, RTL-safe primitives, 12 brand themes | React, Next, Astro islands | needs React at runtime |
| **L3 — ReactBits** | `SplitText` and friends | **one app only** | MIT + Commons Clause: never on a public CDN |

## The headline (measured live, 2 Nov 2026)

Sampled 42 public surfaces by fetching them and reading the `<head>`. The first
version of this map said "7 of ~70 use the design system". That was wrong twice
over: it undercounted, and it counted the wrong thing.

The distinction that matters is **icons vs the system**. Nine sites load
`design.bhd.om` only for FontAwesome. That is not design-system adoption.

| What they actually load | Count | Sites |
| --- | ---: | --- |
| **The system** — `tokens.css` / `themes/` / `tw.js` / `interactions` | **4** | `cupsbyaa.com`, `ideas.bhd.om`, `oits.bhd.om`, `almahamarble.om` |
| **FontAwesome only** — icons, no tokens | 9 | `bhd.om`, `bhdoman.com`, `cardify.om`, `splitty.om`, `fencing.om`, `mithaq.om`, `location.bhd.om`, `alyas.bhdoman.com`, `empowerment.bhdoman.com` |
| **Nothing at all** | 7 | `paperandpen.om`, `qplus.om`, `hosn.om`, `kairuz.om`, `dardasha.om`, `neverboard.om`, `arabian.ceo` |

Four of forty-two, and two of those four (`almahamarble.om`) were loading
`cmdk.css` / `skeleton.css` / `interactions.css` but **not** `tokens.css` — which
turned out to matter a great deal. See the next section.

## The token contract is a prerequisite, not a detail

`elements.css` is **not** self-contained. It reads semantic names —
`--primary`, `--background`, `--foreground`, `--border`, `--muted`,
`--muted-foreground`, `--radius`, `--success`, `--warning`, `--destructive`.
Those come from `tokens.css`, not from the element layer.

Concretely, on `almahamarble.om` the first attempt loaded `elements.css` correctly
and still rendered a **transparent badge**: the sheet was present, the class was
applied, and `--primary` resolved to the empty string, because AlMaha had never
loaded `tokens.css` and names its colours `--gold` / `--marble` / `--ink`.

The fix is an alias, not a rewrite: map the site's own palette onto the contract
names, and every element inherits that site's brand automatically.

```html
<style id="bhd-element-contract">
:root {
  --primary: var(--gold);          /* AlMaha's own vars, not BHD values */
  --primary-foreground: #fff;
  --background: var(--marble);
  --foreground: var(--ink);
  --border: var(--hairline-color);
  --muted: var(--ink-08);
  --muted-foreground: var(--ink-56);
  --radius: 10px;
}
</style>
```

**So every adoption is two steps, and the second is mandatory:**

1. `<link>` the layer.
2. Establish the token contract — either load `design.bhd.om/tokens.css`, or
   alias the site's existing palette onto those names.

Skipping step 2 produces a page that looks untouched and a layer that does
nothing. It fails silently, which is the worst kind of failure.

## The trap that makes this real

**Adding a stylesheet is not the work.** Linking `elements.css` into a page that uses
none of its classes ships bytes and changes nothing. The work is: add the foundation,
then **convert the ad-hoc controls that page already has** into the shared classes.

So each site is a two-part job, and the second part is the one that pays:

1. `<link>` `tokens.css` + `elements.css` (and `data-brand` via `tw.js` if the site has no tokens of its own).
2. Replace that site's hand-rolled spinner / badge / toggle / progress bar with `.bhd-spinner`, `.bhd-badge`, `.bhd-switch`, `.bhd-progress`.

A site with one hand-rolled spinner is a 20-minute job. A site with a full custom
design language is a rewrite, and should not be forced.

## Cohorts, ordered by measured effort (not by guess)

Measured page counts on the VPS, 2 Nov 2026. The first draft of this map ranked
`hosn.om` and `lulus.om` as quick wins. Both were wrong, and the measurements are
why: `hosn.om` is **239 pages with its own `tokens.css` and `site.css`**, and
`lulus.om` is a **4 KB coming-soon page with no controls at all**.

| Site | Pages | Size | Reality |
| --- | ---: | ---: | --- |
| `urban.bhd.om` | 1 | 136 K | single page, no system |
| `standard.bhdoman.com` | 5 | 40 K | five pages, no system |
| `welle.om` | 7 + 10 php | 2.0 M | small, mixed static/PHP |
| `kairuz.om` | 33 | 36 M | real site, no design system, has a local repo |
| `cardify.om` | 45 + 1210 php | 3.3 G | one shared header partial reaches five surfaces |
| `hosn.om` | 239 | 82 M | **has its own design system — integration, not adoption** |
| `paperandpen.om` | 6 930 | 948 M | Astro-generated; edit templates, never output |

### Cohort 1 — start at `kairuz.om`

33 pages, no design system, and a local repo (`~/claude/projects/kairuz`) so edits
are reversible. That is the smallest site where the conversion actually buys
something. `urban.bhd.om` and `standard.bhdoman.com` are smaller but have almost no
controls to convert, so they prove the plumbing and nothing else.

### Cohort 2 — `cardify.om` + the four payment microsites

One shared header (`includes/ui-header.php`) reaches `cardify.om`, `ohh.`, `riyada.`,
`signature.` and `spark.` — five surfaces in one edit. The design skill flags this
file as the drift-prone one: `git status -s` before deploying, merge useful VPS-side
drift into local first.

### Cohort 3 — `hosn.om` is a different job

239 pages, and it already has `tokens.css` + `site.css` of its own. Loading
`design.bhd.om/tokens.css` on top risks redeclaring `--radius` and other semantic
vars. This is **integration**: decide which of Hosn's tokens survive, alias the rest
to the shared ones, then convert controls page by page. Budget it as a project, not
a sweep. Do it last, and only if Hosn's own system is actually causing drift.

### Cohort 4 — Astro: edit templates, never output

`paperandpen.om` is 6 930 generated files. Any edit goes in the Astro `src/` and is
rebuilt; touching `dist/` is guaranteed to be overwritten. Same for `qplus.om`.
`fencing.om` and `mithaq.om` share a webroot (`/www/wwwroot/fencing.om/dist/client`),
so one deploy hits both plus the admin shell — verify both.

### Cohort 5 — React / Next apps (L2)

`arabian.ceo` · `neverboard.om` · `social.alizaabi.om` · `thesocialbar.om` ·
`mays.bhd.om` · `print.bhd.om` · `trivia.bhd.om`

Add the namespace once per repo:

```json
{ "registries": { "@bhd": "https://registry.bhd.om/r/{name}.json" } }
```

```bash
npx shadcn@latest add @bhd/bhd-theme @bhd/bhd-currency @bhd/bhd-button
```

`bhd-theme` pulls the tokens and the no-letter-spacing-on-Arabic rule with it, so these
apps stop re-deriving the palette.

### Cohort 6 — ReactBits (exactly one)

Already done: `bhdoman.com` (`bhd-shop`), vendored, not yet wired to a page.
**Do not add it to a second app** until the first one ships and its LCP impact is measured.

## Sequencing

| Wave | Sites | Layer | Why here |
| --- | --- | --- | --- |
| 1 | `kairuz.om` | L1 | smallest site that actually has controls, and it has a repo |
| 2 | `urban.bhd.om`, `standard.bhdoman.com`, `welle.om` | L1 | prove the procedure on low-risk surfaces |
| 3 | `cardify.om` + 4 microsites | L1 | one header partial, five surfaces |
| 4 | `fencing.om` / `mithaq.om` | L1 + L2 | shared webroot, 2 sites + admin in one deploy |
| 5 | `paperandpen.om`, `qplus.om` | L1 + L2 | Astro templates |
| 6 | the 7 React apps | L2 | per-repo, one command each |
| 7 | long tail (~30 static) | L1 | batch by template |
| 8 | `hosn.om` | L1 (integration) | 239 pages + its own token system — a project |

## Guardrails

- `npm run check:licences` in `bhd-design` before any CDN deploy — it fails if a
  restricted source (ReactBits, 21st.dev, Tailwind Plus) reaches `src/`.
- Do not touch `erp.*` (AntD-locked) or the mail stack.
- After any CDN change, verify with a real browser, not `curl`: the design skill
  records two separate incidents of FontAwesome vanishing estate-wide.
- Arabic: never per-character animation. Verify every converted page in `dir="rtl"`.
- These are live brand sites. Screenshot before and after, every time.

---

## First adopter — almahamarble.om (done, verified live)

`almahamarble.om` was the right first target: already loading `cmdk.css`,
`skeleton.css` and `interactions.css` from the CDN, an EJS app with one shared
`partials/head.ejs`, and a bespoke palette that made the token-contract problem
visible immediately.

What changed:

- `head.ejs` now loads `elements.css` in the existing BHD-layer loop (one array
  token, loaded async, same pattern as the other three sheets).
- A `#bhd-element-contract` alias block maps AlMaha's `--gold` / `--marble` /
  `--ink` / `--hairline-color` onto the semantic names the layer reads.

Verified in a real browser, both languages:

| Check | Result |
| --- | --- |
| Four CDN sheets load | `cmdk` · `skeleton` · `interactions` · `elements` |
| `--primary` resolves | `#B87333` — AlMaha copper, **not** BHD cyan |
| `.bhd-badge--primary` background | `color(srgb 0.72 0.45 0.2 / 0.14)` — copper at 14% |
| `.bhd-switch` width | `44px` |
| English page | `dir=ltr`, correct h1, no console errors |
| Arabic page | `dir=rtl`, correct h1, no console errors, hero intact |

**Not converted:** AlMaha's `chip` elements are interactive filter buttons
(`aria-pressed`, live counts) and its only `badge` is a decorative film marker.
Neither maps to `.bhd-chip` / `.bhd-badge` without redesigning behaviour, so they
were left alone. The layer is now present and correct for *new* work.

### What this proves about the rest of the estate

The blocker is not effort, it is that **most sites have nothing generic to
convert**. Sampled: `qr.bhd.om` is a personal invitation page, `standard.bhdoman.com`
is a 1.8 KB placeholder, `lulus.om` is a coming-soon page, `docs.bhd.om` is
Tech Foundry–branded and would need its own theme. A mechanical sweep is not
available; each site needs the two-step adoption above plus a judgement call on
which of its controls are generic enough to share.

That judgement is why the remaining waves are per-site work, not a script.

---

## Registry (@bhd) adopter #1 — qplus.om (done, verified)

The registry layer had **zero** adopters. `qplus.om` was the right first: a clean
repo (0 dirty), a genuine shadcn project (`components.json`, `rtl: true`), Astro,
and unwired.

```json
{ "registries": { "@bhd": "https://registry.bhd.om/r/{name}.json" } }
```
```bash
npx shadcn@latest add @bhd/bhd-currency
```

Pulled `bhd-currency` **and** its dependency `omr`; shadcn rewrote the internal
`@/registry/new-york/lib/omr` import to `@/lib/omr`, so it compiled untouched.

### The trap: do NOT install `bhd-theme` on a brand with its own palette

`bhd-theme` is BHD cyan. Installing it on Q+ would have overwritten Q+'s palette
with BHD's. The rule:

- **Brand-neutral items** — `bhd-currency`, `omr`, `bhd-bento`, `bhd-marquee`,
  `bhd-blur-fade`, `bhd-number-ticker`, `bhd-button`, `bhd-input`, `bhd-card` —
  inherit whatever tokens the host app already has. Safe anywhere.
- **`bhd-theme` / `theme-<brand>`** — only when the brand genuinely *is* that
  brand, or has no palette of its own.

Verified through Q+'s own Astro build, reading the emitted HTML:

| Case | Rendered |
| --- | --- |
| `value={1250.5}` | `<svg>` sign **before** `<bdi>1,250.500</bdi>` |
| `locale="ar-OM"` | sign before `<bdi>١٬٢٥٠٫٥٠٠</bdi>` (Arabic-Indic, 3 dp) |
| `value={null}` | no sign, `<bdi>-</bdi>` |
| wrapper, always | `dir="ltr"` + `unicode-bidi:isolate` inside an `dir="rtl"` page |

`astro build`: 89 pages, 124 files, no problems.

## cardify.om — deferred, and why

Targeted as wave 2. **Stopped before editing**: `includes/ui-header.php` has 310
lines of real divergence between local and the VPS, and it is not one branch
being stale.

- **VPS is newer** on security: `SecurityHeaders::send()` (CSP), `cspNonceAttr()`
  on inline scripts, AdSense head injection, `NotoSansArabic`.
- **Local is newer** on fonts: RTL/EN conditional Sora + Plus Jakarta, `onload`
  async CSS.

Deploying local over production would have **removed the CSP**, which is a
security regression, not a style change. Scp-ing either direction is wrong here.

Cardify also has no token contract (`--primary` empty; it is Tailwind with its own
palette), so it needs the alias step regardless.

**Action required before Cardify can be touched:** reconcile the two branches —
decide whether CSP stays (it should) and rebase the font work on top — then commit
a single header. Until then, Cardify stays out of the rollout.

---

## Elements adopter #2 — fencing.om + mithaq.om (done, verified live)

One repo, **two sites, two layouts, one tenant-aware token contract.**

`fencing-om` is a multi-tenant Astro SSR app. `src/lib/branding.ts
brandingToCssVars()` emits per-tenant CSS vars for both the public site
(`Base.astro`) and the admin shell (`Admin.astro`), and it already enforces WCAG
AA by darkening `--color-brand-solid` until white text clears 4.5:1. So the
alias was added **inside that function**, and every tenant inherits the element
layer in its own contrast-corrected colour with no per-tenant work:

```css
--primary: ${solid};              /* already the AA-corrected brand colour */
--background: ${b.colors.surface};
--foreground: ${ink};
--border: ${b.colors.line};
--muted-foreground: ${muted};
--radius: 12px;
```

### The mistake worth recording

The first deploy shipped only `Base.astro`. Live verification caught it:

| Site | Before the second fix |
| --- | --- |
| `fencing.om` | loaded ✅ `--primary` **#1e8439** ✅ |
| `mithaq.om` | **not loaded** ❌ `--primary` empty, switch 13px |

`mithaq.om` renders through **`MithaqMarketing.astro`**, which neither extends
`Base.astro` nor calls `brandingToCssVars` — it hardcodes its palette. "One
tenant-aware change reaches every tenant" was true for the app shell and false
for the marketing site. A second commit added `elements.css` plus an inline
alias to that layout using its own values (`#155340` was already its
`theme-color`, `#0b1f3a` its navy ink).

**Lesson: verify every hostname, not every code path.** The two layouts are the
same product and different surfaces.

### Final verified state (production, after CI)

| Surface | `--primary` | badge | switch | dir | errors |
| --- | --- | --- | --- | --- | --- |
| `fencing.om/` | `#1e8439` | `rgb(30,132,57)` | 44px | ltr | none |
| `fencing.om/ar` | `#1e8439` | `rgb(30,132,57)` | 44px | rtl | none |
| `mithaq.om/` | `#155340` | `rgb(21,83,64)` | 44px | ltr | none |
| `mithaq.om/ar` | `#155340` | `rgb(21,83,64)` | 44px | rtl | none |
| `fencing.om/admin` | `#1e8439` | `rgb(30,132,57)` | 44px | ltr | none |

### Deploy path

This repo deploys through **GitHub Actions** ("Deploy to VPS" on a self-hosted
runner), not scp. The sanctioned flow is commit → push → CI → verify. Two
practical notes:

- The runner is single and shared, so a deploy can queue for 15–20 minutes
  behind an E2E run. Budget for it; do not conclude it is broken.
- The repo moves fast. My push was rejected once, rebased cleanly with
  `--autostash` (26 `__pycache__` deletions in the tree), and a newer commit
  landed on top mid-flight — harmless, because an ancestor commit deploys with
  the newer one.

`npm test` fails on `tests/unit/documentIndex.test.ts` with `missingLanguages:
['ara']` (no tesseract Arabic pack locally). Confirmed pre-existing by stashing
the change and reproducing the identical failure.

---

## Elements adopter #3 — cupsbyaa.com (done, verified live)

**The cheapest adoption type: one line, zero alias.** cupsbyaa.com already ships
the semantic token contract through `cups-ui.css` + `public-shadcn.css`
(`--primary: #c83f7d`, `--background`, `--border`, `--muted`, `--radius`), so
`elements.css` inherited the brand immediately and nothing had to be mapped.

```blade
<link rel="stylesheet" href="https://design.bhd.om/elements.css?v=1">
```

Added to **all three** public layouts — `shop`, `app`, `admin` — not just the
one the homepage renders through, because the previous adoption lost a surface by
assuming a single layout reached everything (`Base.astro` did not cover
`MithaqMarketing.astro`).

### Deployment note: cupsbyaa.com is Docker

Not a bare webroot. `cupsbyaa.com` proxies to `127.0.0.1:18080`, a Docker service
(`cupsbyaa-app`) whose app source is **volume-mounted** from
`/www/wwwroot/custom.cupsbyaa.com`. So a template change is:

1. verify the VPS blades are byte-identical to `HEAD` (drift check — done, all three matched),
2. `scp` the changed blades,
3. `docker exec cupsbyaa-app php artisan view:clear` **and** `config:clear`.

Skipping step 3 serves the stale compiled Blade. Blade compiles at runtime, so no
image rebuild is needed.

### Verified (production)

| Surface | `--primary` | badge | switch | progress | dir | errors |
| --- | --- | --- | --- | --- | --- | --- |
| `cupsbyaa.com/` | `#c83f7d` | `rgb(200,63,125)` | 44px | 768px | — | none |
| `cupsbyaa.com/ar` | `#c83f7d` | `rgb(200,63,125)` | 44px | 768px | rtl | none |
| `cupsbyaa.com/shop` | `#c83f7d` | `rgb(200,63,125)` | 44px | 768px | ltr | none |

### The three adoption types, now all proven

| Type | Cost | Example |
| --- | --- | --- |
| Already has the token contract | **one line** | `cupsbyaa.com` |
| Has a token system under different names | one alias block | `almahamarble.om`, `fencing.om`/`mithaq.om` |
| No token system at all | alias + judgement on colours | (none yet — `cardify.om` is the next candidate, after its drift is reconciled) |

Triage rule for the remaining ~25 sites: check `--primary` first. If it resolves,
it is a one-line job; if not, it needs an alias and a decision about which of the
site's colours become `--primary`.

---

## Round 5 — full triage of the remaining estate

Ran the triage rule across 44 surfaces in one pass (headless browser, images and
fonts blocked, 20s cap). This is the map's most important measurement so far.

| Verdict | Count | Meaning |
| --- | ---: | --- |
| `ALIAS` | **40** | no `--primary` → needs an alias and a colour decision |
| `ONE-LINE` | **3** | `--primary` already resolves → link and done |
| `UNREACHABLE` | 1 | `btb.bhd.om` did not answer |

**The bottleneck is the token contract, not the stylesheet.** Forty of forty-four
sites have no semantic tokens at all, so "add elements.css everywhere" was never
going to work as a sweep.

### The structural fix — `contract.css` and real fallbacks

Two changes to the layer, both aimed at those 40:

1. **`elements.css` now has fallbacks on every semantic name** — CSS system
   colours (`Canvas` / `CanvasText`) and `currentColor`. A site with no tokens
   renders something visible and neutral instead of the silent transparent
   rendering measured on `almahamarble.om`.
2. **`design.bhd.om/contract.css`** — a one-line path for a site with no token
   system: BHD palette by default, three overrides (`--primary`,
   `--primary-foreground`, `--background`) for any other brand.

Verified all three states in a browser:

| Setup | `--primary` | badge | switch |
| --- | --- | --- | --- |
| elements.css only | (none) | `rgb(0,0,0)` via currentColor — **visible** | 44px, black |
| + contract.css | `#009bc1` | `rgb(0,155,193)` | 44px, cyan |
| + tokens.css | `#009bc1` | `rgb(0,155,193)` | 44px, cyan |

Existing adopters re-checked after the deploy and unchanged: cupsbyaa `#c83f7d`,
fencing `#1e8439`, mithaq `#155340`.

## Elements adopters #4 and #5 — splitty.om, eid.bhd.om (verified live)

Both were `ONE-LINE`: tokens already present, so no alias.

| Site | `--primary` | Surfaces verified |
| --- | --- | --- |
| `splitty.om` | `#0B72D8` | `/`, `/app`, `/ar` (RTL) |
| `eid.bhd.om` | `#26b4d3` | `/` |

Both needed the **both-branches** treatment: splitty splits its head into
marketing and app variants, so the link went into each; `eid.bhd.om` loads
`design.bhd.om/tokens.css` directly, so it inherited without an alias. splitty
also already had `style-src ... design.bhd.om` in its CSP, so no CSP change was
needed — worth checking *before* adding a CDN stylesheet, because a site with a
tight CSP would block it silently.

`eid.bhd.om` is a VPS-only edit (no repo); patched with a timestamped backup
beside the file and `php -l` run before verifying.

### Remaining queue

`mays.bhd.om` is the last `ONE-LINE` (its `--primary` is `oklch(20.5% 0 0)`, a
near-black — plausibly its intended monochrome, needs a look before adopting).
The other 39 need the alias path, and `cardify.om` still needs its header drift
reconciled first.

---

## Elements adopter #6 — khatm.bhd.om, and the ALIAS path proven

First adoption on a site with **no token contract at all** — the case that covers
40 of the 44 triaged surfaces. `khatm.bhd.om` is a BHD product but not a BHD brand:
its palette is sage/cream/navy (`--car #7FB069`, `--paper #F6F1E7`, `--ink
#1B2A4A`, `--rule #E3DCCD`, `--r 6px`). Dropping BHD cyan on it via
`contract.css` would have been wrong, so this used the alias path instead: a
site-scoped `khatm-contract.css` mapping its own vars 1:1.

| Check | Result |
| --- | --- |
| `--primary` | `#7FB069` — Khatm sage, not BHD cyan |
| badge | `rgb(127,176,105)` |
| switch / progress | 44px / 640px |
| page background | `rgb(246,241,231)` cream — unchanged |
| console errors | none |
| visual | identical layout, type and colours (screenshot compared) |

**Deliberately not converted:** Khatm's `.btn`, `.tag` and `.badge` are bespoke to
its look. Rewriting them to `.bhd-badge` would redesign a live brand site, which
is not what "adopt the layer" means. The layer is installed and correct for new
work.

### Two traps that cost real debugging time

**1. A new file is 640 root:root, and nginx 403s it.** Created over SSH, the file
landed as `-rw-r----- root root`. The page loaded, the `<link>` was in the DOM,
and the stylesheet silently 403'd. Fixed with `chown www:www` + `chmod 644`. This
is the same 403 class the design skill records for the hub — it applies to every
file created on a VPS as root, not just build output.

**2. Cloudflare cached the transient 403 and kept serving it after the fix.**
With the permissions corrected, `curl` returned 200 for
`/khatm-contract.css?cb=<random>` but the browser still got a cached
`403 Forbidden` for the bare path — so `--primary` stayed empty and the badge
still fell back to `--ink`. The durable fix is **not** waiting for the TTL; it is
versioning the link: `/khatm-contract.css?v=1`. That misses the poisoned cache
entry and is correct practice anyway.

Diagnostic tell: if a stylesheet is 403 in the browser but 200 from `curl` with a
cache-buster, it is the edge, not the origin.

## Round 7 — generated prescription for every remaining surface

`scripts/elements-adopt.mjs` turns the triage into a prescription: give it URLs and it
prints the verdict, the tokens that already resolve, the page's painted palette, and the
exact next step. It never edits anything, so it is safe against production.

Result across the 40 remaining surfaces:

| Verdict | Count |
| --- | ---: |
| `CONTRACT` — no semantic tokens | 30 |
| `ALIAS` — partial tokens | 9 |
| `ONE-LINE` — ready now | 1 (`mays.bhd.om`) |

### The queue

| Surface | Verdict | Candidate primary | Note |
| --- | --- | --- | --- |
| `alyas.bhdoman.com` | ALIAS | `#dfe4ee` | 2/8 |
| `carlounge.bhd.om` | ALIAS | `#091117` | 2/8 |
| `design.qplus.om` | ALIAS | `#10203A` | 2/8 |
| `empowerment.bhdoman.com` | ALIAS | `#dfe4ee` | 2/8 |
| `hosn.om` | ALIAS | `#0F3355` | 2/8 |
| `location.bhd.om` | ALIAS | `#009bc1` | 2/8 |
| `oits.bhd.om` | ALIAS | `#c6d2e6` | 2/8 |
| `print.bhd.om` | ALIAS | `#dfe3ec` | 2/8 |
| `saaf.bhd.om` | ALIAS | `#f3efe6` | 3/8 |
| `arabian.ceo` | CONTRACT | `#544c3f` | 1/8 |
| `bc.bhd.om` | CONTRACT | `#e5e7eb` | 0/8 |
| `bhd.om` | CONTRACT | `#0f172a` | 0/8 |
| `bhdoman.com` | CONTRACT | `#00b4d8` | 0/8 |
| `dardasha.om` | CONTRACT | `#00d4ff` | 0/8 |
| `docs.bhd.om` | CONTRACT | `#a3acb9` | 2/8 |
| `ecothon.bhd.om` | CONTRACT | `#0d1520` | gold/ink (shares a template with 4 others) |
| `fidatmajan.com` | CONTRACT | `#a0a0a0` | 1/8 |
| `ideas.bhd.om` | CONTRACT | `#fbf7f3` | 1/8 |
| `jaifar.bhd.om` | CONTRACT | `#0e5982` | 1/8 |
| `kairuz.om` | CONTRACT | `#241A26` | 0/8 |
| `lulus.om` | CONTRACT | `#ffffff` | 0/8 |
| `neverboard.om` | CONTRACT | `#0B0B0D` | 1/8 |
| `oia.bhd.om` | CONTRACT | `#0d1520` | gold/ink (shares a template with 4 others) |
| `oiahub.bhd.om` | CONTRACT | `#0d1520` | gold/ink (shares a template with 4 others) |
| `paperandpen.om` | CONTRACT | `#172e50` | 0/8 |
| `present.hosn.om` | CONTRACT | `#0d1520` | gold/ink (shares a template with 4 others) |
| `qr.bhd.om` | CONTRACT | `#fdf8ec` | cream/blue invitation (shares with sa) |
| `sa.bhd.om` | CONTRACT | `#fdf8ec` | cream/blue invitation (shares with sa) |
| `sama.bhd.om` | CONTRACT | `#009bc1` | 0/8 |
| `social.alizaabi.om` | CONTRACT | `—` | 0/8 |
| `sooraseebenterprises.com` | CONTRACT | `#1a1f2e` | 0/8 |
| `sparkjewelry.om` | CONTRACT | `#FFFFFF` | 0/8 |
| `standard.bhdoman.com` | CONTRACT | `#1a1a1a` | 0/8 |
| `t11.bhd.om` | CONTRACT | `#111a44` | 1/8 |
| `tanmia.bhd.om` | CONTRACT | `#0d1520` | gold/ink (shares a template with 4 others) |
| `thabit.bhd.om` | CONTRACT | `#14213A` | 0/8 |
| `thesocialbar.om` | CONTRACT | `#2c1810` | 0/8 |
| `urban.bhd.om` | CONTRACT | `#f4ede0` | 0/8 |
| `welle.om` | CONTRACT | `#FFFFFF` | 0/8 |
| `mays.bhd.om` | ONE-LINE | `—` | 8/8 |

### What this changes

The queue is no longer 38 individual judgement calls. It clusters:

- **A gold/ink family** — `tanmia`, `oia`, `oiahub`, `ecothon`, `present.hosn.om` all paint
  `#0d1520` + `#c9a961`. Same template, so **one contract covers five sites**. Their files
  differ (separate deploys) but the palette does not.
- **A cream/blue pair** — `qr.bhd.om` and `sa.bhd.om`, same invitations template.
- **Genuine one-offs** — `hosn.om` (239 pages, own system), `kairuz.om`, `welle.om`.

So the real unit of work is a **template family**, not a site. That number is far smaller
than 38 and is the right way to finish the rollout.

---

## Elements adopter #7 — bhd.om, both languages (verified live)

The group flagship: 81 pages, generated, no token contract of its own.

Because it is generated, the layer went into the **two head emitters**
(`_build.py head()` and `_brandpages.py`) rather than into 81 files — one edit,
then `python3 _build.py` rewrote 33 pages. `contract.css` was correct here with
no alias: bhd.om *is* BHD cyan, so the default `#009bc1` is its brand, not an
imposition. Load order is contract → elements → `app.72425670.css`, so the
site's own rules still win.

### The Arabic mirror nearly shipped broken — again

`ar/index.html` was the one page with no layer after the rebuild. It is
**hand-maintained**, not generated: `_arpages.py` has an explicit output map of
`ar/contact`, `ar/careers`, `ar/tech`, `ar/tf` and does not include the Arabic
homepage, so `python3 _arpages.py` rewrote 16 pages and skipped it.

Adding the links to `ar/index.html` by hand fixed it. Caught by probing `/ar`
rather than trusting that an English-page fix covered the mirror — the same
class of miss as `Base.astro` vs `MithaqMarketing.astro`, now on a third site.

**Pattern worth stating plainly:** on this estate, "it works" almost always needs
checking in **EN and AR**, and generated sites have at least one hand-maintained
page. Both bhd.om and fencing/mithaq fooled an "obvious" single-emitter fix.

### Verified

| Surface | `--primary` | badge | switch | progress | dir |
| --- | --- | --- | --- | --- | --- |
| `bhd.om/` | `#009bc1` | `rgb(0,155,193)` | 44px | 640px | ltr |
| `bhd.om/ar` | `#009bc1` | `rgb(0,155,193)` | 44px | 640px | rtl |
| `bhd.om/about` | `#009bc1` | `rgb(0,155,193)` | 44px | 640px | ltr |

`scripts/elements-adopt.mjs bhd.om` now reports `DONE`, tokens 8/8.

---

## Round 8 — RETRACTION: there is no "template family"

**The previous round asserted that five sites share a template, so one contract
could cover all five. That was wrong, and the reasoning behind it was worse than
the conclusion.**

The five — `tanmia`, `oia`, `oiahub`, `ecothon`, `present.hosn.om` — all painted
`#0d1520` + `#c9a961`. I read that as "same template", and planned a family-level
contract around it.

They are all behind **HTTP basic auth**. Every one returns `401`, and the palette
was the **same styled 401 error page**, not the product. The tool was measuring
pages it had never been allowed to see and reporting their colours as brand.

Reading the actual variables (behind the wall) confirmed how wrong the grouping
was: `oiahub` is a **light** cream/ink theme, `oia` and `present.hosn.om` are
dark, `ecothon` carries its own teal `#168F82`. Not one template. Not even one
mode.

### What was done about it

1. **Reverted** the `tanmia.bhd.om` patch — the site is protected, so the change
   was pointless as well as based on a false premise. Restored from backup,
   verified 0 occurrences of `elements.css`.
2. **Fixed the tool.** `elements-adopt.mjs` now records the HTTP status and
   refuses to measure a non-2xx page, reporting `PROTECTED` instead of a verdict:

   ```
   https://tanmia.bhd.om    PROTECTED   HTTP 401 — not measurable, needs credentials or is not public
   ```

   A diagnostic that silently reports a number for a page it could not load is
   worse than no diagnostic.
3. **Re-ran the prescription** with statuses enforced.

### Corrected numbers (32 measurable surfaces + 5 protected)

| Verdict | Count |
| --- | ---: |
| `CONTRACT` — no semantic tokens | 24 |
| `ALIAS` — partial tokens | 8 |
| `ONE-LINE` — ready now | 1 (`mays.bhd.om`) |
| `PROTECTED` — 401, not measurable | 5 |

The reachable `ALIAS` set is `hosn.om`, `location.bhd.om`, `oits.bhd.om`,
`alyas.bhdoman.com`, `empowerment.bhdoman.com`, `saaf.bhd.om`,
`carlounge.bhd.om`, `print.bhd.om`.

### The lesson

**An automated probe is only as good as its status check.** Two rounds of
planning were built on a palette that came from an error page. Any tool that
measures a live estate must assert the response it measured — a 401 body is a
perfectly valid HTML document with a perfectly real `background-color`, and it
will lie to you convincingly.

It also means the "the queue clusters into families" conclusion is **withdrawn**.
The remaining work is per-site, using the procedure that is now proven three
ways. That is a smaller claim, and a true one.

---

## Elements adopter #9 — carlounge.bhd.om (verified live, EN + AR)

First adoption done *after* the round-8 correction, applying the fixed procedure:
confirm HTTP 200, read the site's real variables, map them, then link.

Car Lounge names its palette `--steel` `#2a6689`, `--paper` `#f4f8fa`, `--text`
`#172630`, `--line` `#dce7ed`, `--mist` `#dcebf3`, `--muted` `#5b6d78`,
`--radius` 22px — a clean 1:1 map onto the contract, so no colour judgement was
needed, only naming.

Eight pages patched, not one: `/`, `/ar`, `/car-wash-partners-oman/` and its AR
twin, `/car-care-marketplace-oman/` and its AR twin, `404.html`, and
`/riyada/`.

| Surface | `--primary` | badge | switch | body | dir |
| --- | --- | --- | --- | --- | --- |
| `/` | `#2a6689` | `rgb(42,102,137)` | 44px | `rgb(244,248,250)` | ltr |
| `/ar` | `#2a6689` | `rgb(42,102,137)` | 44px | `rgb(244,248,250)` | rtl |
| `/car-wash-partners-oman/` | `#2a6689` | `rgb(42,102,137)` | 44px | `rgb(244,248,250)` | ltr |

### Two details worth reusing

**`/riyada/` does not load `site.css`.** It is a standalone page with inline
styles only, so the shared contract's `var(--steel)` had nothing to resolve
against and would have fallen back to neutral. It got literal values in its own
`<style>` block instead. A contract that references variables only works on pages
that load the file those variables live in — checking which stylesheets a page
actually links is part of the job.

**Permissions were set before the link was added.** The round-6 failure was a
file created `640 root:root` that nginx 403'd, then Cloudflare caching that 403.
This time the contract file was `chmod 644` + `chown www:www` *first*, so the
edge never saw a failing response to cache — and the link still carries `?v=1` as
a belt-and-braces cache-buster.

---

## Round 10 — registry adopter #2 (qplus-web), and the L2 landscape

`@bhd/bhd-currency` adopted into **`qplus-web`**, Q+'s application rather than its
marketing site. Q+ bills in OMR and had no OMR component at all, so the rule the
registry encodes — official sign on the visual left, three decimals, isolated LTR
inside Arabic — was being hand-rolled per screen.

Verified by rendering, not by compiling, and **kept as a regression test**
(`src/components/ui/__tests__/bhd-currency.test.tsx`) because this is exactly the
rule that silently rots:

| Case | Asserted |
| --- | --- |
| `value={1250.5}` | `<svg>` before `<bdi>1,250.500</bdi>`, `dir="ltr"`, `unicode-bidi:isolate` |
| `locale="ar-OM"` | `<bdi>١٬٢٥٠٫٥٠٠</bdi>` |
| `value={null}` | no sign, `<bdi>-</bdi>` |

`tsc -b && vite build` pass; 3/3 tests pass.

### The L2 addressable set is smaller than the site list suggests

Checked every live React product before assuming it could take the registry:

| Project | State | Verdict |
| --- | --- | --- |
| `qplus.om` | shadcn, `src/lib/utils.ts`, no OMR | ✅ adopted (round 2) |
| `qplus-web` | shadcn, `src/lib/utils.ts`, no OMR | ✅ adopted (this round) |
| `bhd-shop` (bhdoman.com) | has its own `src/lib/omr` + `OmrSymbol` + `PriceDisplay` | ⛔ would duplicate; replacing it is a refactor of a live shop |
| `fencing-om` | shadcn with **13 registries already configured**, but **no `@/lib/utils`** — its editor sub-libraries keep their own `cn` | ⚠️ needs `src/lib/utils.ts` (+ `clsx`, `tailwind-merge`) before any registry item will compile |
| `neverboard.om`, `social.alizaabi.om`, `thesocialbar.om`, `mays.bhd.om`, `print.bhd.om` | not shadcn (Radix directly or bespoke) | ⛔ not a registry target without being converted first |

So of the eight React surfaces in the original map, **two were ready, one is one
small file away, one already solved the problem itself, and four are not shadcn
projects at all.**

The `fencing-om` case is the useful one to record: its `components.json` looks
ready — 13 registries, aliases, `tsx: true` — but `@/lib/utils` does not exist, so
the first registry item installed would fail to compile. A configured
`components.json` is not evidence the project can take a registry item.

### Registry adopters so far

| Item | Adopted in |
| --- | --- |
| `bhd-currency` + `omr` | `qplus.om`, `qplus-web` |
| `bhd-marquee`, `bhd-blur-fade`, `bhd-number-ticker`, `bhd-bento` | available, no adopter yet |

---

## Elements adopter #10 — welle.om, and the CSP rule

Welle is the first site whose security policy **refuses the layer outright**, and
that produced both a fix and a rule.

### What happened

The layer was linked cross-origin as usual. Welle sends:

```
default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; ...
```

`style-src 'self'` blocks `design.bhd.om` entirely. The stylesheet was requested
and refused, `--primary` resolved but nothing consumed it, and the switch stayed
a 13px default checkbox. **The page looked untouched.**

**The tool said `DONE`.** It was checking that the URL was present in
`document.styleSheets` — and a CSP-blocked sheet still leaves an object there.
That is the second time a probe has reported success for something that did not
happen; it now injects a probe element and requires `.bhd-switch` to compute 44px
before calling a site `DONE`, and reports `BLOCKED` otherwise:

```
-> linked but did not apply: check Content-Security-Policy style-src,
   then self-host elements.css same-origin
```

### The rule

**Do not loosen a site's CSP to adopt a stylesheet.** Welle's `default-src
'none'` is a deliberate posture on a money-adjacent product; adding a CDN to
`style-src` is a security decision, not a styling one, and not mine to take.

The correct answer is **self-hosting**: copy `elements.css` into the site's own
`/assets/` and link it same-origin. Satisfies `style-src 'self'`, no policy
change, and it is faster (no cross-origin round trip). The tradeoff is that the
copy does not auto-update with the CDN — it must be re-copied when the layer
changes, so a self-hosted copy is a pinned dependency and should be noted as one.

### Welle: verified in both colour schemes

Welle prefixes its tokens `--w-` and redefines them under
`prefers-color-scheme: dark`, so the contract maps by `var()` reference and the
layer follows dark mode with no extra work:

| Scheme | `--primary` | badge | switch | body |
| --- | --- | --- | --- | --- |
| light | `#14603F` | `rgb(20,96,63)` | 44px | `#FFFFFF` |
| dark | `#4FB98C` | `rgb(79,185,140)` | 44px | `#080A09` |

Five pages: `/`, `/support.html`, `/privacy.html`, `/feedback.html`, `404.html`.

The only console error remaining is Cloudflare's injected beacon being refused by
that same CSP — a pre-existing condition of the site, unrelated to the layer.

### Which sites will need self-hosting

Any site sending `style-src 'self'`. Worth checking **before** linking, not after:
`curl -sI https://SITE | grep -i content-security-policy`. splitty.om already
allowed `design.bhd.om`; welle did not. Both were correct decisions for their
own context.

---

## Final state (round 12) — verified sweep

Re-ran `scripts/elements-adopt.mjs` across every adopter. **10/10 report `DONE`**,
meaning the sheet loaded *and* a `.bhd-switch` probe computed 44px — not just that
a `<link>` existed. Tokens 8/8 on eight of ten (splitty 3/8, carlounge 7/8 are
partial by their own design).

| Site | `--primary` | Layer |
| --- | --- | --- |
| `almahamarble.om` | `#B87333` copper | elements.css + contract |
| `fencing.om` / `mithaq.om` | `#1e8439` / `#155340` | elements.css + tenant contract |
| `cupsbyaa.com` | `#c83f7d` | elements.css, zero alias |
| `splitty.om` | `#0B72D8` | elements.css, zero alias |
| `eid.bhd.om` | `#26b4d3` | elements.css, zero alias |
| `khatm.bhd.om` | `#7FB069` | elements.css + contract |
| `bhd.om` (EN + AR) | `#009bc1` | elements.css + contract.css |
| `carlounge.bhd.om` (8 pages) | `#2a6689` | elements.css + contract |
| `welle.om` (5 pages, dark mode) | `#14603F` / `#4FB98C` | self-hosted + contract |

Registry (`@bhd`): **`qplus.om`** and **`qplus-web`**, both `bhd-currency` + `omr`,
verified by rendering and kept as a regression test. ReactBits: vendored in
`bhd-shop` with `ArabicSafeSplitText`, build-verified, **not wired to a page**.

### The tool earned its keep by being wrong three times

`elements-adopt.mjs` was corrected three times, each correction a real miss:

1. **Measured 401 error pages as if they were products** → 5 protected sites
   produced a fake "template family". Fixed: record HTTP status, refuse non-2xx.
2. **Reported `DONE` for a CSP-blocked sheet** (welle.om) → a stylesheet object
   survives in `document.styleSheets` even when the browser refuses to apply it.
   Fixed: require a probe rule to actually compute.
3. **Reported a false negative for async sheets** (almahamarble.om) → probed
   before the `media="print"` swap. Fixed: poll until the rule applies.

A diagnostic that is confidently wrong is worse than no diagnostic. All three
were only caught by cross-checking a second way.

### What remains, and why it is not in scope

31 reachable sites are still unadopted, and each needs a decision rather than
more work:

- **24 `CONTRACT`** — no token system. Each needs its brand's colours mapped to
  `--primary`; that is a per-brand design call, not ambiguity to resolve blindly.
  `scripts/elements-adopt.mjs` already prints the candidate and the painted palette.
- **7 `ALIAS`** — partial tokens (`hosn.om`, `location.bhd.om`, `oits.bhd.om`,
  `alyas.bhdoman.com`, `empowerment.bhdoman.com`, `saaf.bhd.om`, `print.bhd.om`).
  Same call, smaller surface.
- **`cardify.om`** — blocked on a genuine conflict: its `ui-header.php` has 310
  lines of two-branch drift where the VPS carries CSP and local carries newer
  fonts. Deploying either over the other loses real work.
- **5 `PROTECTED`** — 401 basic auth; nothing public can adopt into them.
- **ReactBits** — needs a bundle/LCP call: enabling it means `gsap` (~50 KB gzip)
  on a shop with Lighthouse targets.

Everything that was safe and unambiguous is shipped and verified above.
