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

## Cohorts, in the order worth doing them

### Cohort 1 — static brand sites with hand-rolled UI (highest ROI)

`hosn.om` · `kairuz.om` · `lulus.om` · `welle.om` · `tanmia.bhd.om`

All five load **neither** `design.bhd.om` **nor** `fonts.bhd.om`. They are the purest
case: no design system at all, static HTML, low blast radius, and they are the
brands a client actually looks at.

Procedure per site:
1. `curl` the live page, inventory the custom controls it already renders.
2. Add `tokens.css` + the brand's `themes/<brand>.css` + `elements.css` in `<head>`.
3. Swap the matching controls for `.bhd-*` classes.
4. Screenshot before/after, verify RTL, verify reduced-motion.
5. Deploy, `curl` the live head to confirm the link is present and 200.

### Cohort 2 — PHP / WordPress (L1 only, no exceptions)

`cardify.om` · `tfb.om` · the four `*.cardify.om` payment microsites · `trip.bhd.om`

These can never take a React component. They get `elements.css` in their shared
header partial — for Cardify that is `includes/ui-header.php`, which the design skill
already flags as the drift-prone file (`git status -s` before deploying).

### Cohort 3 — Astro (L1 + L2 islands)

`fencing.om` · `mithaq.om` · `paperandpen.om` · `qplus.om`

Astro can mount React islands, so these take **both** layers. Caveat: an island costs
a React runtime on a page that may currently ship zero JS. Use it for one section
(hero marquee, stat band), not site-wide. `elements.css` covers everything else.

Note `fencing.om` and `mithaq.om` share a webroot (`/www/wwwroot/fencing.om/dist/client`)
— one edit reaches both, and also hits the admin shell. Verify both.

### Cohort 4 — React / Next apps (L2)

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

### Cohort 5 — ReactBits (exactly one)

Already done: `bhdoman.com` (`bhd-shop`), vendored, not yet wired to a page.
**Do not add it to a second app** until the first one ships and its LCP impact is measured.

## Sequencing

| Wave | Sites | Layer | Why first |
| --- | --- | --- | --- |
| 1 | `hosn.om`, `kairuz.om` | L1 | flagship brands, static, no design system |
| 2 | `lulus.om`, `welle.om`, `tanmia.bhd.om` | L1 | same shape, same procedure |
| 3 | `cardify.om` + 4 cardify microsites | L1 | one header partial, five surfaces |
| 4 | `fencing.om` / `mithaq.om` | L1 + L2 | shared webroot, 2 sites + admin in one edit |
| 5 | `paperandpen.om`, `qplus.om` | L1 + L2 | Astro |
| 6 | the 7 React apps | L2 | per-repo, one command each |
| 7 | remaining static (~30) | L1 | long tail, batch by template |

## Guardrails

- `npm run check:licences` in `bhd-design` before any CDN deploy — it fails if a
  restricted source (ReactBits, 21st.dev, Tailwind Plus) reaches `src/`.
- Do not touch `erp.*` (AntD-locked) or the mail stack.
- After any CDN change, verify with a real browser, not `curl`: the design skill
  records two separate incidents of FontAwesome vanishing estate-wide.
- Arabic: never per-character animation. Verify every converted page in `dir="rtl"`.
- These are live brand sites. Screenshot before and after, every time.
