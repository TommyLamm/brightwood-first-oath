# Sunwell Sentinel walk source v1

Generated with built-in ImageGen on 2026-10-24, using `transparent_background=true` and the accepted identity raw source as the sole visual reference.

Original ImageGen output used for this accepted group: `C:\Users\Tommy\.codex\generated_images\01a16c63-64a1-7fd1-85a3-ac84e03bd270\exec-970a6833-662e-46e0-a0cf-4363ff8c4361.png`
Preserved raw source: `sunwell-sentinel-walk-raw-v1.png`
SHA-256: `56EA13AF68B6CD2FB56C9E51F9516D26F7E814FB965B63D697E778271479F858`
Raw source: 2172×724 RGBA, alpha range 0–255. The accepted sheet contains four substantial alpha-connected silhouettes in source x-order.

The four poses form a heavy right-facing walk cycle: near foot lead, passing step, far foot lead, opposite passing step. One common nearest-neighbor scale of `0.1493055556` maps all four hard silhouettes to 86 pixels high and the shared baseline y=94; their hard widths vary with the stride (85, 83, 89, 81 pixels). Review was done in a 96px cell overview and at 192px runtime display. The sandstone silhouette, turquoise inset core, gold sun marks, and foot movement remain legible at 192px.

The third bounded generation is the accepted source. Two earlier generated drafts showed more visible detached dark strokes; their original PNGs remain in the generated-images folder. The accepted first walk frame still has one narrow dark outline extension on its far-right edge at 192px. It touches the silhouette at alpha >32 and remains in the raw crop, so it was preserved rather than edited. The complete 192px sky preview is `sunwell-sentinel-walk-preview-0-192px-sky-v1.png`; this is exposed for root review.

`export_walk_previews_v1.py` finds exactly four alpha-connected components, uses their hard-alpha bounds only for crop placement, retains all RGBA pixels in padded rectangular crops, and applies one shared scale to every frame. It does not repaint, clean, recolor, or redraw the sprites. Transparent 96px/192px cell images and sky-backed review images remain separate from the preserved raw source.

The exact accepted generation prompt is preserved in `sunwell-sentinel-walk-prompt-v1.md`.
