# Design learnings

References worth stealing from, and what we decided to do about each one. One entry per
source. Add new entries at the top. Every entry states what was verified and what is an
assumption, so nobody acts on a guess later.

---

## Vessa (vessa.design), 18 Aug 2026

**What it is.** A paid tool that publishes interactive brand guidelines as a live web page at
`vessa.design/brand/<name>`, instead of a PDF brand book. Verified from the marketing site.

- Fixed section order: Introduction, Logo, Color, Typography, Motion, Moodboard,
  Applications, Assets.
- Colour values copy to clipboard on click.
- Motion is documented with real easing and duration values, not adjectives.
- Optional password protection on a published page.
- Fonts: upload your own, or pull from Google Fonts and Fontshare.
- Ships an MCP server so Claude and Cursor can read the guidelines directly.
- Price: EUR 29 for one brand, EUR 119 for five (launch). Standard EUR 39 and EUR 195. One
  time, not a subscription. Building is free, publishing is the paywall.

**What it teaches us.**

1. The section list above is a usable spec for a brand page. Our `DESIGN.md` carries the same
   material as prose. The same content as a live page, with click to copy on every token,
   is more useful to whoever is actually building a screen.
2. Motion belongs in the guidelines as numbers. `DESIGN.md` gives durations (150 to 220ms)
   but no easing tokens. That is a real gap, and Vessa is right to hold a Motion section.
3. The MCP server is the part with leverage. An agent that reads the brand directly stops
   guessing our colours. We can get the same result for free by serving a `tokens.json` from
   design.bhd.om, since `tokens.css` already holds the values.
4. One link that stays current beats a PDF that goes stale in everyone's downloads folder.
   Same argument as fonts.bhd.om and design.bhd.om.

**Decision.** Do not buy it. BHD brands are already hosted on our own domain, and paying per
brand does not scale across the group (BHD, Cardify, CupsByAA, Hosn, Mithaq, Dardasha,
Splitty, Paper and Pen, Kairuz, ReachScreens). Take the section structure, the click to copy
behaviour, and the agent readable tokens idea onto design.bhd.om instead. Not built yet.

---

## Thinking orbs (orbs.jakubantalik.com), 18 Aug 2026

**What it is.** An animated "the agent is working" indicator. Verified from the site and the
npm registry.

- Package `thinking-orbs`, version 0.3.1, **MIT**, 55KB unpacked, zero runtime dependencies,
  React `>=18` as a peer. Repo `github.com/Jakubantalik/thinking-orbs`.
- Canvas dotted orb, auto light and dark, two sizes.
- Install tabs on the site cover React, SwiftUI and React Native. Only the React package was
  verified on npm.
- Nine named states, each with its own motion: working, searching, solving, listening,
  connecting, weaving, composing, breathing, shaping.
- API is small: `<ThinkingOrb state="listening" size={64} />`, plus a speed multiplier.

**What it teaches us.**

1. An AI surface needs a vocabulary of wait states, not one spinner. "Searching" and
   "solving" are different waits and should not look identical. Naming the wait is most of
   the value; the animation is the rest.
2. The playground on their page (live state, size and speed controls beside the component) is
   exactly what `patterns.html` does for interactions. Worth copying for our own components.
3. One component, three platforms, same state names. That is how a shared kit should behave
   across our web apps and the Expo apps (Splitty, Cardify Scan).

**Where it would apply.** Every surface where we make someone wait on a model: BHD-ERP Magic
Inbox, the bank reconciliation proposer, AI forecasting, Dardasha AI auto-reply, arabian.ceo.
Assumption, not verified: those surfaces currently show a generic spinner or a skeleton.
Check before claiming an improvement.

**Decision.** MIT, so we can use or port it. It is React only on npm, and the design.bhd.om
drop in kit is vanilla CSS and JS, so a vanilla port is needed before it can join the kit.
Not built yet. If we do it, the state names come across unchanged so the React, vanilla and
SwiftUI versions stay one vocabulary.
