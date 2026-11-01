# Mobbin research brief

Mobbin is the only one of the five libraries that ships no code, and it is the
cheapest quality lift we have. It is a library of real screens, flows and
animations from shipped products. The point is not to look at it; the point is to
arrive at a design decision with evidence instead of taste.

Cost: $10/month Pro; **$16/member Team**, which adds shared collections, comments,
API access and 2x AI credits. Take Team — shared collections are what make this a
team habit instead of one person's bookmarks.

## Two hard rules

1. **Never republish Mobbin screenshots** in client decks, proposals, public pages
   or social. It is licensed to us for reference; the pixels are not ours.
2. **Never rebuild a pictured screen pixel-for-pixel.** The products belong to
   other companies. Copying a competitor's checkout is a design-copying exposure.
   Study the *decision*, design our own expression.

## When to run this

Before any redesign, any new product surface, and any time someone says "make it
look better". It costs 90 minutes and it replaces the vague-brief argument with a
specific one. Skip it for bug fixes and copy changes.

## The 90-minute ritual

**0–15 min — write the question first.**
Do not open Mobbin until the question is written down. "What do ten shipping
checkouts do between cart and payment when the card fails?" is research. "Look at
good apps" is scrolling.

**15–50 min — collect, don't judge.**
Save 8–12 screens to a shared collection. For each, one line: what decision did
they make that we have not made yet? Ignore anything that is only pretty.

**50–70 min — find the pattern and the exception.**
What do 8 of the 12 do the same way? That is the convention, and departing from it
costs the user effort, so depart only on purpose. Where do they diverge, and what
does each choice buy?

**70–90 min — fill the brief below.** If the brief cannot state a decision, the
research is not finished.

---

## The brief

Copy this into the project before designing.

```markdown
# Research brief — <surface> — <date>
Researcher: <name>   Mobbin collection: <link>

## The question
<One sentence. A decision we must make, not a topic.>

## What we studied
| Product | Flow | Why it is relevant |
| --- | --- | --- |
|  |  |  |

## What is conventional (depart only on purpose)
- 

## Where they diverge, and what each buys
| Choice | Buys | Costs |
| --- | --- | --- |
|  |  |  |

## The decision we are making
<One paragraph. State it as a decision, with the evidence that drove it.>

## What we are deliberately NOT copying
<Name the screens we studied and the things we reject, and why. This line is the
legal and ethical guardrail as much as a design note.>

## BHD constraints that decide the rest
- Arabic first: <does the pattern survive RTL and Arabic shaping?>
- OMR: <amounts carry the official sign on the left, three decimals>
- Mobile: <most traffic is a phone on a mobile network in Oman>
- Brand: <which of the twelve brands, which tokens>
```

## Turning it into work

The brief is the input to the build, and it maps onto what we already own:

1. **Layout and structure** → our own components, or `bhd-bento`, `bhd-card`.
2. **A stock element** (switch, loader, badge, tooltip) → `design.bhd.om/elements.css`,
   which reaches PHP, Laravel, WordPress and static sites as well as React.
3. **A React pattern** (marquee, reveal, counter) → `@bhd` registry:
   `npx shadcn@latest add @bhd/bhd-marquee`.
4. **A one-off signature moment** → ReactBits, vendored into that app only, with
   `ArabicSafeSplitText`. Never on a CDN.

If step 2 or 3 covers it, we do not write new code. That is the payoff of doing
research first: most "we need something custom" turns out to be a decision we had
not made yet, not a component we did not have.

## Sourcing check

Whatever the brief leads to, run it through `docs/component-sourcing.md` before it
ships. `npm run check:licences` catches restricted sources in the public CDN.
