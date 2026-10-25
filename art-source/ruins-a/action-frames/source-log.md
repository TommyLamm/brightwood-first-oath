# Ruins-A 苔陶蟲 action frames — source log

狀態：10 張既有 AI 原稿已保全，逐張 prompt／輸出檔映射已恢復，並完成正規化；未接入 runtime／manifest。

## 原始來源與 prompt

- ImageGen 原始輸出目錄：`C:\Users\Tommy\.codex\generated_images\01a1712b-dab9-7b31-ac43-5ec40085b018`。
- 專案內保全副本：`art-source/ruins-a/action-frames/raw/generated-batch-a/`。十張皆逐位元複製，SHA-256 與原輸出相同；未覆寫已存在的 `raw/frame-12.png`。
- prompt 全文保留於 [`prompts/action-prompts.md`](prompts/action-prompts.md)；共同右向身份參照為 [`../actors/moss-carapace-idle-anchor-v1-mirrored-right.png`](../actors/moss-carapace-idle-anchor-v1-mirrored-right.png)。
- 逐 call 精確對應來自 action session 的 `savedPath` 與 `revisedPrompt` 欄位（10/10）：`C:\Users\Tommy\.codex\sessions\2026\10\25\rollout-2026-10-25T11-47-42-01a1712b-dab9-7b31-ac43-5ec40085b018.jsonl`。只提取本任務相關的路徑與 prompt 欄位，未複製長歷史；未以 mtime 或 UUID 順序猜測。`frame-12` 另以原先已存在的 `raw/frame-12.png` SHA-256 對照確認。
- 視覺檢視圖：[`review/source-contact-sheet-q70.jpg`](review/source-contact-sheet-q70.jpg)（1200×484）與 [`review/source-contact-sheet-detail-q70.jpg`](review/source-contact-sheet-detail-q70.jpg)（1200×1000），中性灰底 JPEG quality 70。僅為快速審圖按原檔名詞典序排版；來源 mapping 以 session 欄位為準。

## 原稿 → 正規化槽位

| 動作槽 | 保全原稿 | SHA-256 | 原稿尺寸／模式 | prompt／姿勢 |
| --- | --- | --- | --- | --- |
| `frame-12.png` | `exec-e4acdfc9-52e2-4936-8250-91529fdf55c4.png` | `d108d2aadaa2b7794142f2b58f7a706f0c917ef3f0703f0cc74ae3686bacf41c` | 1254×1254 RGBA | Frame 12 — windup crouch；壓低身體、根足內收、尚未張口。 |
| `frame-13.png` | `exec-bb02fafa-4f17-4860-8c7a-2858333c9df3.png` | `38642189bedf6cb4daaa4e8b1a21ba31a4dcfba13b5bddca724d281bea7ad7f5` | 1254×1254 RGBA | Frame 13 — mouth opens, body draws back；張口後停在預備點，尚未咬中。 |
| `frame-14.png` | `exec-488890b5-d605-4e8e-b002-1e23991d90f3.png` | `aba32d19c95102158bced519080fb784ade896b3a4a4f5dedf016811869f7ccb` | 1536×1024 RGBA | Frame 14 — active bite；向右前探，前根支撐，呈現咬擊。 |
| `frame-15.png` | `exec-a544b7ca-4e73-4250-b964-2c8e16dbca7b.png` | `5513c215b71085dc00da5e9b44206342614add588fcddc57dc7a91b24b675074` | 1536×1024 RGBA | Frame 15 — recovery；頭部收回、身體下沉、根足放鬆。 |
| `frame-18.png` | `exec-2843e1a2-8074-4c2d-bba8-95a4d4a4263f.png` | `f554e2c0f9a40a4fcac598aee14b1e96d327f3d5b1f64d963ac0a21f0d3ac31c` | 1536×1024 RGBA | Frame 18 — hurt flinch；身體向後縮、根足反射收／張。 |
| `frame-19.png` | `exec-88fb1a95-1360-4cb3-8355-a6886fa8251e.png` | `ff86298e3152ca1685aeea57b7292580bcc3ae8c8f101c18c5760842e39f216a` | 1254×1254 RGBA | Frame 19 — hurt recovery；根足回到身下，殼與表情穩定。 |
| `frame-24.png` | `exec-dca729fe-2d83-4959-a3f1-1ea541771a55.png` | `aebe87ab1a83a00d345ad92643b1b42a4196e6b0561be096ed51d97a2b2d4da0` | 1254×1254 RGBA | Frame 24 — legs buckle；根足失力、身體下沉，尚未側倒。 |
| `frame-25.png` | `exec-0e3c1455-0215-4895-8290-883a0a7d3072.png` | `93a3db2b855915308ed161b7a4606cc30119cca338c5234e4c8d6421ef1a2200` | 1254×1254 RGBA | Frame 25 — shell tips sideways；身體再沉、殼歪向一側。 |
| `frame-26.png` | `exec-92c8ccd8-cf85-48d0-9d53-2b5643608146.png` | `0773af770e93ead8b9bd8519234bfd99108410d932965342720d6f6447411e14` | 1536×1024 RGBA | Frame 26 — fallen and settled；低伏落地、根足外展，角色不透明完整。 |
| `frame-27.png` | `exec-00258760-e0ff-4295-bb4c-623b414000b2.png` | `24edbdc562a99406ce08a8efc3a00046b3ff63ea91aed1501ae6862c0784bda8` | 1254×1254 RGBA | Frame 27 — final still remnant；伏定靜止，殼完整、根足放鬆。 |

## 正規化輸出

輸出目錄：`art-source/ruins-a/action-frames/normalized/`。所有輸出為 96×96 RGBA，右向姿勢均不需鏡像；以可見 alpha（alpha>1，排除零散 alpha=1 畫布殘點）bbox 等比裁切，保留 3.5% 來源邊距後以 Lanczos 縮小。只移動／縮放完整原稿，沒有重畫、淡出、拼接或複製影格。

每格以完整輸出 alpha bbox 水平置中（pixel center x=48），底緣設為 exclusive y=93（腳底最高 alpha y=92）；四邊透明像素至少 3。含邊距的可見寬為 77 px（上限 84），高度 34–45 px（上限 70）；dead 姿勢低伏，沒有放大成巨大角色。

| normalized | SHA-256 | alpha bbox |
| --- | --- | --- |
| `frame-12.png` | `a76215fc35bc264e5e018f070569bf43571463374667c552231c7e18d976dbc4` | bbox `(10, 53, 87, 93)` |
| `frame-13.png` | `60542b304fa652b52ca6dc6b06539a32fc6ace33f956111d413218c9dd818629` | bbox `(10, 52, 87, 93)` |
| `frame-14.png` | `9691b398b7d0f7a1eb8e4f9ca4ae5c71b2dcc5e174e347ee98b891c0d68345d1` | bbox `(10, 57, 87, 93)` |
| `frame-15.png` | `e12beb91f8d256e7ab99649d9b2ded7991390130df7a1398b1ec7706e372eb93` | bbox `(10, 52, 87, 93)` |
| `frame-18.png` | `20f6e53f98328f6ef6b1c5372aee75333edb888f4a35b587a46da62df8cf1b17` | bbox `(10, 48, 87, 93)` |
| `frame-19.png` | `1210733d33febae67b5be2f62f91ab5343bc59123befe09981e1a20391a4f2d9` | bbox `(10, 54, 87, 93)` |
| `frame-24.png` | `83b2c9d835b5182c6cf4f1ff4cdf11e2864a730beb64dd6aca07f5740b1bdfea` | bbox `(10, 51, 87, 93)` |
| `frame-25.png` | `896c5e67c8709a054c17c6ddd4e21838963d3b52620c9b66cde5086b93f06c9c` | bbox `(10, 52, 87, 93)` |
| `frame-26.png` | `c7df97bd6e1551726da92cbda5db762e333f81ce888ccd6300cea501f55fe019` | bbox `(10, 58, 87, 93)` |
| `frame-27.png` | `26590675399a212390d2da18b7122dbf08267a52150b65a8bdb7c6b838c26c7f` | bbox `(10, 59, 87, 93)` |

## 原有 frame-12 保護

既有 `raw/frame-12.png` 未修改，SHA-256：`d108d2aadaa2b7794142f2b58f7a706f0c917ef3f0703f0cc74ae3686bacf41c`。完整原稿另存在 `raw/generated-batch-a/`，供來源追溯。
