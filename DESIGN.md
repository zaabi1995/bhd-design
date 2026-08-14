# BHD Design System

## Overview

design.bhd.om is a restrained product interface and reference library. It uses BHD cyan as the only primary accent, neutral surfaces for documentation, and compact controls for daily design work.

## Color

- Background: `var(--background)`
- Foreground: `var(--foreground)`
- Card and raised surfaces: `var(--card)`
- Primary action and selection: `var(--primary)` (`#009bc1` in the light theme)
- Muted surfaces: `var(--muted)`
- Secondary text: `var(--muted-foreground)`
- Borders: `var(--border)`
- Focus ring: `var(--ring)`
- Destructive state: `var(--destructive)`

Use the restrained strategy. Cyan indicates action, focus, selection, or live status. It is not decoration.

## Typography

Use IBM Plex Sans Arabic for English and Arabic interface text, falling back to system sans fonts. Use the existing fixed product scale. Headings are compact, body copy is capped near 70 characters, and code uses the system monospace stack. Arabic text never uses letter spacing.

## Shape and Elevation

- Small radius: `var(--radius-sm)`
- Medium radius: `var(--radius-md)`
- Large radius: `var(--radius-lg)`
- Extra-large radius: `var(--radius-xl)`

Prefer borders and surface contrast to shadows. Use elevation only for overlays, popovers, and sticky controls.

## Layout

Documentation uses a centered readable column. Tool pages may expand to a wider work surface when dense content requires it. Use CSS Grid for icon results and progressive single-column collapse below 768px. Keep global navigation familiar and compact.

## Components

- Buttons have default, hover, focus-visible, active, disabled, and loading states.
- Search fields always have a visible label or accessible name, clear action, and result count.
- Tabs use buttons with `aria-pressed` or the tab pattern.
- Icon tiles show preview, name, source, and selection state without nested cards.
- Detail panels expose stable URL, SVG copy, HTML copy, and download actions.
- Loading uses layout-matched skeletons. Empty and error states explain the next action.

## Motion

Use 150 to 220 millisecond transitions for opacity and transform only. Motion communicates selection, filtering, copying, or panel state. Respect `prefers-reduced-motion`.

## Accessibility

Target WCAG 2.2 AA. Maintain visible focus, sufficient contrast, 44 pixel touch targets on mobile, semantic headings, keyboard-operable search and filters, and RTL-safe logical properties.
