# Journal UI art source archive

Generated raster assets for the journal UI are kept under `public/assets/interface/journal/`; this folder holds superseded variants removed from the shipped asset directory. No UI code is stored here.

## Archived variants

- `hero-portrait.png`: earlier portrait with a more realistic/adult face; superseded by `hero-portrait-chibi.png`.
- `icon-helmet.png`: equipment icon variant; superseded by the requested tunic icon.
- `journal-tab.png`: earlier tab with a visible brown ambient haze; not used by the parent integration.

## Prompt brief and provenance

The raster art was generated with the built-in ImageGen tool, using the approved journal mockup at `C:/Users/Tommy/.codex/generated_images/01a14f6c-3e65-72a0-890a-670370c2b3a5/exec-61bd2d0e-80b8-429a-a429-8fba69548178.png` as the visual style reference. The chibi portrait also used the project sprite `public/assets/actors/hero-cloth-v9.png`. The original generated PNGs are retained in the local Codex generated-images archive under `C:/Users/Tommy/.codex/generated_images/`; the original prompt calls are in the journal UI asset task history.

The generation brief for shipped assets was: warm cream parchment, chunky crisp pixel-art walnut/leather frames, copper buckles and stitching, moss-green bindings, and painterly pixel texture matching the approved mockup; create reusable isolated interface pieces with transparent surroundings and no baked text, numbers, bars, or full-screen composition. The set comprised a parchment panel, dark leather tray, blank walnut sign, six separate parchment-tab icons, a blank leather system button, a youthful chibi hero bust, a tunic icon, and a blank square quick-slot frame.

The final clean-tab attempt used this prompt verbatim, but still produced a soft brown partial-alpha fringe, so it was not placed in the public asset set:

> Generate an isolated, production-ready 2:3 game UI tab asset in chunky painterly pixel art. A compact vertical blank journal tab: dark walnut outer edge, cream parchment inset, small moss-green cloth binding loop at top, two tiny copper corner caps, and a short empty lower label strip. The blank center and label must have no text, glyphs, numbers or symbols. One object only, filling at least 95% of canvas width and height. Everything outside the exact crisp silhouette must be fully transparent. No background color, checkerboard pixels, brown haze, ambient scene light, glow, halo, vignette, cast shadow, floor, border margin, mockup or extra objects. Crisp hard alpha edges without soft fringe; hand-rendered pixel-art texture details.
