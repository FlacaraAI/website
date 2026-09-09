# Flacara — Web Design System

Reference for building flacara.com. Derived from `BRAND_BRIEF.md`; where the two
disagree, the brief wins.

**Using this with Claude Code:** reference it explicitly when starting UI work —
`read @DESIGN_SYSTEM.md` — or rename/symlink it to `CLAUDE.md` so it loads
automatically. Every value below is a decision, not a suggestion. If something
isn't covered here, the safe default is the quieter option.

---

## 1. Non-negotiables

These come out of the brief and out of what the product is legally allowed to say.
Breaking one is a bug, not a style disagreement.

1. **No diagnostic color semantics.** No red/amber/green status vocabulary, no
   risk scores, no color-coded severity — near imagery or anywhere else. The
   consumer product makes no interpretive claim and the interface cannot make one
   on its behalf. The single fenced exception is form validation (§3.4).
   **This constrains the brand ramp.** The ramp (§2.6) runs cool to warm, which
   is the shape of every severity scale ever printed. It is permitted on brand
   surfaces — the mark, the accent pill, the hero — and nowhere near a lesion
   image, a result, or anything a reader could mistake for a legend.
2. **Corner radius maxes out at 8px on functional elements.** Inputs,
   buttons, plates. Roundness is the visual signature of the wellness apps the
   brief rules out. Two fenced exceptions: the accent pill (§2.6), which is a
   brand mark, carries no state, and is never interactive; and the surface
   layer — cards, panels, bands, and the nav pill — which sits at 16px
   (`--fl-radius-card`, §4). Nothing inside a surface inherits its radius.
3. **Price is never a selling point.** It appears in spec tables and on purchase
   pages as a fact. No "only," no "just," no struck-through comparison.
4. **The no-optics approach is a footnote.** It explains the engineering in
   technical copy. It is never a headline.
5. **Imagery sits on the mat, never on the ground.** A lesion photo on a light
   background misrepresents skin tone. See §5.1.

---

## 2. Color

Three colors were chosen; the rest are derived from them in OKLab so that
lightness shifts don't skew hue. Every text pair below has been checked and
passes WCAG AA or better.

### 2.1 Tokens

| Token | Hex | Use |
|---|---|---|
| `--fl-ground` | `#E3E5E6` | Page background for app and clinical surfaces. |
| `--fl-ground-lit` | `linear-gradient(135deg,#FCFCFC,#ECECEC)` | Marketing and hero surfaces. See §2.5. |
| `--fl-surface` | `#F2F4F5` | Cards, panels, raised areas. |
| `--fl-sunken` | `#D5D7D8` | Inset areas, table header bands, code blocks. |
| `--fl-rule` | `#BBBDBE` | Hairline borders, dividers, input outlines. |
| `--fl-rule-strong` | `#959798` | Emphasized dividers, table structure. |
| `--fl-ink` | `#151616` | Primary text, headlines. |
| `--fl-muted` | `#5F6060` | Secondary text, captions, labels. |
| `--fl-accent` | `#3B3350` | Buttons, links, marks, kickers. |
| `--fl-accent-hover` | `#2C2540` | Hover/active state for accent fills. |
| `--fl-accent-quiet` | `#D2CEDA` | Accent-tinted fills, selected rows, ghost buttons. |
| `--fl-on-accent` | `#F8F6FB` | Text and icons on an accent fill. |
| `--fl-mat` | `#2A2D30` | Image surround. Functional, not decorative. |
| `--fl-mat-edge` | `#404346` | 1px inset rim on the mat. |

Note there is no separate "accent text" token: `#3B3350` clears 9.36:1 on the
ground, so the same value serves fills and text. That is a property of this
particular plum, which is the ramp's own 35% stop darkened until it cleared the
navy it replaced. If the accent ever changes, re-derive.

### 2.2 Dark surfaces (image-viewing contexts only)

For galleries, comparison views, and any app screen where photographs are the
subject. Derived from the mat so it's the same material, not a second theme.
Do not use these for marketing pages.

| Token | Hex | Use |
|---|---|---|
| `--fl-mat-deep` | `#1F2225` | Background behind a mat. |
| `--fl-mat-raised` | `#35383B` | Controls and panels over a mat. |
| `--fl-on-mat` | `#EAECED` | Primary text on mat. |
| `--fl-on-mat-muted` | `#979A9C` | Captions on mat. |
| `--fl-accent-on-mat` | `#A79EC4` | Links and accents on mat. The plum is too dark to use directly here. |

### 2.3 Verified contrast

| Pair | Ratio | |
|---|---|---|
| ink / ground | 14.35:1 | AAA |
| ink / surface | 16.43:1 | AAA |
| muted / ground | 4.99:1 | AA |
| muted / surface | 5.72:1 | AA |
| accent / ground | 10.07:1 | AAA |
| on-accent / accent | 12.19:1 | AAA |
| on-mat / mat | 11.68:1 | AAA |
| on-mat-muted / mat | 4.89:1 | AA |
| accent-on-mat / mat | 4.58:1 | AA |

On `--fl-ground-lit`, checked at both ends of the gradient:

| Pair | Light end `#FCFCFC` | Dark end `#ECECEC` | |
|---|---|---|---|
| ink | 17.67:1 | 15.35:1 | AAA |
| muted | 6.15:1 | 5.34:1 | AA |
| accent | 12.40:1 | 10.77:1 | AAA |

`--fl-rule` on ground is 1.49:1 — decorative only. Never use it to carry meaning
or to outline an interactive control that has no other affordance.

The gradient wordmark (§5.0) does not clear AA against either end and is not
required to: WCAG 1.4.3 exempts logotypes. That exemption covers the wordmark
and nothing else. It does not extend to a tagline, a nav item, or any other
text that happens to sit near the mark.

### 2.4 Form validation — the one fenced exception

`--fl-invalid: #8C2F2F` (6.48:1 on ground). Permitted **only** for form field
validation: a wrong email format, a required field left blank.

- Never on a page that displays lesion imagery.
- Never for anything describing a lesion, an image, or a result.
- Always paired with text. Color alone never carries the message.
- There is no matching success green. A valid field is simply not invalid.

#### Metallic sheen

A machined-surface highlight, as on an anodized housing. It reads as material,
not as color.

```css
--fl-sheen:      linear-gradient(163deg, #F2F4F5 0%, #E3E5E6 40%, #DCDEDF 66%, #EAECED 100%);
--fl-sheen-dark: linear-gradient(163deg, #35383B 0%, #2A2D30 44%, #232629 70%, #303336 100%);
--fl-brushed:    repeating-linear-gradient(178deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px);
```

Rules:

- **Lightness range stays under ~8%.** If you can name two colors when looking at
  it, it's too wide. It should read as one surface catching light.
- **No hue shift.** All stops sit on the same neutral. A sheen that drifts warm
  or cool is a color gradient wearing a costume.
- **Large surfaces only** — section backgrounds, hero grounds, the housing in
  product renders. Never on buttons, cards, inputs, or anything under 300px.
- **Never behind body copy.** A headline is fine; a paragraph is not.
- **Never on the mat behind a photograph.** The surround must stay a flat,
  known value or it stops being a controlled viewing condition.
- `--fl-brushed` may overlay a sheen for machined texture. Never on its own,
  never above 4% opacity.

---

## 2.5 The lit ground

Marketing surfaces use a diagonal instead of a flat fill.

```css
--fl-ground-lit: linear-gradient(135deg, #FCFCFC 0%, #ECECEC 100%);
```

`135deg` in CSS notation means light at top-left, dark at bottom-right. Every
shadow in the system falls down-right, so the ground and the shadows agree on
where the light is. **If you ever change this angle, change the shadows too** —
a background lit from below with shadows cast from above is the single most
common way this system will look wrong.

- **Range is ~5.4% lightness.** Same discipline as the sheen: one surface
  catching light, not two colors.
- **It does not start at pure white.** `#FCFCFC` rather than `#FFFFFF` is
  deliberate and load-bearing — the product outline (§5.5) is drawn in a
  near-white stroke and needs a value above it to read as a highlight. On a
  `#FFFFFF` ground the outline has only its shadow to work with and reads as
  pressed *in* rather than raised.
- **Marketing and hero only.** App and clinical screens keep flat
  `--fl-ground`. A gradient behind a spec table is noise.

---

## 2.6 The brand ramp

Cross-polarized light through birefringent tissue genuinely produces
interference colors, which is the origin of this and the only reason a
multi-hue gradient exists in an otherwise neutral system.

```css
--fl-ramp:      linear-gradient(135deg, #C9DAF8 0%, #CECBDF 35%, #DB9D91 100%);
/* the 20%→100% tail, for the wordmark half of a lockup — see §5.0 */
--fl-ramp-tail: linear-gradient(135deg, #CCD1EA 0%, #CECBDF 18.75%, #DB9D91 100%);
```

It appears in exactly four places. Nowhere else.

1. **The mark** — the icon disc, and the wordmark when it is set as a lockup
   (§5.0).
2. **The accent pill** — 10px tall, 60px wide, fully rounded. Once per
   viewport. It is a brand mark, not a divider, not a progress indicator, not
   a state. It never sits on an interactive element and never changes color.
3. **The accent band** — a `--fl-accent` marketing band on a page that carries
   **no clinical imagery** (today: the pre-order section on index.html). The
   ramp enters as a wash from one corner, masked to nothing before it reaches
   copy, at or under 55% opacity. It is never the fill, and never appears on
   clinicians or patients pages, which both show plates.
4. **Nothing else.** Not buttons, not links, not borders, not underlines, not
   other backgrounds, not icons other than the mark.

Hard limits:

- **Never adjacent to lesion imagery.** A cool-to-warm ramp beside a clinical
  photograph reads as a severity scale — an interpretive claim the consumer
  product is not permitted to make. This was true of the old spectrum edge and
  is *more* true here, because blue-to-red is the canonical heatmap. Keep at
  least one full section between the ramp and any image plate, and prefer to
  keep it off those pages entirely.
- **Type: the wordmark only.** Gradient text is permitted for "flacara" and
  for nothing else. No gradient headlines, no gradient numbers, no gradient
  links. This is a logotype exemption, not a license.
- **Once per viewport for the pill.** Twice makes it a motif; a motif makes it
  decoration.

> **Superseded:** `--fl-spectrum` (`90deg, #4ECBE0 → #7B6FE0 → #C86FC0`) and its
> 2px-rule form are retired. The ramp replaces both the value and the component.
> Remove the token rather than leaving it available.

---

## 3. Typography

Three families, three jobs, one hard switch point.

### 3.1 Families

| Family | Role | Weights used |
|---|---|---|
| **Zalando Sans SemiExpanded** | Large display only — see the switch point below | 600 (incl. the wordmark, §5.0) |
| **Geist** | Everything else: subheads, body, UI, buttons, navigation | 400, 500, 600 |
| **Geist Mono** | Stats, measurements, figure captions, kickers. Used sparingly | 400, 500 |

**700 is not used in any family.** The brief is explicit that overselling reads as
a startup with something to prove, and bold display weights are the fastest way
to sound like one. 600 is the ceiling.

### 3.2 The switch point

**Zalando Sans SemiExpanded is used at 32px and above. Nothing below 32px uses
it.** Below that it stops reading as engraved panel lettering and starts reading
as merely wide, while eating horizontal space that small text can't spare.

Subheads at 24px and 19px are **Geist 600**, not SemiExpanded. This is the single
rule most likely to get broken; check it in review.

### 3.3 Scale

Root is 16px. Sizes in rem, shown here in px for legibility.

| Token | Family | Size | Line height | Tracking | Weight |
|---|---|---|---|---|---|
| `display-xl` | Zalando SemiExp | 64px | 1.00 | -0.03em | 600 |
| `display-l` | Zalando SemiExp | 48px | 1.02 | -0.028em | 600 |
| `display-m` | Zalando SemiExp | 36px | 1.06 | -0.024em | 600 |
| `title` | Geist | 24px | 1.20 | -0.015em | 600 |
| `subtitle` | Geist | 19px | 1.30 | -0.01em | 600 |
| `body-l` | Geist | 18px | 1.60 | 0 | 400 |
| `body` | Geist | 16px | 1.60 | 0 | 400 |
| `small` | Geist | 14px | 1.55 | 0 | 400 |
| `label` | Geist Mono | 11px | 1.40 | 0.14em | 500 · uppercase |
| `data` | Geist Mono | 13px | 1.50 | 0.02em | 400 · tabular |
| `caption` | Geist Mono | 12px | 1.55 | 0.02em | 400 |

Mobile: step `display-xl` down to 40px and `display-l` to 32px. SemiExpanded at
64px on a 375px viewport gives roughly three words per line.

### 3.4 Measure

- Body text: 62–72 characters. Hard cap 78.
- Display: **16 characters maximum per line.** SemiExpanded is wide; long
  headlines break badly. Write shorter headlines rather than shrinking the type.
- Mono data rows: no wrapping. If it doesn't fit, the table scrolls.

### 3.5 Using the mono sparingly

Geist Mono signals measurement. It stops signalling anything if it's everywhere.

**Yes:** spec values, resolution figures, prices in tables, figure numbers,
section kickers, timestamps, version and regulatory identifiers.

**No:** body copy, buttons, navigation, form labels, error messages, anything a
frightened person reads about their own skin. A patient's photo caption uses
mono for `FIG. 1` and the date, and Geist for anything resembling a sentence.

### 3.6 Numerals

Always `font-variant-numeric: tabular-nums` in tables, spec lists, price rows,
and any figure that changes. Proportional figures only in running prose.

### 3.7 Loading

Self-host. Do not call `fonts.googleapis.com` in production — for a health
product, a third-party request carrying visitor IPs on every page load is an
avoidable privacy exposure with actual regulatory history in the EU.

Both families are OFL. Install via `@fontsource` packages or download the static
weights listed in §3.1 and serve them locally as `woff2` with
`font-display: swap`.

For prototyping only:

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zalando+Sans+SemiExpanded:wght@500;600&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## 4. Layout, spacing, motion

**Spacing scale** (4px base): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160.
Nothing between steps. Section padding on desktop is 96 or 128; on mobile, 48.

**Radius:** 2px on image plates, 4px on inputs and buttons. 8px is the ceiling
for functional elements. The surface layer — cards, panels, bands, the nav
pill — uses `--fl-radius-card` (16px) and nothing else does.

**Borders:** 1px `--fl-rule`. Structural dividers may use `--fl-rule-strong`.
Never 2px+ except as a deliberate mark. Surfaces (cards, panels, bands, nav)
carry no border; their edge is `--lift-card` below.

**Grid:** 12 columns, 1200px max content width, 72px gutters desktop / 20px
mobile. Long-form clinical text sits in a 680px column regardless of viewport.

**Shadows:** none on functional UI — no buttons, inputs, menus, or plates.
Four fenced exceptions, all lit from top-left to agree with the ground (§2.5).
Three are on the brand layer; the fourth is the surface layer's soft edge:

```css
--lift-ico:     drop-shadow(0 9px 14px rgba(148,153,158,.42));  /* icon disc */
--lift-txt:     drop-shadow(0 9px 14px rgba(148,153,158,.38));  /* wordmark  */
--lift-outline: /* the emboss stack — see §5.5 */
--lift-card:    0 24px 48px -12px rgba(148,153,158,.28),
                0 2px 6px rgba(148,153,158,.10);                 /* cards, panels, bands, nav */
```

`--lift-card` replaces the outline on surfaces, it does not join it. A surface
with both a shadow and a 1px border is a card from a component library, not
this system. Only `.fl-card`, `.fl-panel`, `.fl-band`, and `.fl-nav` may use
it; never a button, input, plate, or table.

The wordmark uses `filter: drop-shadow()`, not `text-shadow`. With
`background-clip:text` the two behave differently; `drop-shadow` works off the
rendered alpha and follows the glyph edges correctly.

**Motion:** 120–180ms, `cubic-bezier(0.2, 0, 0, 1)`. No spring, no bounce, no
scale-up-on-hover. Hover states change color, not geometry. Honor
`prefers-reduced-motion: reduce` by dropping to 0ms.

Hero entrance is the one place a longer duration is allowed (700ms rise,
1100ms fade for the outline), staggered by `animation-delay`. Use a CSS
`animation`, not a JS-toggled class — above-the-fold content must not depend on
a script running.

---

## 5. Components

### 5.0 Logo

The wordmark is text, not a graphic asset: "flacara", lowercase, set in Zalando
Sans SemiExpanded **600**. Never any other family, never a different case
treatment.

Because it's set text, it inherits the switch point (§3.2) — never render it
below 32px. If a placement needs a smaller mark, that's a favicon/app-icon
problem, not a reason to shrink the wordmark.

#### The continuous lockup

The icon and the wordmark share **one** ramp rather than each carrying their
own. Two copies of the same gradient side by side read as a repeat; one ramp
interrupted by a gap reads as a single object.

- **Icon + wordmark together** — the disc takes stops 0→20% (`#C9DAF8` →
  `#CCD1EA`), the wordmark picks up at 20% and runs to 100% (`--fl-ramp-tail`).
- **Icon alone** — the disc carries the full ramp, `--fl-ramp`.

That is the whole rule. A standalone disc is never the 20% slice, and a lockup
disc is never the full ramp.

The three flames inside the disc are filled with the **page background color**,
not white — they are holes punched through the mark, not shapes painted on it.
Sample the value from wherever the mark actually sits.

```css
.fl-lock      { display:flex; align-items:center; gap:.2em; font-size:var(--lock-size); }
.fl-lock .ico { width:.88em; height:.88em; flex:none; --disc:url(#ramp-head); }
.fl-lock .logo{
  font-family: var(--fl-display);
  font-weight: 600;
  font-size: 1em;                  /* never resolves below 32px */
  letter-spacing: -.02em;
  background: var(--fl-ramp-tail);
  background-clip: text; -webkit-background-clip: text;
  color: transparent; -webkit-text-fill-color: transparent;
}
.ico.solo { --disc: url(#ramp-full); }   /* mark standing on its own */
```

#### Tagline lock

"Made to be compared." sets in **Geist 500, uppercase, 0.24em tracking, 13px**,
`--fl-muted`. It sits below the wordmark and is indented to align with the
wordmark's left edge, not the icon's — the icon plus gap is `1.08em` of the
lockup size:

```css
.fl-tagline { margin-left: calc(var(--lock-size) * 1.08); }
```

Derive that indent from the lockup size; never hard-code it. The two go out of
alignment the moment someone changes one and not the other.

> **Superseded:** the previous rule specified weight 500 and a flat
> `--fl-accent` fill. Both are retired. §3.1's "600 is the ceiling" still holds —
> the wordmark now sits at that ceiling rather than one step under it.

### 5.1 Image plate

The core component. Every photograph on the site uses it.

```
┌─ mat #2A2D30, 1px inset rim #404346, radius 2px ─┐
│                                                   │
│              [ photograph ]                       │
│                                                   │
└───────────────────────────────────────────────────┘
FIG. 1 — Lesion, polarized, 0 mo          ← Geist Mono 12px, --fl-muted
```

- Mat padding: 24px desktop, 16px mobile.
- Caption sits below the plate, left-aligned to its edge, never overlaid.
- Captions are numbered. `FIG. n` in mono, description in mono, no period at end.
- Comparison views place plates side by side at identical size with a single
  `--fl-rule-strong` divider between. Never crossfade or slider-wipe between two
  clinical images — it implies a transition that didn't happen.

### 5.2 Buttons

| | Background | Text | Border |
|---|---|---|---|
| Primary | `--fl-accent` | `--fl-on-accent` | none |
| Secondary | `--fl-accent-quiet` | `--fl-ink` | 1px `--fl-rule` |
| Tertiary | transparent | `--fl-accent` | none, underline on hover |

Geist 500, 15px, padding 10px/18px, radius 4px. Hover swaps primary fill to
`--fl-accent-hover`. Focus is a 2px `--fl-accent` outline at 2px offset — never
removed, never replaced with a shadow.

### 5.3 Spec tables

Where clinician density lives. Header row `--fl-sunken`, 1px `--fl-rule` between
rows, values in `data` (mono, tabular), labels in `small` (Geist). Right-align
numeric columns. Units belong in the header, not repeated per cell.

### 5.4 Links in prose

`--fl-accent`, underlined with a 1px offset of 2px. No color change on hover —
thicken the underline instead. Underlines stay on; removing them in body copy
costs more than it gains.

### 5.5 Product outline

A line drawing of the device, embossed into the lit ground. It is atmosphere,
not information — it never carries a label, a callout, or a dimension.

```css
.fl-outline {
  color: #F4F4F4;               /* stroke sits between the ground's two ends */
  filter:
    drop-shadow(-1.5px -1.5px 0   rgba(255,255,255,.95))   /* highlight, up-left */
    drop-shadow(0 3px 5px         rgba(178,184,192,.52))   /* contact */
    drop-shadow(0 12px 26px       rgba(178,184,192,.34));  /* ambient */
}
```

The emboss needs **both** cues. A shadow alone reads as a card floating above
the page; the up-left highlight is what makes it read as relief. That is why
the ground can't start at pure white (§2.5).

- **Stroke `#F4F4F4`** — deliberately between `#FCFCFC` and `#ECECEC`, so the
  outline reads darker than the ground at top-left and lighter at bottom-right.
  The polarity flips across the surface the way real relief does under raking
  light. A pure-white stroke loses this and looks flat.
- **Oversized and bled.** It is cropped by the viewport, never fully contained.
  Centre it on the right half (`left:75%`) beside a left-aligned lockup, or on
  the viewport for a centred one.
- **Centre the artwork, not the file.** The source SVG pads its artwork inside
  a 960×720 box. Tighten the `viewBox` to a square centred on the artwork bbox
  (currently `237.6 126.5 542 542`) or the drawing will sit off-centre.
- **Strip the duplicate paths.** Every shape appears twice in the export, once
  as an invisible fill and once as the stroke. Keep the stroked nine.
- **Never behind body copy, never near an image plate.** Headline-scale type
  only.

---

## 6. Voice

Two readers, one system. The type and color don't change between them; the
density does.

**Clinician pages** — measurements, methods, and the honest limits of what has
been tested. Use spec tables, mono figures, numbered plates. Don't simplify.
State what hasn't been quantified as plainly as what has: image quality was
comparable against a DermLite DL4 side by side, that hasn't been measured, and
the site should say exactly that.

**Consumer pages** — steady, never cheerful, never alarmed. No scores, no risk
framing, no implied verdict, no "don't worry." What the product offers is a clear
picture and a way to notice change; saying that plainly is more reassuring than
reassurance. Sentences stay short. The mono retreats almost entirely.

**Both** — restraint is the mechanism. The brand's competence shows in how
carefully the thing is made, not in what it says about itself.

---

## 7. Copy-paste

### 7.1 CSS custom properties

```css
:root {
  /* surfaces */
  --fl-ground:        #E3E5E6;
  --fl-surface:       #F2F4F5;
  --fl-sunken:        #D5D7D8;
  --fl-rule:          #BBBDBE;
  --fl-rule-strong:   #959798;

  /* text */
  --fl-ink:           #151616;
  --fl-muted:         #5F6060;

  /* accent */
  --fl-accent:        #3B3350;
  --fl-accent-hover:  #2C2540;
  --fl-accent-quiet:  #D2CEDA;
  --fl-on-accent:     #F8F6FB;

  /* imagery */
  --fl-mat:           #2A2D30;
  --fl-mat-edge:      #404346;
  --fl-mat-deep:      #1F2225;
  --fl-mat-raised:    #35383B;
  --fl-on-mat:        #EAECED;
  --fl-on-mat-muted:  #979A9C;
  --fl-accent-on-mat: #A79EC4;

  /* fenced: form validation only — see §2.4 */
  --fl-invalid:       #8C2F2F;

  /* the permitted gradients — see §2.4, §2.5, §2.6. There are no others. */
  --fl-sheen:      linear-gradient(163deg, #F2F4F5 0%, #E3E5E6 40%, #DCDEDF 66%, #EAECED 100%);
  --fl-sheen-dark: linear-gradient(163deg, #35383B 0%, #2A2D30 44%, #232629 70%, #303336 100%);
  --fl-brushed:    repeating-linear-gradient(178deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px);
  --fl-ground-lit: linear-gradient(135deg, #FCFCFC 0%, #ECECEC 100%);
  --fl-ramp:       linear-gradient(135deg, #C9DAF8 0%, #CECBDF 35%, #DB9D91 100%);
  --fl-ramp-tail:  linear-gradient(135deg, #CCD1EA 0%, #CECBDF 18.75%, #DB9D91 100%);

  /* fenced shadows — see §4 */
  --lift-ico: drop-shadow(0 9px 14px rgba(148,153,158,.42));
  --lift-txt: drop-shadow(0 9px 14px rgba(148,153,158,.38));
  --lift-outline: drop-shadow(-1.5px -1.5px 0 rgba(255,255,255,.95))
                  drop-shadow(0 3px 5px rgba(178,184,192,.52))
                  drop-shadow(0 12px 26px rgba(178,184,192,.34));
  --lift-card:    0 24px 48px -12px rgba(148,153,158,.28), 0 2px 6px rgba(148,153,158,.10);
  --fl-radius-card: 16px;

  /* type */
  --fl-display: 'Zalando Sans SemiExpanded', system-ui, sans-serif;
  --fl-text:    'Geist', system-ui, sans-serif;
  --fl-mono:    'Geist Mono', ui-monospace, monospace;

  /* motion */
  --fl-ease: cubic-bezier(0.2, 0, 0, 1);
  --fl-dur:  150ms;
}

body {
  background: var(--fl-ground);
  color: var(--fl-ink);
  font-family: var(--fl-text);
  font-size: 1rem;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* display — 32px and above only */
.fl-display-xl { font-family: var(--fl-display); font-weight: 600; font-size: 4rem;    line-height: 1.00; letter-spacing: -0.030em; max-width: 16ch; }
.fl-display-l  { font-family: var(--fl-display); font-weight: 600; font-size: 3rem;    line-height: 1.02; letter-spacing: -0.028em; max-width: 16ch; }
.fl-display-m  { font-family: var(--fl-display); font-weight: 600; font-size: 2.25rem; line-height: 1.06; letter-spacing: -0.024em; max-width: 16ch; }

/* below 32px it is Geist, never SemiExpanded */
.fl-title      { font-family: var(--fl-text); font-weight: 600; font-size: 1.5rem;   line-height: 1.20; letter-spacing: -0.015em; }
.fl-subtitle   { font-family: var(--fl-text); font-weight: 600; font-size: 1.1875rem; line-height: 1.30; letter-spacing: -0.010em; }
.fl-body       { font-size: 1rem; line-height: 1.6; max-width: 68ch; }

/* mono — sparingly */
.fl-label { font-family: var(--fl-mono); font-weight: 500; font-size: 0.6875rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fl-muted); }
.fl-data  { font-family: var(--fl-mono); font-size: 0.8125rem; letter-spacing: 0.02em; font-variant-numeric: tabular-nums; }

@media (max-width: 640px) {
  .fl-display-xl { font-size: 2.5rem; }
  .fl-display-l  { font-size: 2rem; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### 7.2 Tailwind v4

```css
@import "tailwindcss";

@theme {
  --color-ground:        #E3E5E6;
  --color-surface:       #F2F4F5;
  --color-sunken:        #D5D7D8;
  --color-rule:          #BBBDBE;
  --color-rule-strong:   #959798;
  --color-ink:           #151616;
  --color-muted:         #5F6060;
  --color-accent:        #3B3350;
  --color-accent-hover:  #2C2540;
  --color-accent-quiet:  #D2CEDA;
  --color-on-accent:     #F8F6FB;
  --color-mat:           #2A2D30;
  --color-mat-edge:      #404346;
  --color-mat-deep:      #1F2225;
  --color-mat-raised:    #35383B;
  --color-on-mat:        #EAECED;
  --color-on-mat-muted:  #979A9C;
  --color-accent-on-mat: #A79EC4;
  --color-invalid:       #8C2F2F;

  --font-display: 'Zalando Sans SemiExpanded', system-ui, sans-serif;
  --font-sans:    'Geist', system-ui, sans-serif;
  --font-mono:    'Geist Mono', ui-monospace, monospace;

  --radius-plate: 2px;
  --radius-input: 4px;
  --radius-card:  6px;

  --ease-fl:     cubic-bezier(0.2, 0, 0, 1);
  --shadow-none: none;
}
```

Tailwind's default shadow utilities are prohibited by §4, as is the whole
`bg-gradient-*` / `from-* via-* to-*` family — the permitted gradients are fixed
values in §7.1, not composable utilities. `rounded-full` is prohibited
everywhere except the accent pill (§2.6), which is better expressed as its own
component class than as a utility anyone can reach for. Consider removing these
from the build rather than relying on discipline.

---

## 8. Review checklist

Run this before calling any page done.

- [ ] No gradients beyond those listed in §7.1 — check SVG fills and CSS backgrounds
- [ ] Sheen under 8% lightness range, no hue shift, not behind body copy, not on a mat
- [ ] Lit ground is 135deg and does not start at `#FFFFFF`; shadows fall down-right to match
- [ ] Brand ramp appears only on the mark, one accent pill, and the accent band on a page with no plates
- [ ] Accent pill appears once per viewport and is not interactive
- [ ] Gradient text appears on the wordmark and nowhere else
- [ ] Lockup splits one ramp — disc 0→20%, wordmark 20→100%; a lone disc gets the full ramp
- [ ] Flames are filled with the page color behind the mark, not white
- [ ] Tagline indent is derived from the lockup size, not hard-coded
- [ ] No shadows outside the four fenced values in §4; surfaces with `--lift-card` have no border
- [ ] 16px radius on surfaces only; nothing inside a surface exceeds 8px
- [ ] Product outline has both cues — up-left highlight and down-right shadow
- [ ] No red / amber / green outside a form field
- [ ] Every photograph is on a `--fl-mat` plate with a numbered mono caption
- [ ] Nothing under 32px is set in Zalando Sans SemiExpanded
- [ ] Logo is "flacara", Zalando Sans SemiExpanded 600, never below 32px
- [ ] No 700 weight in any family
- [ ] Hero entrance is CSS animation, not a JS-toggled class
- [ ] Mono appears only on measurements, labels, captions, and figures
- [ ] Body measure between 62 and 78 characters
- [ ] Display lines under 16 characters
- [ ] Tabular figures on every table and spec value
- [ ] Focus outlines present and visible on all interactive elements
- [ ] Fonts served locally, not from Google
- [ ] Price stated as a fact, with no comparison framing
- [ ] Consumer copy contains no score, verdict, risk level, or reassurance
