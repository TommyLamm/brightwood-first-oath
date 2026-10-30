# UI control art source report

## Generation and export

All requested art was made with the built-in `image_gen` tool. Icon and button outputs requested genuine transparency; the 13 final PNGs are RGBA with alpha. Final exports were downscaled with Pillow using Lanczos to the required dimensions. Hover and pressed variants were edited from the normal button source; their final alpha channels use the normal button mask to preserve an identical nine-slice silhouette.

## Deliverables

| Public asset | Source copy | Prompt record | Final size |
| --- | --- | --- | --- |
| `public/assets/interface/controls/close.png` | `close-source.png` | `close.prompt.md` | 128×128 |
| `public/assets/interface/controls/settings.png` | `settings-source.png` | `settings.prompt.md` | 128×128 |
| `public/assets/interface/controls/pause.png` | `pause-source.png` | `pause.prompt.md` | 128×128 |
| `public/assets/interface/controls/play.png` | `play-source.png` | `play.prompt.md` | 128×128 |
| `public/assets/interface/controls/keyboard.png` | `keyboard-source.png` | `keyboard.prompt.md` | 128×128 |
| `public/assets/interface/controls/back.png` | `back-source.png` | `back.prompt.md` | 128×128 |
| `public/assets/interface/controls/confirm.png` | `confirm-source.png` | `confirm.prompt.md` | 128×128 |
| `public/assets/interface/controls/retry.png` | `retry-source.png` | `retry.prompt.md` | 128×128 |
| `public/assets/interface/controls/cloud.png` | `cloud-source.png` | `cloud.prompt.md` | 128×128 |
| `public/assets/interface/controls/warning.png` | `warning-source.png` | `warning.prompt.md` | 128×128 |
| `public/assets/interface/controls/button-normal.png` | `button-normal-source.png` | `button-normal.prompt.md` | 384×128 |
| `public/assets/interface/controls/button-hover.png` | `button-hover-source.png` | `button-hover.prompt.md` | 384×128 |
| `public/assets/interface/controls/button-pressed.png` | `button-pressed-source.png` | `button-pressed.prompt.md` | 384×128 |

## References and review

- Style references copied from the existing game: `reference-system-button.png` and `reference-icon-backpack.png`.
- `controls-review.jpg` is the complete contact sheet, composited on dark walnut at 1280×1240, JPEG quality 72.
- `pilot-review.jpg` is the close/button-normal pilot sheet (1280×690, quality 72).
- `close-draft-rgb-checkerboard.png` preserves the rejected first close pass. It had an RGB checkerboard baked into the background; the selected `close-source.png` is the regenerated RGBA version.
- High-resolution tool originals are kept in this directory as `*-source.png`; the superseded keyboard draft is retained as `keyboard-source-v1.png`. generated-image originals are also left at their default `$CODEX_HOME/generated_images` paths recorded in the corresponding prompt files or tool output.
