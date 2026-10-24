# Sunwell Sentinel idle source v1

Generated with built-in ImageGen on 2026-10-24, using `transparent_background=true` and the accepted identity raw source as the sole visual reference.

Original ImageGen output: `C:\Users\Tommy\.codex\generated_images\01a16c63-64a1-7fd1-85a3-ac84e03bd270\exec-d1ad30d7-0bd3-4e0b-956d-80941d5c7a05.png`
Preserved raw source: `sunwell-sentinel-idle-raw-v1.png`
SHA-256: `1A893E9F39C2B11A945916F55CAB62A44569D58D7060106C88147702230190FD`
Raw source: 1774×887 RGBA, alpha range 0–255. `alpha >32` yields separate horizontal silhouette bounds `[72,68,819,823)` and `[963,65,1716,823)`.

The two accepted poses are a planted neutral stance and a subtle breathing/weight shift. At 96×96 cell size and 192×192 runtime display, both retain the accepted sandstone golem identity, large stone fists, solid turquoise inset core, muted gold sun marks, short legs, and transparent margins. No obvious aura, halo, or effects appear at game size. The extracted hard silhouettes are 83×85 and 83×84 source pixels, centered with the shared baseline at y=94. The 192px display silhouettes are 166×170 and 166×168 pixels.

`export_idle_previews_v1.py` locates the two silhouettes by horizontal runs of alpha greater than 32. Thresholding only identifies crop bounds; all original RGBA pixels inside the padded crops are preserved. Each pose is independently cropped and nearest-neighbor scaled into a 96px transparent cell; no pixels are repainted, recolored, cleaned, or redrawn. Previews are shown on the existing Sunwell sky for 96px and 192px review, while transparent cell PNGs remain the actual frame sources.

The exact generation prompt is preserved in `sunwell-sentinel-idle-prompt-v1.md`.
