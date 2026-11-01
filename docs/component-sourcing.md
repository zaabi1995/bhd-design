# Component sourcing: what we take, from where, and what we never do

This is the rule for bringing any third-party UI into a BHD-Group project. It
exists because the five libraries we evaluated look interchangeable and are not:
the licences split them into two groups that need opposite treatment.

## The split

| Library | Licence | Where it may live |
| --- | --- | --- |
| **Uiverse** | MIT, all content | `design.bhd.om` (public CDN) ✅ |
| **Magic UI** | MIT | `registry.bhd.om` (public CDN) ✅ |
| **ReactBits** | MIT **+ Commons Clause** | inside one application's repo only ⚠️ |
| **21st.dev** | restrictive ToS | nowhere — reference only ⛔ |
| **Mobbin** | paid, third-party products | research input only ⛔ |

The dividing line is *redistribution*. `design.bhd.om` and `registry.bhd.om` are
public, unauthenticated CDNs. Publishing a component there hands a copy to anyone
who asks. MIT permits that; the Commons Clause forbids it.

## ReactBits — inside an application, never on a CDN

The Commons Clause says you may use the software commercially **"so long as you
do not sell, sublicense, or redistribute the components themselves — whether
alone, in a bundle, or as a ported version."**

- Pulling it into one app's `src/` = *use as part of a product*. Allowed.
- Hosting it, or a vanilla rewrite of it, on `design.bhd.om` = redistribution of
  a bundle. **Not allowed.** Note that "or as a ported version" closes the obvious
  loophole of rewriting it into plain CSS and calling it ours.

Keep `LICENSE.md` beside every vendored file. The notice must travel.

## 21st.dev — discovery only, never a source

Its Terms (§2, §3) are stricter than they look:

- users get access **"solely through the official 21st.dev platform"**;
- **scraping or automated collection** is prohibited without written consent;
- using the content **to train AI models** is prohibited without written consent;
- **redistributing** content is prohibited;
- copying a component requires a **clear, visible link back** to its 21st page.

For a group that ships client sites, lifting a 21st-exclusive component into a
build is the act §3 describes. The AI-training clause also matters operationally:
our agents read web pages routinely, so 21st is off-limits as an agent input at
scale.

### The clean route through it

21st is an *aggregator*. Its own footer lists the libraries it mirrors. So:

1. Find the component on 21st (fast discovery, good previews, real-world search).
2. Identify the upstream library.
3. Take the code from **that** project's repository, under **that** licence.

| Seen on 21st | Take it from | Licence |
| --- | --- | --- |
| Magic UI | `magicuidesign/magicui` | MIT |
| shadcn/ui | `shadcn-ui/ui` | MIT |
| Aceternity UI | `manuarora700/aceternity-ui` | MIT |
| Origin UI | `origin-space/originui` | MIT |
| Kokonut UI | `kokonutd/kokonut-ui` | MIT |
| ReUI | `keenthemes/reui` | MIT (free items only) |
| HextaUI | `preetsuthar17/hextaui` | MIT |
| Kibo UI | `haydenbleasel/kibo` | MIT |
| **Anything with no upstream** | nowhere | ⛔ do not use |

That last row is the whole point. A component that exists *only* on 21st has no
licence granting us redistribution, and we skip it.

## Mobbin — research, not assets

Mobbin is screenshots and flows of other companies' products. Two separate
problems, both real:

1. **Their content** is licensed to us, not owned by us — do not republish
   screenshots in client deliverables, decks or public pages.
2. **The products pictured** belong to other companies. Rebuilding a competitor's
   screen pixel-for-pixel is a design-copying exposure, not a licence we hold.

Use it to answer *why*, before code exists: what do ten real checkouts do at the
payment step; how do three Omani banks phrase an OTP screen; what does a good
empty state look like in a logistics dashboard. Then design our own.

See `mobbin-research-brief.md` for the brief template and the workflow.

## Enforcement

`npm run check:licences` scans for restricted-source markers and fails if one
appears in the public CDN tree. Run it in CI or before any deploy.

It is a tripwire, not a lawyer: it catches the copy-paste mistake, not a
determined rewrite.

## When in doubt

Ask what happens if the author of the component reads our public CDN tomorrow
and finds their work there. If the answer is "they'd have a valid complaint", it
does not go on the CDN.
