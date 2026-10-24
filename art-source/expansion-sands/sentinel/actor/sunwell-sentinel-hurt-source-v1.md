# Sunwell Sentinel hurt source v1

Generated with built-in ImageGen on 2026-10-24, using `transparent_background=true` and the accepted identity raw source as the sole visual reference.

Original ImageGen output: `C:\Users\Tommy\.codex\generated_images\01a16c63-64a1-7fd1-85a3-ac84e03bd270\exec-c665eff8-2680-454f-911a-5a96fc5aa9fa.png`
Preserved raw source: `sunwell-sentinel-hurt-raw-v1.png`
SHA-256: `3B8F56AEF9AE557988E890C9E4F03863A2EB55881C3886DB1733FB554CAFA6E5`
Raw source: 1802×873 RGBA, alpha range 0–255. Hard silhouette bounds are `[145,30,863,824)` and `[1035,99,1693,824)`.

The two hurt beats are a backward recoil with raised fists followed by a lower hunched recoil. Both remain planted on baseline y=94. A common group scale of `0.1083123426` is applied to both poses to preserve equal core/torso scale instead of independently fitting each bounding box. The first hard silhouette is 77×86px; the hunched second is 70×78px. Both were reviewed at 192×192 game display; the core and body remain legible, and no obvious halo or detached effect pixels are visible.

`export_hurt_previews_v1.py` detects the two horizontal alpha groups, calculates one scale from their maximum hard bounds, retains original RGBA pixels within padded crops, and applies nearest-neighbor resizing into cells with the shared baseline. It does not redraw, repaint, recolor, clean, or remove source pixels. The 96px/192px transparent cells and sky-backed previews are review outputs.

The exact generation prompt is preserved in `sunwell-sentinel-hurt-prompt-v1.md`.
