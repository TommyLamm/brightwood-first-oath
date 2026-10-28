# Plan16 W08・Sand B7 Canvas 靜態稽核

日期：2026-10-27（香港時間）  
狀態：**PARTIAL；靜態 source 未能定位明確繪製缺陷**

## 範圍與證據

只查閱既有 [Sand B7 最終報告](world-completion-sand-final.md)、`src/app/app.ts`、`src/app/gameplay.ts`、`src/app/state.ts`、`src/app/scenes.ts`、`src/main.ts` 與 `src/render/index.ts`，並讀取上述 source 的工作樹差異。沒有啟動瀏覽器、測試、build 或 server，沒有讀取 q08 raw 或圖片，也沒有修改遊戲 source。

最終報告記錄：原 format 5 `frost-shore/right` 存檔可正常 Continue，HUD 正常；暫停 overlay 遮住場景，唯一一次 Escape 後 HUD 可見但整片 canvas 均一深灰，hero、地形與 portal 均不可見。當時 session 回報 console 0 errors／0 warnings，request 摘要沒有失敗、4xx 或 5xx；摘要不是完整網路 audit。renderer 是 Canvas 2D，不涉及 WebGL context loss。這些是既有報告的觀察，不足以證明 draw call、texture 解碼或場景物件可見性。

## 靜態接線結果

- `src/app/gameplay.ts:133-195` 的 `restoreGame()` 會將保存的位置映射到 catalog map/spawn，重建玩家與 runtime gameplay state；沒有操縱 Canvas 或 Phaser Scene。
- `src/app/app.ts:425-437` 的 Continue 只將 screen 切到 `playing` 並增加 `worldRevision`。`src/app/scenes.ts:55-80` 在 World Scene 建立時，以已還原的 location 找初始地圖並載入；成功 callback 設定 `activeMapId`、`rendererReady`。`src/app/scenes.ts:84-139` 在 map 與 gameplay 對應且 renderer ready 時，呼叫 `resize()` 及 `render(makeWorldSnapshot(...))`。
- `src/app/state.ts:65-79` 將 pause 命令套用到 app screen。`src/app/app.ts:209-214` 凍結時會略過 gameplay simulation；但 `src/app/scenes.ts:84-139` 沒有因 paused screen 停止 Scene update 或 renderer 呼叫。因此靜態程式不能把「暫停凍結世界模擬」當作整片 canvas 灰的直接解釋。
- `src/render/index.ts:1316-1388` 的 `loadMap()` 建立並提交 map visual；`render()` 呼叫 `drawSnapshot()`，後者要求有 active visual 且 snapshot mapId 相符（895-898 行）。`src/app/scenes.ts:151-178` 會在地圖載入失敗時回報 runtime issue 與狀態訊息。`resize()` 僅在 viewport geometry 有效時設定 camera viewport/zoom（1381-1389 行）。這些是條件式路徑，沒有 B7 runtime trace 證明當時各條件的實際值。
- `src/main.ts:37-49` 明確建立 960×540 的 Phaser Canvas renderer，背景色為 `#21323a`，並使用 FIT/CENTER_BOTH。灰底與背景色是否相同、是否由 Phaser 背景清除造成，單憑文字 source 不能確認。

目前工作樹差異涉及 main 的 game ID 常數、app/state 的 save-format/legacy-import、audio 與 UI state、gameplay 的 q21 inspection 和 ruins boss 行為，以及 renderer 的 portal label 和 ruins bell keeper 動畫／提示；未見改動 Continue/restore、World Scene render gate、renderer map load/render/resize 或 pause-to-render 接線。故目前沒有明確 source 變更可解釋「初始 restore 後場景完全不 draw」。這不等於證明 source 無缺陷，也不能排除只在該候選／執行時序出現的問題。

## 判定與下一步

不提出 source 修補，維持 PARTIAL。現有證據不能區分：World Scene render gate 當時未滿足、draw call 已執行但 scene objects/textures 未顯示、或 canvas 只呈背景清除色。若後續重新診斷，最小有辨識力的 runtime 證據應同時記錄 `rendererReady`、`activeMapId`、`transitionKey`、save mapId、drawSnapshot 是否執行，以及載入 texture 的尺寸／可見像素；本輪不重新開啟環境取得這些資料。

未執行測試、build 或瀏覽器驗收；僅做指定 source/report 靜態閱讀與差異檢視。
