# Sunwell Sentinel identity source v1

Status: accepted identity anchor for the Sunwell Sentinel runtime poses; source-only until the complete atlas is assembled.

Generated with the built-in ImageGen tool on 2026-10-24 13:37:56 Asia/Hong_Kong, with `transparent_background=true`. No input image was passed; the prompt names the accepted Brightwood enemy sprite style in text and does not borrow any animal design.

Original ImageGen output: `C:\Users\Tommy\.codex\generated_images\01a16c63-64a1-7fd1-85a3-ac84e03bd270\exec-4e6e04e5-69eb-4892-bde3-c6bedcf2e36a.png`
Preserved raw source: `sunwell-sentinel-identity-raw-v1.png`
SHA-256: `B0AF84337881A9150F728D839C34EBCEF885C8A1B4B9F6F3209485C9F5BD2D45` (matches the ImageGen original byte for byte)
Raw PNG: 1297×1213 RGBA, alpha range 0–255; 791,872 fully transparent, 780,602 partially transparent, 787 fully opaque pixels.

The identity was reviewed as a 96×96 cell and at the actual 192×192 boss display scale over the approved Sunwell sky. It reads as a right-facing sandstone golem with two oversized fists, short legs, a solid turquoise inset chest core, and muted-gold sun engravings. Both hands and feet remain in frame; no obvious halo, aura, detached colored pixels, ground, or effects are visible at game size. The normalized hard silhouette occupies 84×86 source pixels, centered in the cell at `[6,8,90,94)` with the shared bottom baseline at y=94; at 192×192 display it occupies 168×172 pixels.

`export_identity_preview_v1.py` uses alpha >32 only to locate the hard silhouette crop, retains all RGBA pixels within a 24-source-pixel padded crop, and applies nearest-neighbor resizing into a transparent cell. It does not repaint, recolor, or clean the source. The 96px and 192px sky-backed images are review-only previews; neither replaces the preserved raw source or the final transparent runtime atlas.

## Exact ImageGen prompt

See `sunwell-sentinel-identity-prompt-v1.md` for the exact prompt text used in the built-in tool call.
