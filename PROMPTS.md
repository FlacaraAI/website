# Flacara site — subagent prompt package

Written 2026-09-07. Builds `index.html`, `clinicians.html`, `patients.html`, and a shared
`flacara.css` from the finished `hero.html`, `BRAND_BRIEF.md`, and `DESIGN_SYSTEM.md`.

---

## How to use this file

**Single-chat flow. One paste.**

1. **Before anything**, put your photographs in an `images/` folder next to this file,
   renamed to the convention in Block 0 below. Missing files become labeled placeholder
   slots; nothing breaks.
2. Open **one** new Fable 5.1 chat in this project folder. Copy everything from the line
   `===== MASTER PROMPT =====` to the end of this file and paste it as a single message.
   That is the only paste.
3. The chat becomes the orchestrator. It runs Stage 1 (foundation) with a builder and a
   reviewer subagent, then spawns three page pipelines in parallel (Stages 2, 3, 4), then
   runs Stage 5 (cross-page pass), then prints one combined table of results and residue.
   It takes a while. Don't interrupt it.
4. If the chat stops early (context limit, error), reply `continue from stage N` where N is
   the last stage it reported complete. Stages are idempotent: each checks whether its
   output files already exist before rebuilding.
5. The paragraph marked **DESIGN DIRECTION (REMOVABLE)** in Block 0 is a constraint you may
   want to drop later. Delete that paragraph before pasting to remove it everywhere.
6. **Fallback, multi-chat.** Each Stage block is self-contained. If the single chat fails
   repeatedly, paste Block 0 plus one Stage block into a fresh chat. Stage 1 first, alone.
   Stages 2, 3, 4 in any order after Stage 1 exists on disk. Stage 5 last. Never paste two
   page stages into one chat, and never paste Block 0 alone.
7. What you get back: a table per stage of numbered requirements with PASS/FAIL, and a
   residue list of anything the fix pass did not resolve. Residue is yours to decide on.

---

===== MASTER PROMPT =====

You are the orchestrator for building the Flacara website. Do not build pages yourself.
Spawn subagents with the Agent tool. Every subagent receives **Block 0 verbatim** plus its
own Stage block and role instructions. Keep subagent reports short: the PASS/FAIL table,
not file contents.

Order:
1. **Stage 1** first, alone. Builder → Reviewer → Fix (FAIL rows only) → Confirm.
   Wait for its report before continuing.
2. **Stages 2, 3, 4** — spawn all three builders in one message so they run in parallel.
   As each builder finishes, spawn its reviewer; then a fix subagent with only the FAIL
   rows; then the reviewer again to confirm only those rows.
3. **Stage 5** after all three pages are confirmed.
4. Finish with one table: stage, requirements passed / total, residue items (one line each).

Before starting any stage, check whether its output files exist. If they do, skip the
builder and run the reviewer only, unless the user said `rebuild stage N`.

---

## BLOCK 0 — shared context (pass to every subagent verbatim)

**Read, in this order, before doing anything:** `BRAND_BRIEF.md`, `DESIGN_SYSTEM.md`,
`hero.html`, then `flacara.css` and `partials/*.html` if they exist. Where the brief and
the design system disagree, the brief wins. Every value in the design system is a
decision, not a suggestion; if something isn't covered, take the quieter option.

**Files.** Static HTML, no build step, no JavaScript unless a stage says so. Every page
links `flacara.css` with `<link rel="stylesheet" href="flacara.css">`. Google Fonts are
allowed for this prototype only; every page keeps the header comment from `hero.html`
about self-hosting in production (DESIGN_SYSTEM §3.7). Font link to use:

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zalando+Sans+SemiExpanded:wght@600&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Image convention.** All photographs live in `images/`:
- `images/target-flacara.jpg`, `images/target-dl4.jpg` — resolution test target, matched pair
- `images/lesion-01-flacara.jpg`, `images/lesion-01-dl4.jpg` — lesion, matched pair; `02`, `03`… for more
- `images/sample-01.jpg` — single Flacara capture, no comparison
- `flacara_full.png` (project root) — the device render, already used in `hero.html`

Check whether each file exists before referencing it. If a file is missing, render a
placeholder slot of the same size on the mat with a mono label naming the expected
filename (e.g. `images/target-dl4.jpg — pending`). Never substitute a stock image, never
draw a fake lesion, never invent a photo.

**Hard rules most likely to break** (all from DESIGN_SYSTEM; the section numbers are the
authority):
- The brand ramp (§2.6) appears only on the mark and one accent pill per viewport, and
  never on a page that shows lesion or test-target imagery. Gradient text: wordmark only.
- Nothing below 32px is set in Zalando Sans SemiExpanded (§3.2). Subheads are Geist 600.
- No 700 weight in any family (§3.1).
- No red, amber, or green anywhere (§1.1). `--fl-invalid` is never used on a page with
  lesion imagery (§2.4); form validation on those pages is text only.
- Every photograph sits on a `--fl-mat` plate with a numbered mono `FIG. n` caption (§5.1).
  Comparison plates: identical size, one `--fl-rule-strong` divider, no crossfade or slider.
- Price appears only as a fact in a spec list or pre-order section (§1.3). No "only", no
  "just", no struck-through comparison, no discount framing.
- The no-optics approach is a footnote sentence in technical copy, never a headline (§1.4).
- Corner radius: 2px plates, 4px inputs and buttons, 6px cards, 8px ceiling (§4).
- No shadows on functional UI (§4). The three fenced brand-layer shadows are the only ones.
- Geist Mono only on measurements, labels, captions, figures, kickers (§3.5). Never body,
  buttons, nav, form labels, or anything a frightened person reads about their skin.
- Display lines ≤16 characters. Body measure 62–78 characters (§3.4).
- `font-variant-numeric: tabular-nums` on every table and spec value (§3.6).
- Focus outlines present and visible on every interactive element (§5.2).
- Motion 120–180ms, `cubic-bezier(0.2,0,0,1)`, color changes only on hover, honor
  `prefers-reduced-motion` (§4).
- Spacing only from the 4px scale: 4 8 12 16 24 32 48 64 96 128 160. Section padding 96 or
  128 desktop, 48 mobile. Grid 1200px max, 72px gutters desktop, 20px mobile. Long-form
  clinical text in a 680px column (§4).

**Two voices (§6).** Clinician pages: dense, measurements, methods, honest limits. State
what has not been measured as plainly as what has. Consumer pages: steady, never cheerful,
never alarmed. Short sentences. No score, no verdict, no risk framing, no "don't worry", no
reassurance. What the product offers is a clear picture and a way to notice change; say
that plainly. Both: restraint is the mechanism.

**Facts you may state** (from `BRAND_BRIEF.md`; do not add others):
- Housing seats over the iPhone camera array and supplies the light. No added lens.
- Polarized and unpolarized LEDs alternate at the press of a button. USB-C charging.
- Resolution approximately 40 microns, from the phone sensor and software.
- Consumer version: polarized light only, $199, makes no diagnostic claim.
- Dermatologist version: both lighting modes, $249, FDA pre-submission in progress.
- Prices are directional and may move.
- Side by side against a DermLite DL4, image quality was comparable. This has not been
  quantified. Prototypes are with clinicians; the company is between prototype and pilot.
- Do not state competitor prices anywhere on the site.

**DESIGN DIRECTION (REMOVABLE).** The site should feel minimalist and avant-garde: not the
default web look of the moment. Explicitly banned: bento grids, thick rounded corners on
cards, carousels of any kind, logo or partner walls, testimonial sliders, animated stat
counters, icon-in-circle feature grids, cards that scale on hover, gradient blobs, glass
or blur panels, three-column "feature" rows with icons. Prefer asymmetry, hairline rules,
large type with generous space, editorial pacing, one thing per screen. If a layout would
look at home on a SaaS template, it is wrong.

**Subagent protocol.**
- **Builder.** Writes the file(s). The numbered requirements in its Stage block are a
  checklist; every one must be satisfied. Before returning, runs DESIGN_SYSTEM §8 as a
  self-check and fixes what it finds. Returns: files written, one line per requirement
  saying how it was met.
- **Reviewer.** Read-only. Never edits a file. Reads the built file(s), the Stage block,
  and DESIGN_SYSTEM. Returns three tables: (a) each numbered requirement with PASS or FAIL
  and a line-number reference as evidence; (b) each DESIGN_SYSTEM §8 checklist item with
  PASS or FAIL and evidence; (c) any DESIGN DIRECTION ban that is violated, with evidence.
  A FAIL needs a one-line reason. If a browser tool is available, also open the page at
  1440×900 and 375×812 and report anything that only shows when rendered.
- **Fix.** A builder subagent receives only the FAIL rows. Fixes those and nothing else.
  No scope creep, no restyling of passing sections.
- **Confirm.** The reviewer re-checks only the previously failed rows.
- **Report.** The orchestrator prints the final tables. Anything still FAIL after the fix
  pass is residue for the user. One fix round only.

---

## STAGE 1 — foundation

Outputs: `flacara.css`, `partials/nav.html`, `partials/footer.html`, `images/README.md`,
`foundation-check.html`. Skip the builder if all five exist.

Builder requirements:

1. `flacara.css` begins with the DESIGN_SYSTEM §7.1 `:root` block verbatim, then adds the
   tokens `hero.html` defines that §7.1 does not: `--lock-size`, `--icon-span`, `--d0`,
   `--trace`, `--hold`, `--swap`. Token hex values match §2.1 exactly.
2. Body rule from §7.1. Marketing pages override background with `--fl-ground-lit` via a
   `.fl-lit` class on `<body>`; app-style flat `--fl-ground` is the default.
3. Type classes from §7.1 (`.fl-display-xl/l/m`, `.fl-title`, `.fl-subtitle`, `.fl-body`,
   `.fl-label`, `.fl-data`) plus `.fl-caption` (Geist Mono 12px, 1.55, 0.02em, `--fl-muted`)
   and `.fl-small` (Geist 14px, 1.55). Mobile display steps per §3.3.
4. `.fl-plate` per §5.1: mat `--fl-mat`, 1px inset rim `--fl-mat-edge` (use `box-shadow:
   inset 0 0 0 1px` — this is a rim, not a shadow, note it in a comment), radius 2px,
   padding 24px desktop / 16px mobile, `<img>` block-level and `max-width:100%`. Caption
   is a sibling element below the plate, left-aligned to its edge, `.fl-caption`.
   A `.fl-plate.is-pending` variant renders a placeholder slot: same mat, aspect-ratio
   1/1, centered mono label from a `data-file` attribute.
5. `.fl-compare`: two `.fl-plate` figures side by side at identical width, one vertical
   1px `--fl-rule-strong` divider between them, stacking vertically under 720px with the
   divider becoming horizontal. No transitions between images.
6. `.fl-btn` with `--primary`, `--secondary`, `--tertiary` modifiers per §5.2. Geist 500,
   15px, padding 10px 18px, radius 4px, no shadow, hover per table, focus 2px `--fl-accent`
   outline at 2px offset.
7. `.fl-table` per §5.3: header row `--fl-sunken`, 1px `--fl-rule` between rows, values
   `.fl-data`, labels `.fl-small`, numeric columns right-aligned, tabular numerals, no
   wrapping in data cells (`overflow-x:auto` on a wrapper).
8. `.fl-nav`: sticky top, `--fl-surface` background, 1px `--fl-rule` bottom border, no
   shadow, 64px tall, contents on the 1200px grid. Left: the mark. Right: links then a
   `.fl-btn--primary` "Pre-order". Links are Geist 500 15px `--fl-ink`, underline on hover.
9. `.fl-footer`: 1px `--fl-rule` top border, padding 64px 0, wordmark left, links and
   regulatory sentence right, `.fl-small`.
10. `.fl-section` with padding 96px 0 desktop, 48px 0 mobile; `.fl-section--tall` at 128px.
    `.fl-wrap` 1200px max, 72px side padding desktop / 20px mobile. `.fl-prose` 680px max.
11. `.fl-form`: stacked label (Geist 500 14px), input (Geist 16px, 1px `--fl-rule`
    border, 4px radius, `--fl-surface` background, focus outline per §5.2), and a
    `.fl-form__error` element that is Geist 14px `--fl-muted` text with no color change.
    Comment in the CSS: "text-only validation. `--fl-invalid` is barred from pages with
    lesion imagery (§2.4); two of three pages have it, so validation is text-only on all
    three for consistency."
12. The mark. Copy the `<svg>` symbol block (`#fl-icon`, both gradients, the flame filter)
    from `hero.html` into `partials/mark.html` unchanged, and copy the `.lock`, `.ico`,
    `.logo`, `.solo`, `.tag`, `.pill` rules from `hero.html` into `flacara.css` under the
    class names `.fl-lock`, `.fl-lock .ico`, `.fl-lock .logo`, `.ico.solo`, `.fl-tagline`,
    `.fl-pill`. Add `.fl-wordmark--flat`: same family, weight, size and tracking as the
    wordmark, but `color: var(--fl-ink)` with no gradient and no filter. It never renders
    below 32px (`font-size: max(2rem, …)`).
13. `partials/nav.html` contains two complete `<nav class="fl-nav">` blocks separated by
    HTML comments: `<!-- nav-ramp: index.html only -->` (mark is the solo disc via
    `<svg class="ico solo"><use href="#fl-icon"/></svg>` at 40px, no wordmark, links Home /
    Clinicians / Patients, Pre-order button) and `<!-- nav-flat: clinicians.html and
    patients.html -->` (mark is `<a class="fl-wordmark--flat" href="index.html">flacara</a>`
    at 32px, same links, same button). Pre-order button `href="#pre-order"`. Current page
    link carries `aria-current="page"` (pages set this when they paste the partial).
14. `partials/footer.html`: one `<footer class="fl-footer">`. Left: `flacara` in
    `.fl-wordmark--flat` at 32px. Right: links Home / Clinicians / Patients, then one
    sentence: "The consumer version makes no diagnostic claim. The dermatologist version
    is the subject of an FDA pre-submission in progress." No social links, no year.
15. `images/README.md`: the image convention from Block 0, verbatim, plus one line saying
    missing files render as pending placeholder slots.
16. `foundation-check.html`: links `flacara.css`, includes `partials/mark.html` inline,
    renders both nav variants, every type class with sample text, one `.fl-plate` with a
    pending slot, one `.fl-compare` with two pending slots, all three buttons in rest and
    focus, one `.fl-table` with three rows, one `.fl-form` with an error state showing,
    the footer. Body has `.fl-lit`. This file exists for review only.

Reviewer, in addition to the protocol: diff every hex value in `flacara.css` against
DESIGN_SYSTEM §2.1 and §2.2 and FAIL on any mismatch; confirm no `box-shadow` or
`filter: drop-shadow` outside the three fenced brand-layer values and the plate rim;
confirm `.fl-wordmark--flat` cannot resolve below 32px.

---

## STAGE 2 — `index.html`

Depends on Stage 1. Output: `index.html`. Body class `fl-lit`.

Builder requirements:

1. Head: title "Flacara", font link from Block 0, the self-hosting comment from
   `hero.html`, link to `flacara.css`. No page-local `<style>` except what the hero needs
   from `hero.html` that is not already in `flacara.css` (the outline draw-on, the
   hand-off, `.stage`, `.outline`, `.device`, `.r`, `.ro`). Move those rules in unchanged.
2. Inline `partials/mark.html` once, first thing inside `<body>`.
3. Nav: the `nav-ramp` variant from `partials/nav.html`, Home marked `aria-current`.
4. Hero: the `<section class="hero">` from `hero.html` unchanged in markup and behavior.
   Adjust top padding so it sits under the sticky 64px nav without the lockup moving up.
   The pill in the hero is the one accent pill for this viewport; no other pill on the page.
   Entrance remains CSS animation; no JavaScript anywhere on this page.
5. Fork section: two panels of equal width on the lit ground, a single vertical 1px
   `--fl-rule` between them, stacking under 720px. Each panel: `.fl-subtitle` heading
   ("For clinicians" / "For patients"), one sentence in `.fl-body`, one `.fl-btn--tertiary`
   link. Clinician sentence: "Compared against a DermLite DL4, side by side." linking to
   `clinicians.html`. Patient sentence: "A clear picture of a spot, and a record of it."
   linking to `patients.html`. No prices, no primary buttons, no icons.
6. The instrument section: `flacara_full.png` on the lit ground, no mat (it is a device,
   not a photograph of skin). Beside it, three `.fl-data` lines with `.fl-label` kickers:
   `RESOLUTION` / `~40 µm`, `ILLUMINATION` / `Polarized · Unpolarized`, `CHARGING` /
   `USB-C`. One `.fl-small` sentence below in Geist: "There is no added lens; the image
   comes from the phone's sensor and the software behind it." That is the only no-optics
   mention on this page. No price here.
7. `#pre-order` section, `.fl-section--tall`: `.fl-display-m` heading "Pre-order" (9
   characters). Two columns under a shared top rule: "Consumer" and "Dermatologist", each
   a definition list styled with `.fl-table` rows: Illumination, Intended use, Price.
   Price cells: `$199` and `$249` in `.fl-data`, followed on the next row by a
   `.fl-caption` "Directional; may change before launch." Intended use, consumer: "A clear
   image of a spot and a record of how it changes. Makes no diagnostic claim."
   Dermatologist: "Working diagnostic instrument. FDA pre-submission in progress."
   Below both columns, one `.fl-form`: email input (`type="email"`, `required`), a radio
   group "Version" with the two options, a `.fl-btn--primary` "Pre-order". Under the
   button, `.fl-small`: "No payment is taken now. We will email you when units ship."
   Form `action="#"` with `method="post"`; no JavaScript; browser-native validation only,
   with the `.fl-form__error` element present but empty.
8. Footer from `partials/footer.html`.
9. Every section uses `.fl-wrap`. Spacing only from the 4px scale.
10. Body copy measure 62–78ch; every display line ≤16 characters.

Page rules for the reviewer: the ramp appears on the disc in the nav, the disc and
wordmark in the hero, and the hero pill; nowhere else. No lesion or test-target imagery on
this page. No JavaScript. Hero markup byte-equivalent to `hero.html` aside from the
padding change and the moved styles.

---

## STAGE 3 — `clinicians.html`

Depends on Stage 1. Output: `clinicians.html`. Body class `fl-lit`.

Builder requirements:

1. Head as in Stage 2 requirement 1, title "Flacara for clinicians". No inline `<style>`.
2. Nav: the `nav-flat` variant, Clinicians marked `aria-current`. No `partials/mark.html`
   on this page; no disc, no gradient, no pill anywhere.
3. Opening section: a `.fl-display-l` headline of at most 16 characters. Draft three in an
   HTML comment, then use one. Below it, in `.fl-prose`, one `.fl-body` paragraph at
   18px (`body-l`) that contains this sentence or a close paraphrase preserving every
   fact: "Side by side against a DermLite DL4, image quality was comparable. That has not
   been quantified. Prototypes are with clinicians now." This sentence is mandatory and
   must appear before any image.
4. Comparison section, resolution target first. `.fl-label` kicker `COMPARISON`. One
   `.fl-compare` with `images/target-flacara.jpg` left and `images/target-dl4.jpg` right,
   captions `FIG. 1 — Resolution target, Flacara` and `FIG. 2 — Resolution target,
   DermLite DL4`. Add the lighting mode to the caption only if `images/README.md` or the
   filenames state it; otherwise omit it. Under the pair, one `.fl-small` Geist sentence:
   "Same target, same working distance, same session." Then one `.fl-compare` per lesion
   pair found in `images/` (`lesion-NN-*`), numbered on from FIG. 3, captions
   `FIG. n — Lesion NN, Flacara` / `FIG. n — Lesion NN, DermLite DL4`, same sentence
   pattern beneath. Missing files render pending slots. No color, no arrows, no
   annotations on or near any plate. Nothing between the plates but the divider.
5. Method section: `.fl-title` "How the image is made". `.fl-prose`, three short paragraphs:
   (a) the housing seats over the iPhone camera array and supplies the light; (b)
   polarized and unpolarized LEDs alternate at a button press, charged over USB-C; (c) the
   image comes from the phone's sensor and the software behind it, at approximately
   40 microns. Then, as a final `.fl-small` paragraph set apart by a hairline rule: "There
   is no added lens. That is why the device costs what it does." Nothing about optics
   appears in any heading.
6. Specification table: `.fl-title` "Specification". One `.fl-table`, columns
   Specification / Consumer / Dermatologist. Rows: Resolution (µm in header) — `~40` both;
   Illumination — `Polarized` / `Polarized · Unpolarized`; Magnification approach — "Phone
   sensor and software; no added optics" both; Charging — `USB-C` both; Phone — `iPhone`
   both; Price (USD in header) — `199` / `249`; Regulatory status — "No diagnostic claim"
   / "FDA pre-submission in progress". Tabular numerals. A `.fl-caption` under the table:
   "Prices are directional and may change before launch."
7. Regulatory section: `.fl-title` "Regulatory status". Two sentences in `.fl-prose`: the
   dermatologist version is the subject of an FDA pre-submission in progress; the consumer
   version makes no diagnostic claim and is not intended for diagnosis. No more.
8. `#pre-order` section, `.fl-section--tall`: `.fl-display-m` "Pre-order". One `.fl-small`
   line: "Dermatologist version. $249, directional." One `.fl-form`: email (`type="email"`,
   `required`), practice name (text, optional), `.fl-btn--primary` "Pre-order". Under it,
   `.fl-small`: "No payment is taken now. We will email you when units ship." Text-only
   validation; `--fl-invalid` must not appear on this page.
9. Footer from `partials/footer.html`.
10. Last line of the file: `<!-- future section: Workflow (body mapping, on-phone
    comparison, single upload path). See BRAND_BRIEF "The workflow it replaces". -->`
11. All prose in `.fl-prose` (680px). Mono only on kickers, captions, table values, price.
    Display lines ≤16 characters. Body 62–78ch.

Page rules for the reviewer: grep the file for `ramp`, `pill`, `fl-icon`, `#ramp`,
`--fl-invalid`, `linear-gradient` and FAIL on any hit. Every `<img>` is inside
`.fl-plate`. Every plate has a `FIG. n` caption and the numbers are sequential.

---

## STAGE 4 — `patients.html`

Depends on Stage 1. Output: `patients.html`. Body class `fl-lit`.

Builder requirements:

1. Head as in Stage 2 requirement 1, title "Flacara". No inline `<style>`.
2. Nav: the `nav-flat` variant, Patients marked `aria-current`. No mark partial, no disc,
   no gradient, no pill anywhere on this page.
3. Opening section: `.fl-display-l` headline of at most 16 characters, steady in tone.
   Draft three in an HTML comment, use one. Below it, `.fl-prose`, two short sentences in
   `body-l`. They describe what the device gives you: a clear picture of a spot, and a way
   to see whether it has changed. No "worry", no "peace of mind", no "early", no "risk",
   no "safe", no "detect".
4. One plate: `.fl-plate` with `images/sample-01.jpg`, caption `FIG. 1 — Skin, Flacara`.
   Beneath the caption, one Geist `.fl-small` sentence saying what the picture is, for
   example "A mole on a forearm, photographed with the consumer device." Nothing that
   interprets the image. Pending slot if the file is missing.
5. "What it does not do" section: `.fl-title` with that heading. `.fl-prose`, three short
   sentences: it does not score a spot; it does not tell you whether a spot is a problem;
   it gives you a clear picture you can show a dermatologist. Plain declaratives, no
   softening.
6. The instrument section: `.fl-title` "The device". Short definition list in `.fl-table`
   rows: Light — `Polarized`; Charging — `USB-C`; Works with — `iPhone`; Price (USD) —
   `199`. `.fl-caption` beneath: "Directional; may change before launch." No other numbers
   on this page.
7. `#pre-order` section, `.fl-section--tall`: `.fl-display-m` "Pre-order". One `.fl-form`:
   email (`type="email"`, `required`), `.fl-btn--primary` "Pre-order". Under it,
   `.fl-small`: "No payment is taken now. We will email you when units ship." Text-only
   validation; `--fl-invalid` must not appear.
8. Footer from `partials/footer.html`.
9. Last line of the file: `<!-- future section: How you use it (three steps). -->`
10. Mono appears only on the plate caption, the `.fl-label` kickers if any, and the table
    values. Every sentence on the page is under 20 words. Display lines ≤16 characters.

Page rules for the reviewer: same greps as Stage 3. Additionally grep for the words
`worry`, `peace`, `early`, `risk`, `safe`, `detect`, `score`, `cancer`, `melanoma`,
`healthy`, `normal` and FAIL on any hit in visible copy. Confirm the voice against
DESIGN_SYSTEM §6 consumer paragraph.

---

## STAGE 5 — cross-page pass

Depends on Stages 2, 3, 4. Spawn one reviewer, then one fix builder only if there are
FAIL rows, then the reviewer to confirm.

Reviewer requirements:

1. Nav markup is identical across the three pages except the mark variant and
   `aria-current`. Footer markup is identical across all three.
2. No page defines a token (`--fl-*`) locally; all come from `flacara.css`. `index.html`
   may carry the hero-only rules moved in Stage 2 and nothing else in `<style>`.
3. Every page has exactly one element with `id="pre-order"` and the nav button targets it.
4. The ramp, the disc, the gradient wordmark, and the pill exist only in `index.html`.
   `clinicians.html` and `patients.html` contain none of them.
5. No wordmark on any page can resolve below 32px.
6. Voice: read two paragraphs from each page against DESIGN_SYSTEM §6. Clinician page
   states the unquantified comparison. Patient page has no score, verdict, risk framing,
   or reassurance.
7. If a browser tool is available, open each page at 1440×900 and 375×812. FAIL on any
   horizontal scroll, any overlapping text, any display line that wraps past 16
   characters, any nav that covers content. If no browser tool, read the media queries and
   report which of these cannot be verified.
8. DESIGN_SYSTEM §8 checklist across all three pages as one table, with the page named in
   each evidence cell.

Fix builder: FAIL rows only, minimal edits, no restyling. Reviewer confirms those rows.
Orchestrator prints the final combined table and the residue list, then stops.

===== END MASTER PROMPT =====
