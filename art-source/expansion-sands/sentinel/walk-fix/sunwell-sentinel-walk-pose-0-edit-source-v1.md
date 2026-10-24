# Sunwell Sentinel walk pose 0 targeted edit

One built-in ImageGen edit, using the actor owner's pose-0 crop as the reference. Root visually accepted the edited source. The edit removes the stray exterior vertical stroke by the right fist. The generated file is 1254×1254 RGBA; retain a common chest-core/torso scale against the accepted identity when exporting walk0, with the existing baseline contract.

- Original walk strip: sunwell-sentinel-walk-original-raw-v1.png — 2172×724 RGBA, SHA-256 56EA13AF68B6CD2FB56C9E51F9516D26F7E814FB965B63D697E778271479F858
- Original pose-0 crop: sunwell-sentinel-walk-pose-0-original-v1.png — 598×610 RGBA, SHA-256 B1C7398FF852E00BC9EC9980E840E4C4F41F7EE3FDB8A664D9D1B8CAF0312E2B
- Edited pose-0 source: sunwell-sentinel-walk-pose-0-edited-raw-v1.png — 1254×1254 RGBA, SHA-256 02AB63D4707462F32220490DD949BC365CA2C530FA310C5E90BD6ECDC580E002

## Exact edit prompt

Make one tightly localized correction to the provided transparent-background Sunwell Sentinel walk pose 0 sprite crop. Preserve the original canvas size, exact pose, character identity, body scale, pixel clusters, warm sandstone / turquoise / gold palette, hard dark-umber outline, and transparent background.

Remove only the thin, stray, straight vertical dark stroke immediately outside the character's outer right fist. It appears at approximately x=89 of the normalized 96px cell and y=43–74; it touches the actual fist outline near x=88 around rows 48–64. Clear the extraneous stroke to transparency while preserving the fist's proper outer contour and a clean separation at its edge. Do not remove any part of the fist or its natural outline.

Keep every other character pixel, limb, face, chest core, engraving, highlight, shadow facet, and transparent area unchanged. Do not redraw, resize, recrop, recolor, smooth, sharpen, add detail, or alter any pose element. This is a one-mark pixel-art cleanup only; retain true transparency and the original sprite framing.

