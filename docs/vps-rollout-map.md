# VPS rollout map — where the three layers land

**Audited:** 2 Nov 2026, against the live VPS `147.93.20.54` (156 nginx vhosts, pm2 + docker apps).
**Goal:** every BHD site gets the right layer, and nothing gets a layer its licence or stack cannot take.

## The three layers, and who can take each

| Layer | What it is | Reach | Constraint |
| --- | --- | --- | --- |
| **L1 — `elements.css`** | switches, checkboxes, spinners, progress, badges, chips, tooltips, segmented, dividers, card lift | **every** site, any stack | none — pure CSS, no JS, no build |
| **L2 — `@bhd` registry** | `bhd-marquee`, `bhd-blur-fade`, `bhd-number-ticker`, `bhd-bento`, `bhd-currency`, RTL-safe primitives, 12 brand themes | React, Next, Astro islands | needs React at runtime |
| **L3 — ReactBits** | `SplitText` and friends | **one app only** | MIT + Commons Clause: never on a public CDN |

## The headline

**Of ~70 public surfaces, 7 use the design system.** Everything else is inventing its
own switches, loaders and badges from scratch, per site, forever.

| State | Count | Sites |
| --- | --- | --- |
| ✅ Already wired to `design.bhd.om` | 7 | `bhd.om`, `bhdoman.com`, `alyas.bhdoman.com`, `empowerment.bhdoman.com`, `ideas.bhd.om`, `location.bhd.om`, `oits.bhd.om` |
| ⬜ Static, **no** design system | ~38 | `hosn.om`, `kairuz.om`, `lulus.om`, `welle.om`, `tanmia.bhd.om`, `thabit.bhd.om`, `t11.bhd.om`, `sa.bhd.om`, `sama.bhd.om`, `qr.bhd.om`, `docs.bhd.om`, `eid.bhd.om`, `ecothon.bhd.om`, `bc.bhd.om`, `btb.bhd.om`, `urban.bhd.om`, `jaifar.bhd.om`, `khatm.bhd.om`, `oia.bhd.om`, `oiahub.bhd.om`, `saaf.bhd.om`, `carlounge.bhd.om`, `present.hosn.om`, `standard.bhdoman.com`, `upload.bhdoman.com`, `fidatmajan.com`, `sparkjewelry.om`, `sooraseebenterprises.com`, `dispatch.sooraseebenterprises.com`, `courier.alali.om`, `gazette.kairuz.om`, `chronicle.cupsbyaa.com`, `concepts.arabian.ceo`, `concepts.cupsbyaa.com`, `news.arabian.ceo`, `observer.arabian.ceo`, `daily.arabian.ceo`, `asyad-flow.paperandpen.om`, `design.qplus.om`, `order.tfb.om`, `pay.tfb.om`, `admin.tfb.om`, `docs.dardasha.om` |
| ⬜ PHP / WordPress | 7 | `cardify.om`, `tfb.om` (WP), `ohh.cardify.om`, `riyada.cardify.om`, `signature.cardify.om`, `spark.cardify.om`, `trip.bhd.om` |
| ⬜ Astro | 4 | `fencing.om`, `mithaq.om`, `paperandpen.om`, `qplus.om` |
| ⬜ React / Next apps | 8 | `arabian.ceo`, `neverboard.om`, `registry.bhd.om`, `social.alizaabi.om`, `thesocialbar.om`, `mays.bhd.om`, `print.bhd.om`, `trivia.bhd.om` |
| ⛔ Locked — do not touch | — | `erp.bhd.om`, `erp.*`, `pnp-erp-*`, `alali`, `mail.*`, `dav.*`, `webmail.*`, `mcp.bhd.om`, `registry.bhd.om` internals |

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
