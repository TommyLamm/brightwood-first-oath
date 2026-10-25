# Ruins A 苔陶蟲 idle／walk 原稿恢復

日期：2026-10-25。狀態：八張既有原稿已恢復並完成正規化，尚未接入 runtime。

## 規格與驗收範圍

開始前已讀 `AGENTS.md`、`plan/12-next-chapter-ancient-ruins.md` 的苔陶蟲及動畫規格、`plan/10-asset-spec.md` 的 actor 動畫契約、`imagegen/SKILL.md`，以及 Playroom main 的 `game-agent-template.md` 與它列出的七份線上文件：`game-development.md`、`command-contracts.md`、`game.schema.json`、`game-release.yml`、`examples/starter/playroom-sdk.js`、`sdk-versioning.md`、`save-compatibility.md`。

本批驗收依據：同一苔陶蟲、朝右；idle2、walk6；96×96 RGBA；完整主體、水平中心 x=48、足底 y≤92 且每邊至少 3px 透明；每張來源可追溯到原稿和提交 prompt。保留原稿，不改遊戲程式或 manifest。

## 完成內容

上一代理在額度中止前已完成這八次 ImageGen，原始輸出仍在其生成目錄。本次只從該目錄恢復已產生的八張圖，沒有重新生成，也沒有混入另一批苔陶蟲動作素材。逐張 prompt↔檔名關聯已從原執行記錄的 `savedPath`／`revisedPrompt` 恢復，未按檔案 mtime 猜測；完整提示詞、anchor 雜湊、raw/normalized 對照及方法記在 [`art-source/ruins-a/motion-frames/source-log.md`](../../art-source/ruins-a/motion-frames/source-log.md)。

| 動作順序 | 輸出 |
| --- | --- |
| idle 兩格 | `normalized/frame-00.png` 靜止中性姿勢；`normalized/frame-01.png` 輕微呼吸 |
| walk 六格 | `normalized/frame-06.png` 前足前伸；`frame-07.png` 落腳承重；`frame-08.png` 重心轉移；`frame-09.png` 另一側前伸；`frame-10.png` 後足收步；`frame-11.png` 步幅結束，接回 frame-06 |

所有來源見 `art-source/ruins-a/motion-frames/raw/`。已檢視中性底縮圖：同一低矮灰白破陶殼、鐘紋、綠苔和短棕根足輪廓，八張均朝右。idle 兩格有呼吸差異，六張 walk 呈現不同抬腳／落腳／重心階段；未發現需要重生的姿勢缺口。

正規化僅裁出可見主體周圍、保留外緣透明像素，按比例縮放並平移；沒有重畫、複製姿勢或鏡像。每格的 alpha bbox 中心約 x=48，exclusive bottom=93（最後非透明列 y=92）；左右透明邊 11px、底邊 3px、上邊 52–56px。可見主體寬約 72px、高約 37–41px。接入時按既有足底 offset 對齊世界地面。

## 最小檢查

- 八張 `raw/` 檔案 SHA-256 都與原始 generated_images 檔案一致；來源全為 1254×1254 RGBA。
- 八張 normalized PNG 均為 96×96 RGBA；alpha bbox 在 96×96 內、四邊至少 3px 透明、底端 exclusive y=93。
- 八個 normalized SHA-256 互異；相鄰姿勢逐像素比較皆有差異。
- 審圖聯絡表位於 `review/raw-contact.jpg`（1280×660、JPEG q70）及 `review/walk-contact.jpg`（1260×840、JPEG q70），長邊均不超過 1280px。
- 未跑測試、browser、build 或 typecheck；此批沒有改動 runtime／manifest，之後由 assembly owner 做 loader 引用及獨立 build。

下一步：將八張 `normalized/` 原稿交給 sprite assembly，依 6 欄×5 列 sheet 契約安置並建立 manifest 引用；本批不包含 attack、hurt、dead 姿勢。
