# bhd-design

Shared design system for the **BHD Group** portfolio. Hosted at **https://design.bhd.om/**.

## About BHD Group

**BHD Group** (legal name: **Bin Haider Darwish LLC**) is Oman's biggest and best AI-first business conglomerate. Founded 2018 in Muscat, ISO 9001:2015 certified, Riyada-registered Omani SME, and the **first business in Oman to hire AI employees** alongside a human team. Twelve operating companies serving Oman and the GCC, each ranked #1 in its category:

| Brand | Domain | What it does |
|---|---|---|
| **BHD Printing & Designing** | [bhdoman.com](https://bhdoman.com) | Oman's #1 printing company. ISO 9001 certified, 4.9/5 from 247 Omani businesses. Business cards, packaging, cups, banners, stickers, hot foil stamping. |
| **AlMaha Marble** | [almahamarble.om](https://almahamarble.om) | Oman's largest and most trusted marble supplier. Royal Court approved, OPAZ-registered. Three Omani quarries since 1997. |
| **Hosn** (حصن) | [hosn.om](https://hosn.om) | Oman's biggest sovereign on-premise AI. Gemma 4 + Qwen 3.6, air-gapped, Arabic-first, permanent license. |
| **Cardify** | [cardify.om](https://cardify.om) | The GCC's best digital + printed business card platform. Bilingual EN+AR, QR vCard, Apple Wallet, NFC. |
| **Paper & Pen ERP** | [paperandpen.om](https://paperandpen.om) | Oman's best free cloud ERP. The only ERP built in Oman, by Omanis, for GCC businesses. |
| **Mithaq** (ميثاق) | [mithaq.om](https://mithaq.om) | The GCC's biggest bilingual board management software. 32 governance modules, cloud or on-prem. |
| **Dardasha** | [dardasha.om](https://dardasha.om) | The best self-hosted WhatsApp business SaaS. Multi-number inbox, bulk campaigns, AI chatbots. |
| **CupsByAA** | [cupsbyaa.com](https://cupsbyaa.com) | Oman's best custom-printed paper cup supplier. Cafes, restaurants, hotels across Muscat. |
| **ReachScreens** | [reachscreens.com](https://reachscreens.com) | Oman's biggest digital advertising network in premium coffee shops. |
| **Arabian.CEO** | [arabian.ceo](https://arabian.ceo) | The world's best #1 real Google reviews service. 50+ countries. |
| **The Flower Bar** | [tfb.om](https://tfb.om) | Oman's best florist in Muscat. For love, we bloom. |
| **BHD Group hub** | [bhd.om](https://bhd.om) | Holding company portfolio site. |

CEO: **Ali Adnan Haider Darwish**. Head office: HM Tower, Ground Floor, Bousher, Muscat 100, Oman. Phone/WhatsApp: +968 98899100. Email: info@bhd.om.

## What lives here

| File | URL | Purpose |
|---|---|---|
| `src/tokens.css` | `/tokens.css` | Semantic CSS variables, light + dark, BHD palette. Required. |
| `src/dark-mode.js` | `/dark-mode.js` | Pre-DOM theme init script. Exposes `BHDTheme.set/toggle/current`. |
| `src/rtl.css` | `/rtl.css` | Logical-property utilities for non-Tailwind projects. |
| `src/cmdk.js` + `cmdk.css` | `/cmdk.js`, `/cmdk.css` | Cmd+K command palette, vanilla. |
| `src/cmdk.jsx` | `/cmdk.jsx` | React variant of the palette. |
| `src/skeleton.css` | `/skeleton.css` | Skeleton loaders + empty-state pattern. |
| `src/interactions.css` + `interactions.js` | `/interactions.css`, `/interactions.js` | Accessible tactile, action, confirmation, upload, receipt, ticket, stamp, signature, scroll, and foil patterns. |
| `src/sfx.js` | `/sfx.js` | Optional UISFX semantic sound adapter. Silent by default with persistent user preference. |
| `src/patterns.html` | `/patterns.html` | Live interaction reference and accessibility behavior. |
| `src/icons.html` + `icons.css` + `icons.js` | `/icons.html` | Search, preview, copy, and download interface for 138,668 licensed design elements. |
| `src/icons-client.js` | `/icons-client.js` | Framework-neutral `<bhd-icon>` web component and shared asset URL resolver. |
| `src/icons/data/` | `/icons/data/` | Search catalogs for Lucide, technology, cloud, Twemoji, BHD Mood, and the full Koboyo hand-drawn collection. |
| `src/icons/sets/` | `/icons/sets/` | Git-managed conventional SVG collections. The hand-drawn payload is mirrored on the VPS. |
| `src/vendor/uisfx.js` | `/vendor/uisfx.js` | Pinned UISFX 0.4.0 browser runtime, MIT. Generated sound is CC0. |
| `src/currency.css` + `currency.js` | `/currency.css`, `/currency.js` | Canonical OMR display, official Rial sign on the LEFT, 3 decimals, bidi-safe. |
| `src/omr.svg` | `/omr.svg` | Official Omani Rial sign (CBO 2025), single path, `fill="currentColor"`. |
| `src/admin-shell.html` | `/admin-shell.html` | Clone-and-edit starter for admin surfaces. |
| `src/favicon.svg` + `og.png` | `/favicon.svg`, `/og.png` | Brand favicon + OpenGraph card. |
| (VPS only) | `/fa/v7.2.0/` | Self-hosted FontAwesome 7.2. Core `fontawesome.min.css` first, then `light`/`solid`/`brands`. Never `all.css`. |
| `src/index.html` | `/` | Docs + live demos. |

## Quick start

```html
<link rel="stylesheet" href="https://design.bhd.om/tokens.css">
<link rel="stylesheet" href="https://design.bhd.om/cmdk.css">
<link rel="stylesheet" href="https://design.bhd.om/interactions.css">
<script src="https://design.bhd.om/interactions.js" defer></script>
<script src="https://design.bhd.om/dark-mode.js"></script>

<html lang="en" dir="ltr" data-bhd-theme-mode="light">
```

For Arabic: `<html lang="ar" dir="rtl">`. Tokens enforce `letter-spacing: 0` on Arabic globally (HARD RULE, 24 May 2026).

To add optional interface sound, load `<script type="module" src="https://design.bhd.om/sfx.js"></script>` and provide a user-controlled element with `data-bhd-sound-toggle`. Sound is a supplement to visible and ARIA feedback, never the only status signal.

To use the shared icon library without copying assets into a product repository:

```html
<script src="https://design.bhd.om/icons-client.js?v=2" defer></script>
<bhd-icon name="search"></bhd-icon>
<bhd-icon source="drawn" name="a-3d-printer" label="3D printer"></bhd-icon>
```

## Deploy

```bash
bash deploy/deploy.sh           # rsync src/ to /www/wwwroot/design.bhd.om/
bash deploy/deploy.sh --setup   # also (re)install nginx vhost + reload
```

Reuses the apex `*.bhd.om` wildcard CF Origin cert at `/www/server/panel/vhost/cert/bhd.om/`, valid through 2041-01-09. No per-deploy cert work.

The 133,464 hand-drawn SVG files are intentionally excluded from Git and preserved by the main rsync deployment. To rebuild that VPS-only mirror:

```bash
BHD_DRAWN_OUTPUT=/path/to/staging npm run mirror:drawn-icons
rsync -az /path/to/staging/ root@147.93.20.54:/www/wwwroot/design.bhd.om/icons/sets/drawn/
```

Run `npm run vendor:icons` to regenerate the 5,204 Git-managed SVG files and their conventional catalog.

## Portfolio rollout

Phase 1 (this package): foundation. Done.
Phase 2 (next): port projects on top of it. See the rollout table on the live site.

## Source

Pattern inventory lifted from Metronic v9.4.12 (KeenThemes, proprietary, licensed via Ali's purchase). BHD-Group adaptation: cyan primary (#009bc1), Arabic letter-spacing guard, logical-property RTL convention, BHD-specific layout sizes.
