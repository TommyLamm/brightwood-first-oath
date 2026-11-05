# Plan51 first batch: retained sources and reproducible export

2026-11-05, Asia/Hong_Kong. Baseline beta.62; candidate beta.63.
All four artwork outputs use the built-in ImageGen tool via the imagegen skill.
No CLI/API fallback or external source art was used.

## W00 findings and adopted changes

| Target | Observed issue | Adopted treatment |
| --- | --- | --- |
| Leather attack 32–37 | Face, forward glove and leather panel edges are softer than the refined cloth attack | Targeted six-pose edit retaining costume and the corresponding original pose bounds |
| Iron attack 32–37 | Shoulder highlights and face/hair detail differ between extension/recovery poses | Targeted six-pose edit with coherent metal planes and clean face/glove contours |
| Forest-edge | Branch platforms and climbing vines have no ground support or explicit attachment | Modular fork, bark repeat, root foot and vine tie behind actors |
| Mine-gate | Scaffolds have no posts/diagonal braces or ladder-top clamp | Modular timber head, post repeat, iron foot and riveted clamp behind actors |

Each costume retains 58 of 64 atlas cells pixel-for-pixel, including padding.
The twelve adopted attack cells are fitted to their original alpha bounds; the
export asserts maximum bound error <=0.5 logical pixels. This check does not
prove every internal fist point; actual weapon overlap is part of visual review.

## Provenance and export

- `prepare.py`: extracts exact six-frame edit targets, compact style references and baseline hashes.
- `*.prompt.txt`: exact prompts for forest/mine support generation and leather/iron attack edits.
- `*-generated.png`: unmodified native ImageGen originals, copied into this workspace.
- `generation-record.json`: native tool paths and output hints. The original generated files remain in place.
- `*-manifest-before.json`, `baseline.json`: input mappings and production world/actor fingerprints.
- `export.py`: technical source-region cropping, alpha cleanup, premultiplied resampling, packing and manifest URLs. It does not draw poses or environment art.
- `export-report.json`: source/runtime hashes, sizes, changed cells, alpha bounds and costs.

Reproduce from the repository root with `python art-source/quality-pass2-20261105/export.py`.
The exporter does not rerun generation. It preserves unrelated image entries,
all animation/audio contracts and the original maps/actor rules.

Runtime additions: two 512×128 support atlases, four logical 64×64 cells at 2×
density. Top/body/foot/tie use fixed vertical bands of 32/32/24/28 logical pixels.
Support middle segments repeat and crop to height; whole supports are not stretched.
Two replacement hero atlases remain 1536×1536, with the existing stable image keys.

Compact reviews: `output/quality-pass2-20261105/`. These are composited asset
previews, not actual game screenshots. Actual browser evidence and final results
are recorded separately in `plan/reports/quality-pass2-20261105.md`.
