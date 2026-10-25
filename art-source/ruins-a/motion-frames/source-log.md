# 苔陶蟲動畫原稿來源紀錄

狀態：八張 ImageGen 原稿已由中止的上一代理完成；本次恢復既有原稿並正規化。沒有重新生成、沒有接入 runtime 或修改 manifest。素材仍是未正式接合的原稿。

## 來源與身份參照

- 角色：`ruins-moss-carapace`／苔陶蟲；普通怪規格 96×96、pivot `(0.5, 1)`。
- 參照圖：[`../actors/moss-carapace-idle-anchor-v1-mirrored-right.png`](../actors/moss-carapace-idle-anchor-v1-mirrored-right.png)，SHA-256 `e90536fa6d4d1299ef010820ef4d11472c87375281258aaf60e69f2a6bb85d99`。
- 工具：內建 `image_gen.imagegen`；每張單姿勢輸出，`transparent_background: true`。
- 原始輸出：`C:\Users\Tommy\.codex\generated_images\01a1712b-8698-7f23-9cd9-416886917a49\`；八張原封副本保存在本目錄 `raw/`。
- prompt 與結果對應來源：`C:\Users\Tommy\.codex\sessions\2026\10\25\rollout-2026-10-25T11-47-20-01a1712b-8698-7f23-9cd9-416886917a49.jsonl`。同一執行記錄的第 145 行含提交 prompt；第 147、148、157–159、168–170 行的 ImageGen `savedPath`／`revisedPrompt` 元資料給出逐張輸出及姿勢對應。映射以這些工具結果為準，不按檔案時間推斷。
- 共同身份：低矮緊湊爬行輪廓、灰白破陶殼、可見鐘形殼紋、殼縫青苔、短棕色根鬚與根足。所有八張都朝右；不需要鏡像。

## 提交給 ImageGen 的完整 prompt

下列共同 prompt 原文會與每個 frame 專用的完整 Pose 段落串接，沒有省略或新增其他 prompt 文字。

```text
Use case: stylized-concept
Asset type: one isolated runtime frame for a classic 2D side-view game sprite; single pose, not a sprite sheet.
Input images: Image 1 is the sole identity reference. Match this exact Moss-Ceramic creature: the same low compact crawler silhouette, cracked pale gray-white ceramic shell plates, the large visible bell-like shell motif, green moss in shell gaps, and short rust-brown fine root limbs and feelers. Keep its proportions, pixel scale, materials, and camera view. The creature faces right.
Scene/backdrop: genuinely transparent background with real alpha.
Style/medium: crisp classic 2D pixel sprite, clear pixel clusters, hard pixel edges, limited natural colors; match Image 1. No 3D rendering, smooth vector shapes, airbrushed or painterly finish.
Composition/framing: one complete creature centered in a square canvas, comfortably smaller than the canvas with generous transparent padding on every side. Keep every shell edge, root foot, and feeler fully inside the canvas; compact roots that do not reach toward another cell. Keep a stable side view and the same scale and facing as Image 1.
Constraints: exactly one creature in exactly one pose; one static game frame only. Keep the visible feet near a consistent baseline. No world translation or motion trail. Preserve the character identity and shell markings. No ground, floor, cast shadow, background, props, glow, particles, grid, cell borders, letters, watermark, extra limbs, or extra characters.
Avoid: multiple views or poses, animation strips, contact sheets, cropped body parts, long branching roots, extra decorative objects, antialiasing, blur.
```

每張提交 prompt 的 Pose 段落如下；這些段落是上表 `savedPath` 對應的逐張原文：

### frame-00 — idle neutral

```text
Pose: ordinary idle stance. The shell sits calmly in its neutral low posture; all short root feet rest naturally beneath the body, and the forward root feelers hang relaxed. This is the quiet first idle pose, with no visible breath lift.
```

### frame-01 — idle breath

```text
Pose: a subtle breathing idle variation of the same stance. The shell and body rise just slightly as if taking a small breath; the short root feet flex only a little and the forward feelers shift a few pixels. Keep the change gentle and readable, returning naturally toward the neutral pose; do not change the creature's size or silhouette.
```

### frame-06 — walk reach

```text
Pose: first phase of a slow rightward crawl. The short front root foot nearest the viewer reaches forward; the hind root feet stay tucked behind and push, so the shell dips slightly forward. Keep the movement in the existing short root limbs only.
```

### frame-07 — walk plant

```text
Pose: the front root foot has just planted ahead. The body weight settles low over it while one short trailing root foot begins to lift and draw forward. The shell advances through a small pitch change; the creature remains compact and right-facing.
```

### frame-08 — walk transfer

```text
Pose: middle transfer of the slow crawl. The body shifts over the planted front roots, the trailing root feet fold forward beneath the shell, and the shell rises a little from the previous low point. Let the fine feelers lag slightly backward.
```

### frame-09 — walk opposite reach

```text
Pose: opposite half-step of the crawl. The opposite short front root foot reaches ahead while the near front root foot lifts; one rear root foot supports the body. The shell rocks gently upward. Keep all feet close to the shell and the same low silhouette.
```

### frame-10 — walk recovery

```text
Pose: the opposite front root foot has planted. The hind root feet catch up beneath the body, with one short root foot visibly lifted in recovery. The shell settles forward and down slightly, distinct from the previous lifted phase.
```

### frame-11 — walk stride end

```text
Pose: end of the slow crawl stride. The rear root feet push off just behind the body while the front roots brace; the shell rocks slightly up and back and the feelers begin to settle. This is a distinct final phase that can loop into frame-06, not a copy of another pose.
```

## 原始檔與正規化檔

原始圖皆為 1254×1254 RGBA。每個 raw SHA-256 與其原始 `generated_images` 檔案相符。正規化為 96×96 RGBA；使用可見主體 alpha `>8` 的外框定位，左右各外擴 12 原圖像素、頂部外擴 8、底部外擴 4，納入框內半透明邊緣；不做 alpha 閾值切除或背景合成，RGBA 以 LANCZOS 等比重採樣。主體約 72px 寬、最多 70px 高；主體水平中心置於 x=48，整體 alpha 外框底端 exclusive y=93（最下非透明像素 y=92），四邊保留至少 3px 透明邊。沒有重畫、補畫或鏡像。

| Frame | 原稿檔名 | 原稿 SHA-256 | 正規化檔 | 正規化 SHA-256 | 正規化 alpha bbox `[left, top, right, bottom)` |
| --- | --- | --- | --- | --- | --- |
| frame-00 | `exec-15fb29f8-b349-4993-868c-f369295b2073.png` | `cd8b15389e93399d1dbac4bfc16f2e4ff13502e75eeb3df5420856b2ad369bbc` | `normalized/frame-00.png` | `aaed95a72b6c16f5c781e82bea45add27c64cf44cf84ecc201f15640cd5fc010` | `[11, 53, 85, 93)` |
| frame-01 | `exec-bd60b993-0e3b-4e31-afd4-65149a153458.png` | `b56b5266c76ec6b829ee7fa4a2434f5ed6db635f894ee2bada48e6bfe5cc98c9` | `normalized/frame-01.png` | `550bd14a0b63ac6ffe961583bf59c09929b66f0a3b99355335ea6f067b53b2ed` | `[11, 53, 85, 93)` |
| frame-06 | `exec-2c54806b-f254-422c-ae43-900c2fd0def8.png` | `104cc5bd3214415d2f501049e3d564be607aae855178bf3e33c005a897bcecc9` | `normalized/frame-06.png` | `cd8b4e11ff67d11d798e0bb9cd1d78ca9bc987f7e7a624db8436a453549cba56` | `[11, 56, 85, 93)` |
| frame-07 | `exec-1f419dd3-1b2f-4d37-bd5f-c164bff65683.png` | `af1a734aaba5a6df7252f18f96738a1057fc9bd7b21f12afc3c50d5fda145b20` | `normalized/frame-07.png` | `57676e1c01c98e7bef2466840a4452d051dd54f65e3b1fd78814358109ee02bc` | `[11, 56, 85, 93)` |
| frame-08 | `exec-92a7031d-44cb-40e8-b5e8-7f842014b69e.png` | `0631cba79ce4cb3f7f0d76fadc93da80b118cd2c0a5d3c385d708866b81ebc75` | `normalized/frame-08.png` | `9403a02cfa38b579d1cda4228953ba60e3006d63414bdad66434cc53a8f62474` | `[11, 53, 85, 93)` |
| frame-09 | `exec-110f4e85-cc13-4eef-9ba9-3cc67c30eb82.png` | `fc1a25791bcd4ae6b4ba79671bdfd6716bbc7049e91d1f1c286b66ac59485ffc` | `normalized/frame-09.png` | `a898dfd6675e183bedb4b8504cead8e893dd0da3924738d511ee0f3aab31b6dd` | `[11, 52, 85, 93)` |
| frame-10 | `exec-d6539fd5-cbd8-45c3-a5db-b3f30d08b0fd.png` | `53ca83b97ae17c0c08f7a6177f4bb0c034a179741a018f76ceac4f6f87c7591c` | `normalized/frame-10.png` | `8c01cea7c0e55b9b193acda66ebeaa33cc59d5ace8bd345ccff78c107811e03e` | `[11, 55, 85, 93)` |
| frame-11 | `exec-65b57668-86a8-4433-912d-f442b12c2a55.png` | `936924ca171c6625fa6f37d1cb9d955d0e893ae548295b159288ba4e0a83effb` | `normalized/frame-11.png` | `ffe7124c6737afcd5f1d04b55c1ede740c8e3973d0da44080072ddbc6042ae5b` | `[11, 55, 85, 93)` |

Review contact sheets: `review/raw-contact.jpg` (1280×660, JPEG quality 70) and `review/walk-contact.jpg` (1260×840, JPEG quality 70). They composite alpha over a neutral gray background solely for visual review; they are not game assets.
