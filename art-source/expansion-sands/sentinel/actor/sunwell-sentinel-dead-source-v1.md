# Sunwell Sentinel death source v1

Generated with built-in ImageGen on 2026-10-24, using `transparent_background=true` and the accepted identity raw source as the sole visual reference.

Original ImageGen output used for this accepted group: `C:\Users\Tommy\.codex\generated_images\01a16c63-64a1-7fd1-85a3-ac84e03bd270\exec-304205d2-5278-49c8-adf5-f090591a1b48.png`
Preserved raw source: `sunwell-sentinel-dead-raw-v1.png`
SHA-256: `9FFB9185BF9650C8F582F5CA92898E1B53FD064B91A08C9324818E997341FE1A`
Raw source: 2172×724 RGBA, alpha range 0–255. Four silhouettes are separated in horizontal source order.

The sequence drops from a standing stagger to one knee, forward side-collapse, and a compact prone final pose. All four frames use the same nearest-neighbor scale `0.1596958175` and baseline y=94; hard dimensions are 84×84, 85×69, 88×50, and 85×36 pixels. The shared scale keeps core/torso size stable while the body folds naturally smaller. It fits every pose into a 96px cell without shrinking the core independently. A 192px sky-backed contact strip is `sunwell-sentinel-dead-overview-192px-sky-v1.png`.

One first draft had a dark mark beside the third pose. The single bounded retry is the accepted source. In the 192px preview, frame 2 still contains a small dark line on its left edge. The line shares one alpha>32 connected component with the pose, so a rectangular crop cannot remove it without trimming the silhouette; it is preserved for root review. No further generation or pixel cleanup was done.

`export_dead_previews_v1.py` locates the four poses by horizontal alpha bounds, applies one common scale to all frames, retains original RGBA pixels within padded crops, and nearest-resizes each crop into a transparent cell aligned to baseline y=94. It does not repaint, recolor, clean, or redraw. The 96px/192px PNGs and contact strips are review outputs.

The exact accepted prompt is preserved in `sunwell-sentinel-dead-prompt-v1.md`.
