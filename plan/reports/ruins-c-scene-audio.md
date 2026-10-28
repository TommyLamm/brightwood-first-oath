# 遠古遺跡包 C：場景、旅冠與音訊交接

日期：2026-10-25（香港時間）。Owner：環境／配件／音訊素材。本報告只涵蓋本 owner 的素材與 `public/assets` manifests；boss atlas 由下一位 owner 負責。

## 規格來源與責任邊界

- 已讀 `AGENTS.md`、`plan/14-ruins-bell-sanctum.md` 第 6／8 節、`plan/reports/ruins-c-dispatch.md`、`plan/reports/ruins-c-world.md`，以及內建 imagegen skill。Playroom main 模板與七份線上規格由主代理在本輪完整讀取，讀取記錄見派工與 world 報告。
- 本批完成誓鐘內殿三層、守誓旅冠 icon／overlay、`boss-ruins` 兩層配樂和 `oath-bell-restored` WAV；不改 app、renderer、persistence、catalog 或版本。
- 素材 keys、尺寸、alpha、曲目節奏、manifest 舊項順序、每張原稿與生成紀錄完整性為本批驗收項目。

## Runtime 素材

| Key | Runtime 檔案 | 尺寸／格式 | Bytes |
| --- | --- | --- | ---: |
| `env:ruins-sanctum:sky` | `public/assets/environment/env-ruins-sanctum-sky-v1.png` | 960×540 RGB | 663,509 |
| `env:ruins-sanctum:far` | `public/assets/environment/env-ruins-sanctum-far-v1.png` | 1440×540 RGBA | 871,995 |
| `env:ruins-sanctum:mid` | `public/assets/environment/env-ruins-sanctum-mid-v1.png` | 1920×540 RGBA | 474,144 |
| `item:oathfarer-circlet` | `public/assets/interface/item-oathfarer-circlet-v1.png` | 128×128 RGBA；manifest display32×32 | 10,799 |
| `equip:oathfarer-circlet` | `public/assets/actors/equip-oathfarer-circlet-v1.png` | 128×128 RGBA；display48×32；pivot(.5,1) | 9,203 |
| `boss-ruins` | `public/assets/audio/boss-ruins.ogg` | Vorbis q5，48 kHz stereo | 978,791 |
| `boss-ruins` fallback | `public/assets/audio/boss-ruins.m4a` | AAC-LC 160k，48 kHz stereo | 1,277,288 |
| `boss-ruins:phase2` | `public/assets/audio/boss-ruins-phase2.ogg` | Vorbis q5，48 kHz stereo | 1,021,271 |
| `boss-ruins:phase2` fallback | `public/assets/audio/boss-ruins-phase2.m4a` | AAC-LC 160k，48 kHz stereo | 1,237,236 |
| `oath-bell-restored` | `public/assets/audio/oath-bell-restored.wav` | PCM16 mono，48 kHz，1.05 s／50,400 frames | 100,844 |

十個 runtime 檔共 **6,645,080 bytes（6.337 MiB）**，C 的 9 MiB 上限尚餘約 **2.663 MiB** 給 boss atlas 與最後調整。

環境構圖為高聳封閉穹頂及獨立破石環，和長廊的走廊視角不同。far／mid 為 RGBA；mid 在 y≥180 的 alpha 全數為 0。三層由下游接線使用 x parallax 0／0.2／0.5，不套 Sunwell 的 y1.6。未將首領、預警或可走平台畫入圖層。

音樂由既有 `tools/audio/generate-audio.mjs` 生成；每曲 128 BPM、4/4、32 小節（目標60秒），phase2 與 base 共用循環長度。`oath-bell-restored` 由既有 SFX renderer 新增配方；本輪只生成三個新 key，未重生任何舊音訊。

## 原稿與生成紀錄

所有原稿、完整 prompt、tool output hint、raw/runtime SHA-256、正常化資訊和實際路徑均在 `art-source/ruins-c/scene-audio/`。每筆的呼叫識別碼與 revised prompt 欄位均如實記錄為 imagegen 回應未提供；imagegen 回傳的 `exec-…` 檔名與 batch 資料夾則保留在 `generatedSource`／hint。

| 原稿 | Runtime | Raw SHA-256 |
| --- | --- | --- |
| `ruins-sanctum-sky.raw.png` | environment sky | `af2df2837ce73bfbbd0e8720cfff308d8a093e62b5d523843eda363b9b16d9d3` |
| `ruins-sanctum-far.raw.png` | environment far | `ce0068a038e6b209291769edeedb4f99f80e29f3bc019b0313be40e1b8d63311` |
| `ruins-sanctum-mid.raw.png` | environment mid | `c2eb9e518aa72637539e73939ae31608c0ba1d8649e01f369d59e79f39cda483` |
| `oathfarer-circlet-icon.raw.png` | item icon | `5677c8fb41a8ca4ae0d17c50e42e18880e267ece5359a08c796cbefd99f5a59e` |
| `oathfarer-circlet-overlay.raw.png` | equipment overlay | `23d049290b9a30a3b108d643be047a4b9cb2c18d887f0ea1426046b8b506347f` |

Record files: `*.metadata.json` beside the originals. Deterministic resize/alpha cleanup is scripted in `normalize-assets.py`; manifest additions are scripted in `append-manifests.mjs`; source-path and hash repair/verification metadata is recorded by `record-imagegen-metadata.py`. Review thumbnails are `review-sky.jpg` (1280×720), `review-far.jpg` (1280×480), and `review-circlet-pair.jpg` (1024×560), all JPEG quality70 on neutral backgrounds.

## Manifests與 ownership 交接

- Added three environment entries at the end of `public/assets/environment/manifest.json`.
- Added `equip:oathfarer-circlet` at the end of `public/assets/actors/manifest.json`; this manifest is **released to the next atlas owner now**. Its runtime file is already present. This owner will make no further edits to the actors manifest.
- Added `item:oathfarer-circlet` at the end of `public/assets/interface/manifest.json`.
- Audio generator added `boss-ruins`, `boss-ruins:phase2`, and `oath-bell-restored` to `public/assets/audio/manifest.json`; every entry points to a real runtime file.
- Existing entries and their order/value are unchanged in all four manifests. No placeholder entry was added.

Tracks and the new SFX source are in `tools/audio/scores/music.mjs` and `tools/audio/scores/sfx.mjs`. The app/render owner still needs to select phase2 from actual `phase===2`, play `oath-bell-restored` for this boss result in place of `boss-win`, and use the agreed parallax values.

## Checks performed

- `python art-source/ruins-c/scene-audio/normalize-assets.py` produced runtime dimensions and alpha-preserving PNGs. Pillow inspection confirmed all five dimensions/modes above and confirmed the mid layer has no nontransparent pixels below row180.
- `node art-source/ruins-c/scene-audio/append-manifests.mjs` appended real file-backed keys. The script checked existing entries in the three image manifests were unchanged before writing; a separate comparison against `HEAD` confirmed old image/audio entries retain their exact order and values in all four manifests.
- Raw and runtime SHA-256 values in all five image metadata files were recomputed from their saved files and matched.
- `node tools/audio/generate-audio.mjs --only oath-bell-restored` completed and validated all 44 audio entries (20 music layers, 24 effects/stingers). Its loop checks passed for both new layers; `ffprobe` reports Vorbis/AAC-LC, 48 kHz, stereo for all four files. WAV inspection confirmed 48 kHz mono PCM16 and 1.05 seconds.
- The earlier `--only boss-ruins` call rendered the two tracks but its final manifest-wide validator stopped because the separately scheduled new WAV had not yet been generated. After rendering the WAV, the successful generator run revalidated the tracks and full audio pack.
- `git diff --check` passed; Git reported only its standard LF-to-CRLF conversion notices for JSON files.

## Not verified here

- No app transition, map parallax, hero-anchor fit, browser playback, listening/audition, typecheck, build, or gameplay tests were run. The item overlay composition was visually inspected on its neutral-background thumbnail, but final fit over every hero animation remains for integration review.
- Boss atlas, runtime phase selection, result stinger routing, and candidate build remain downstream work. This report does not claim Playroom publication or browser validation.
