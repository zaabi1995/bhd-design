# bhd-design

Shared design system for the BHD-Group portfolio. Hosted at **https://design.bhd.om/**.

## What lives here

| File | URL | Purpose |
|---|---|---|
| `src/tokens.css` | `/tokens.css` | Semantic CSS variables, light + dark, BHD palette. Required. |
| `src/dark-mode.js` | `/dark-mode.js` | Pre-DOM theme init script. Exposes `BHDTheme.set/toggle/current`. |
| `src/rtl.css` | `/rtl.css` | Logical-property utilities for non-Tailwind projects. |
| `src/cmdk.js` + `cmdk.css` | `/cmdk.js`, `/cmdk.css` | Cmd+K command palette, vanilla. |
| `src/cmdk.jsx` | `/cmdk.jsx` | React variant of the palette. |
| `src/skeleton.css` | `/skeleton.css` | Skeleton loaders + empty-state pattern. |
| `src/admin-shell.html` | `/admin-shell.html` | Clone-and-edit starter for admin surfaces. |
| `src/index.html` | `/` | Docs + live demos. |

## Quick start

```html
<link rel="stylesheet" href="https://design.bhd.om/tokens.css">
<link rel="stylesheet" href="https://design.bhd.om/cmdk.css">
<script src="https://design.bhd.om/dark-mode.js"></script>

<html lang="en" dir="ltr" data-bhd-theme-mode="light">
```

For Arabic: `<html lang="ar" dir="rtl">`. Tokens enforce `letter-spacing: 0` on Arabic globally (HARD RULE, 24 May 2026).

## Deploy

```bash
bash deploy/deploy.sh           # rsync src/ to /www/wwwroot/design.bhd.om/
bash deploy/deploy.sh --setup   # also (re)install nginx vhost + reload
```

Reuses the apex `*.bhd.om` wildcard CF Origin cert at `/www/server/panel/vhost/cert/bhd.om/`, valid through 2041-01-09. No per-deploy cert work.

## Portfolio rollout

Phase 1 (this package): foundation. Done.
Phase 2 (next): port projects on top of it. See the rollout table on the live site.

## Source

Pattern inventory lifted from Metronic v9.4.12 (KeenThemes, proprietary, licensed via Ali's purchase). BHD-Group adaptation: navy primary, Arabic letter-spacing guard, logical-property RTL convention, BHD-specific layout sizes.
