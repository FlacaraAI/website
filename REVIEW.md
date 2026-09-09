# Review — hero direction, session close

Written 2026-08-17. Start here next session.

---

## What exists

| File | What it is | Status |
|---|---|---|
| `hero.html` | **The deliverable.** Single hero, final direction. | Ready to port |
| `DESIGN_SYSTEM.md` | Updated to match. Superseded rules marked inline. | Current |
| `lockups.html` | Six lockup studies. Kept for the rationale behind option 01. | Reference |
| `heroes-alt.html` | Four layout studies (D2/D4/F2/F3). D2 won. | Superseded |
| `heroes.html` | Original five studies. `03 INSTRUMENT` was the seed. | Archive |
| `flacara_icon.svg`, `flacara_outline.svg` | Source art. | Source of truth |

`hero.html` is self-contained: inline SVG symbols, no build step, no JS. Open it
directly to see the target.

---

## The direction, in one paragraph

Lower-left lockup on a 135° near-white ground, with the product outline embossed
into the background and cropped by the right edge of the viewport. The icon disc
and the wordmark split **one** gradient rather than each carrying a copy — the
disc takes the first 20% of the ramp, the wordmark finishes it. Accent pill above
the lockup, tagline below the wordmark in tracked uppercase Geist. Four elements
total. No nav, no button, no body copy.

---

## Decisions made, and why

- **Layout: D2 over D4/F2/F3.** Asymmetry gives the outline somewhere to live
  without competing with the type. The centred options (F2/F3) put the outline
  directly behind the lockup, which muddied both.
- **One ramp, split.** Two gradients side by side read as a repeat. The split is
  the fix and it costs one extra `<linearGradient>`.
- **Wordmark at 600, gradient-filled.** Both were previously prohibited. See
  open questions.
- **Ground does not start at pure white.** `#FCFCFC`, not `#FFFFFF`. The outline
  emboss needs a value above the ground for its highlight; on pure white it can
  only cast a shadow, which reads as pressed *in* rather than raised.
- **135° everywhere.** Ground, ramp, and all shadows now agree that the light
  comes from the top-left. An earlier version had the ground lit from
  bottom-left while shadows fell down-right.
- **CSS animation, not a JS class toggle.** An above-the-fold hero that needs a
  script to become visible is a hero that is sometimes invisible.

---

## Open questions — decide before building more pages

1. **Three design-system rules were amended by request.** All three are marked
   `Superseded` in `DESIGN_SYSTEM.md` rather than silently overwritten:
   - §1.2 radius ≤8px / no pills → accent pill fenced as an exception
   - §2.6 "no gradient text, ever" → permitted for the wordmark only
   - §5.0 wordmark weight 500 → 600
   - §4/§8 "no drop shadows" → three fenced brand-layer values

   These are defensible, but they were made one at a time across a single
   session. Worth one deliberate pass to confirm they still read as a coherent
   set rather than four separate concessions.

2. **The ramp is a blue-to-red heatmap.** This is the one with real
   consequences. §1 forbids diagnostic color semantics, and a cool-to-warm ramp
   next to a lesion photograph reads as a severity scale whether or not that is
   intended. The design system now bars the ramp from image-bearing pages.
   **Confirm this holds before designing the comparison page** — if the ramp
   turns out to be needed there, the ramp needs to change, not the rule.

3. **The mark is much quieter than it was.** Flames are page-coloured against a
   pale gradient disc, where they used to be near-white against navy. It reads
   at hero scale. Check it at favicon and nav scale before committing.
   `lockups.html` option 04 (navy disc, gradient flames) is the fallback if it
   does not survive.

4. **Fonts are still loading from Google.** §3.7 forbids this in production for
   a health product. Must be fixed during the Next.js port, not after.

---

## Next steps

### 1. Port the hero to Next.js

Nothing here is exotic — the whole hero is CSS plus two inline SVG symbols.

**Setup**
- `npx create-next-app@latest` — App Router, TypeScript. Tailwind optional; the
  design system provides a v4 `@theme` block in §7.2 if wanted, but plain CSS
  modules match how `hero.html` is written and avoid fighting Tailwind's
  prohibited utilities.
- Self-host fonts. `@fontsource/geist-sans`, `@fontsource/geist-mono`, and
  Zalando Sans SemiExpanded 600 as a local `woff2` via `next/font/local`. This
  closes open question 4 and removes the third-party request on every page load.
- Port `:root` from `hero.html` into `app/globals.css` verbatim. The token names
  already match `DESIGN_SYSTEM.md` §7.1.

**Components**
- `<Mark variant="lock" | "solo" />` — owns both `<linearGradient>` defs and the
  `viewBox` tightening. The lock/solo distinction is a design rule (§5.0), so it
  belongs in the component's API, not in whatever page is calling it.
- `<ProductOutline />` — the nine stroked paths and the emboss filter.
- `<Hero />` — composition only.

**Watch for**
- SVG `<symbol>`/`<use>` with React: fine, but the gradient IDs are global. If a
  page ever renders two marks, the IDs collide. Either render defs once at the
  layout root or use `useId()`.
- `background-clip: text` needs the `-webkit-` prefix; some CSS pipelines drop
  it. Verify the wordmark is not invisible in Safari before shipping.
- The tagline indent is `calc(var(--lock-size) * 1.08)`. Keep it derived. If
  someone hard-codes it, it silently misaligns the first time the lockup resizes.

**Done when:** the hero renders identically at 1440×900, 1280×800, and 375×812,
with fonts local and no network requests to Google.

### 2. Decide what the site actually contains

The hero deliberately says almost nothing — "Made to be compared." and the mark.
That works only if the next screen earns it. This needs a real conversation, not
a page list. The questions worth arguing about:

- **Who lands here first — patients or clinicians?** §6 defines two voices at
  different densities. The hero is currently neutral enough to serve either,
  which means it commits to neither. This is the decision that shapes everything
  below it.
- **What is the second screen?** The strongest candidate is the comparison view
  — two plates, same lesion, months apart. It is the product's actual argument
  and it needs no copy to make it. `heroes.html` §04 is a rough sketch. Note
  that this is exactly the page open question 2 constrains.
- **Where does the honest-limits language live?** §6 requires stating what has
  not been measured as plainly as what has (the DermLite DL4 comparison is the
  live example). That is a strong differentiator and an awkward fit for a
  landing page. It probably deserves its own section rather than a footnote.
- **Is there a purchase path yet, or is this pre-launch?** §1.3 governs how
  price appears if so. Changes whether the site needs commerce at all.

Rough shape, assuming consumer-first — but treat this as a starting point to
argue with, not a plan:

| Section | Carries | Notes |
|---|---|---|
| Hero | The mark, the claim | Built |
| Comparison | Two plates, 14 months apart | The actual argument. No ramp on this page. |
| Method | How the image is made | §1.4 — no-optics stays a footnote, never a headline |
| Limits | What has not been measured | §6. Consider giving this real estate, not a disclaimer. |
| Spec | Clinician density | §5.3 table exists |
| Regulatory | FDA pre-sub status | Factual, no framing |

### 3. Loose ends

- `heroes.html` and `heroes-alt.html` still reference the retired
  `--fl-spectrum`. Harmless in archived studies; do not copy from them.
- No `git init` in this directory. Worth doing before the Next.js scaffold so
  the port is reviewable as a diff.
