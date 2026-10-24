# Sunwell Beetle runtime atlas v1

The runtime atlas is `public/assets/actors/monsters/sunwell-beetle-atlas-v1.png`: a transparent 384×384 RGBA PNG with sixteen 96×96 cells. The source-size review image is `sunwell-beetle-atlas-preview-96px-sky-v1.png`; it composites those same cells over the approved `env-sand-dune-sky-v1.png` patch at `(432, 210)` so the sprite can be judged at the 96×96 game display size. Runtime output stays transparent.

Frames are packed row-major to match the game animation contract:

| Atlas index | Cell | Animation frame | Timing |
| ---: | --- | --- | --- |
| 0–1 | row 0, columns 0–1 | idle 0–1 | 200 ms loop |
| 2–5 | row 0, columns 2–3; row 1, columns 0–1 | walk 0–3 | 120 ms loop |
| 6–9 | row 1, columns 2–3; row 2, columns 0–1 | horn-charge attack 0–3 | non-looping |
| 10–11 | row 2, columns 2–3 | hurt 0–1 | non-looping |
| 12–15 | row 3, columns 0–3 | collapse 0–3 | 100 ms per frame, non-looping |

The exporter `export_atlas_v1.py` packs the preserved raw pose strips without repainting them. Its recorded alpha>32 bounds locate the sprite crops only; the crop RGBA pixels, including partial-alpha edge pixels, are retained. Each pose group uses one nearest-neighbor scale shared by every frame in that group, centers its silhouette horizontally, and aligns the ground-contact baseline to local y=94. Padded crops are clipped to their own source-strip column. The walk strip contains four distinct leg placements; the attack strip reads as brace, forward weight shift, low rush, and recovery, with no tail attack.

Pose-group source files hold the exact ImageGen prompts, raw-source SHA-256 hashes, crop boxes, and approved 96px strip previews:

- `identity-source-v1.md` and `sunwell-beetle-identity-raw-v1.png`
- `idle-2pose-source-v1.md` and `sunwell-beetle-idle-2pose-raw-v1.png`
- `walk-4pose-source-v1.md` and `sunwell-beetle-walk-4pose-raw-v1.png`
- `attack-4pose-source-v1.md` and `sunwell-beetle-attack-4pose-raw-v1.png`
- `hurt-2pose-source-v1.md` and `sunwell-beetle-hurt-2pose-raw-v1.png`
- `dead-4pose-source-v1.md` and `sunwell-beetle-dead-4pose-raw-v1.png`

Rebuild from the repository root with:

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' art-source/expansion-sands/sunwell/beetle/export_atlas_v1.py
```

The related Sunwell Shell item source, prompt, and 32px preview are under `art-source/expansion-sands/sunwell/items/`; its transparent 128×128 runtime icon is `public/assets/interface/item-sunwell-shell-v1.png`.
