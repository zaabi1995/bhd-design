# Design learnings

References worth stealing from, and what we decided to do about each one. One entry per
source. Add new entries at the top. Every entry states what was verified and what is an
assumption, so nobody acts on a guess later.

---

## Originkit (originkit.dev), 18 Aug 2026

**What it is.** About 180 animated components for React, Next.js, Vite and Framer. Verified
from the site.

- Categories and counts as published: Text 62, Cursor 20, Animations 17, Background 16, Image
  15, Image Gallery 22, Interactive Elements 13, Button 12, Border 2.
- All motion is framer-motion. Their own integration page states "no CSS keyframes".
- Delivery is copy the TSX from a component page after signing in, or their MCP server at
  `https://mcp.originkit.dev/mcp` with an API key. Tools exposed: `list_components`,
  `get_component`, `search`, `fetch`.
- Beta. No licence text and no repository found on the site.

**Decision: catalogue it, do not absorb it.** Three reasons, and none of them is effort.

1. It is behind a sign-in. Pulling the library wholesale would mean using Ali's account to
   copy someone's work in bulk, with no published licence saying we may.
2. The stack is wrong for us. React plus framer-motion, while the design.bhd.om kit is vanilla
   CSS and JS that has to run inside a Laravel page, an Astro page and a React SPA alike.
3. Most of the catalogue argues with rules we already wrote down. Confetti cursors, neon
   borders, glitch text and liquid distortion are the opposite of "movement explains a change,
   it never performs", and of the one-accent rule.

**The useful path.** Treat it as an on-demand source, not a dependency. When a specific effect
is genuinely wanted (a text reveal on a brand landing page, say), sign in, pull that ONE
component through their MCP, and re-implement it on our tokens. Needs Ali's API key before it
can be wired.

---

## AIcss (aicss.dev), 18 Aug 2026

**What it is.** Copy-paste UI blocks for what an agent shows mid-conversation. Verified from
the site.

- Fourteen components in five groups. Thinking and Reasoning: Thinking State, Thinking +
  Reasoning, Orbs. Tool and Action States: Web Search, File Diff, Image Generation. Text
  Outputs: Text Response, Streaming Text, Inline Citations, Code Block. Structured Outputs:
  To-do List, Data Table, Comparison Table. Rich and Interactive: AI Agent Input.
- Ships React, Vue and Svelte with plain CSS and no Tailwind. Beta V1.2, by Kevin (@kvnkld).
- The hero says "Free to use UI components". There is no licence page, no terms page and no
  repository: `/license`, `/terms` and `/legal` all 404, and the only GitHub link anywhere in
  the bundle is core-js, a dependency.

**What it teaches us.** The grouping IS the insight. An agent surface is not one chat bubble,
it is five kinds of thing, and each needs its own block:

1. What the model is doing before it answers (thinking, reasoning trail).
2. What a tool call looks like while it runs and after it lands (search, diff, image).
3. The answer as it arrives (streaming, citations at the claim, code with a copy button).
4. What the model is tracking (to-dos with progress, tables).
5. Where the person types back (the composer).

**Decision.** Take the vocabulary, write our own code. "Free to use" without a licence is not
a grant we should lean on for a group-wide system, and their CSS could not carry our tokens,
our RTL mirroring or our no-emoji rule anyway.

**Built 18 Aug 2026.** `src/ai.css`, `src/ai.js`, gallery at design.bhd.om/ai.html.

- Thirteen blocks (their fourteenth, Orbs, was already built from the thinking-orbs entry
  below).
- Logical properties throughout, so every block mirrors in Arabic. The RTL button on the
  gallery flips the page to prove it. Code, diffs and numbers stay left to right inside an RTL
  layout, which is correct.
- `ai.js` only touches the five blocks that need script: the thinking timer, the reasoning
  collapse, streaming, the code copy button and the composer. Everything else is markup.
- Reduced motion: streams land in one paint, shimmer stops.
- Each gallery card copies ITS OWN rendered markup, so the page cannot document markup it is
  not showing.

Trap found while building it: `ai.js` binds on `DOMContentLoaded`, so a page script sitting
below it during parse reads `el.bhdAiTodo` as undefined. Resolve handles inside the callback,
not at script top level.

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
behaviour, and the agent readable tokens idea onto design.bhd.om instead.

**Built 18 Aug 2026.**

- `src/brand.html` (design.bhd.om/brand.html): all eight sections, every value copies on
  click, colour and motion rendered live from `tokens.json`, so the page cannot drift from
  the CSS. Re-renders on theme toggle.
- `src/tokens.json` (design.bhd.om/tokens.json): the agent readable file, generated by
  `scripts/build_tokens_json.py` from `tokens.css`. `var()` chains are flattened to literals,
  so a consumer gets `#009bc1`, not `var(--color-bhd-500)`. `npm run check:tokens` fails if
  the committed file is stale.
- Motion tokens added to `tokens.css` and `DESIGN.md`: five durations, four easings.
  `interactions.css` now reads them instead of holding its own copies.

Trap found while building it: the generator first parsed the `prefers-reduced-motion` block
as if it were top level, and published `--duration-base: 1ms` to every consumer. `@media`
bodies are stripped before parsing now.

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
drop in kit is vanilla CSS and JS, so a vanilla port was needed before it could join the kit.

**Built 18 Aug 2026.** `src/orb.js` and `src/orb.css`, plus the playground at
design.bhd.om/orbs.html.

- Independent vanilla canvas implementation, not their code. The nine state NAMES are copied
  byte for byte on purpose, so a React surface and a vanilla surface stay one vocabulary.
  Attribution sits in the file header and in the page footer.
- Fibonacci lattice on a sphere, one deformation function per state, dots coloured from
  `color` so both themes work with no dark-mode branch.
- Stops on `prefers-reduced-motion`, on a hidden tab, and when scrolled out of view.
- `DESIGN.md` now carries a Waiting section, so this is a rule rather than a component nobody
  finds.

Still to do: adopt it on the surfaces that currently spin (Magic Inbox, bank reconciliation,
AI forecasting, Dardasha auto-reply). Each of those still needs its wait state checked before
anyone claims an improvement.
