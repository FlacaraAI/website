# images/

**Image convention.** All photographs live in `images/`:
- `images/target-flacara.jpg`, `images/target-dl4.jpg` — resolution test target, matched pair
- `images/lesion-01-flacara.jpg`, `images/lesion-01-dl4.jpg` — lesion, matched pair; `02`, `03`… for more
- `images/sample-01.jpg` — single Flacara capture, no comparison
- `flacara_full.png` (project root) — the device render, already used in `hero.html`

Check whether each file exists before referencing it. If a file is missing, render a
placeholder slot of the same size on the mat with a mono label naming the expected
filename (e.g. `images/target-dl4.jpg — pending`). Never substitute a stock image, never
draw a fake lesion, never invent a photo.

Missing files render as pending placeholder slots (`.fl-plate.is-pending` with `data-file`).
