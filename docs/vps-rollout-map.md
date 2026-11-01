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
