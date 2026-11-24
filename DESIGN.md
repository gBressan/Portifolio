# Field Instruments

*A design philosophy, written with the `canvas-design` method before the site was rebuilt.*

## The movement

**Field Instruments** treats every surface as the faceplate of a precision device and every page as a plate from a field notebook. A calm, graphite ground. Hairline rules engraved rather than drawn. Measurement marks along every edge, as if the page itself could be used to take a reading. Nothing glows and nothing floats; things are *calibrated*. The work should feel like an instrument built by someone who has spent years at the bench: meticulously crafted, painstakingly aligned, every tolerance checked twice.

## Space and form

Space is organised the way a technical plate is organised: a fixed spine of reference on one side, a measured field on the other. Forms are rectangles with true corners, small radii at most, and they are framed by crop marks and registration ticks rather than shadows. Density is allowed, even welcomed, but only as patient accumulation: fields of small identical marks, rulers with hundreds of ticks, indices that count upward without skipping. The eye should be rewarded for staying longer. Each alignment is the product of countless small refinements, never approximate.

## Colour and material

The palette is deliberately narrow: graphite and bone, warm paper grey for daylight, and a single signal orange — the colour of a pilot lamp, a calibration flag, a warning tag on a valve. Orange appears only where something is *selected*, *measured* or *active*. A muted steel blue is the instrument's secondary ink, used for annotation and never for emphasis. Surfaces carry the faintest grain, like matte anodised metal or uncoated stock, so the screen reads as a material rather than a light. This restraint is itself the craft: master-level execution means saying everything with almost nothing.

## Scale and rhythm

Scale is bimodal. Display type is large, thin and quiet — a high-contrast serif set with care, its italics reserved for the single word that matters. Everything else is small: monospaced labels in widely tracked capitals, figure numbers, units, coordinates. Between the two extremes there is almost nothing, and that gap is the rhythm. Repetition is structural: the same section marker, the same ruler, the same index numbering returns every time, so the whole reads as one meticulously engineered system rather than a collection of pages.

## Composition and hierarchy

Information is shown before it is told. A diagram of a measurement says more than a paragraph about it; a numbered figure with a short caption outranks any headline. Hierarchy comes from position and weight, never from colour floods or decoration. Text is sparse and clinical — labels, captions, readouts — set into the composition as if engraved. The result must look like the work of someone at the absolute top of their field: an artifact that proves something invisible can be observed, plotted and understood through careful attention.

---

## The subtle reference

The hidden subject is **retrieval and gating**: how a system decides what is relevant (nearest neighbours in an embedding space, a similarity threshold) and what is *allowed* (a gate that opens only when the state permits). It appears as the hero plate — a field of points, a query, its nearest neighbours ringed in orange inside a dashed threshold — and as the general sense that every element on the page has been measured before it was admitted. Those who build these systems will recognise it; everyone else sees a calm technical plate.

## System tokens

| Token | Dark | Light |
| --- | --- | --- |
| Ground | `#121211` graphite | `#E8E6E0` paper grey |
| Ink | `#ECE9E1` bone | `#151514` graphite |
| Signal | `#FF5A1F` | `#BF3A08` |
| Annotation | `#93A8BD` steel | `#4E6A86` steel |

- Display: **Instrument Serif** (italic for the single emphasised word)
- Text: **Instrument Sans**
- Labels, figures, units: **IBM Plex Mono**, uppercase, tracked `0.16–0.2em`
- Fonts chosen from the `canvas-design` skill's font set.
