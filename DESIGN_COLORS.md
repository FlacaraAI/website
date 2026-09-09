# Flacara — Color Palette

There are only two brand colors: **blue** and **red**. Everything else in the
system is a neutral (structural) or a rule about how blue and red may combine.

## The two colors

| Role | Token | Hex | Use |
|---|---|---|---|
| Blue | `--fl-blue` | `#C9DAF8` | Base tint — badges, secondary buttons, cool highlights |
| Blue, deep | `--fl-blue-deep` | `#9DBBEA` | Hover/emphasis state for blue elements |
| Blue, quiet | `--fl-blue-quiet` | `#EBF1FC` | Large light fills — card backdrops, tag backgrounds |
| Red | `--fl-red` | `#DB9D91` | Base tint — primary CTA, warm highlights |
| Red, deep | `--fl-red-deep` | `#C67C6D` | Hover/emphasis state for red elements |
| Red, quiet | `--fl-red-quiet` | `#F5E7E4` | Large light fills — card backdrops |
| Text on blue | `--fl-on-blue` | `#151616` | Ink, unchanged across states |
| Text on red | `--fl-on-red` | `#151616` | Ink, unchanged across states |

## The rule on lavender / purple

**Lavender is not a color of ours.** The pale purple (`#CECBDF`) some elements
show is not a third brand color — it is the interpolated 35% stop of the
blue → red gradient (`--fl-ramp`, see below) and nothing else. It must never
be:

- assigned to a standalone fill, background, border, or text color
- exposed as its own design token
- used anywhere the ramp gradient itself isn't rendering

If a lavender value appears anywhere outside a `linear-gradient(...)`
declaration or an SVG `<stop>` inside a gradient, it is a bug — replace it
with `--fl-blue` or `--fl-red` (or one of their `-deep` / `-quiet` variants).

## The gradients (only permitted lavender sighting)

```css
--fl-ramp:       linear-gradient(135deg, #C9DAF8 0%, #CECBDF 35%, #DB9D91 100%);
--fl-ramp-tail:  linear-gradient(135deg, #CCD1EA 0%, #CECBDF 18.75%, #DB9D91 100%);
```

Blue and red are the endpoints; the pale purple in the middle is what you get
for free when you blend them — it is a byproduct, not a design decision.

## Semantic split: two colors, two device lines

Blue and red now also carry meaning across the product line:

- **Blue** — the standard "for home" device (`fl-device__for`, `fl-device__frame`, homepage devices section)
- **Red** — the aluminium / specialist edition (`fl-buy__shot` on clinicians.html), and the primary call-to-action everywhere (`fl-btn--primary`)

## Neutrals (unchanged — structural, not "colors")

| Token | Hex |
|---|---|
| `--fl-ground` | `#E3E5E6` |
| `--fl-surface` | `#F2F4F5` |
| `--fl-sunken` | `#D5D7D8` |
| `--fl-rule` | `#BBBDBE` |
| `--fl-rule-strong` | `#959798` |
| `--fl-ink` | `#151616` |
| `--fl-muted` | `#5F6060` |
| `--fl-mat` (dark surface) | `#2A2D30` |
| `--fl-invalid` (form errors only) | `#8C2F2F` |

See `flacara_ramp_check.png` / `.svg` for the isolated blue/red endpoint swatches, and `flacara_palette.png` / `.svg` for the full neutral + brand palette rendered as an image.
