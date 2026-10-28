# Town 傳點目的地標示

日期：2026-10-26

## 變更

- `src/render/index.ts` 在 `buildMapVisual` 為每個傳點建立一次「前往〈目的地名稱〉」文字，名稱取自 `catalog.world.maps[portal.targetMapId].name`。
- 標籤沿用現有 renderer 字型、描邊與 `foregroundLayer`；置於傳點圖示上方，按文字寬度限制在地圖左右邊界內。地圖容器切換或 renderer dispose 時，標籤隨既有 layer 一併銷毀；不在每幀建立文字。
- Town 的兩個相鄰傳點分別顯示「前往潮痕營站」及「前往嫩芽林道」。沒有變更路線、距離、門檻、碰撞、任務、存檔、數值或素材。
- `package.json`、`package-lock.json` 及 `public/game.json` 版本升至 `1.0.0-beta.18`。遊戲 ID、schema 2 與雲端存檔讀取 1–4／寫入 4 維持原值。

## 規格與驗收

根協調者已完整讀取遊戲代理模板及其列出的線上規格；本工作沿用已核對的唯一 ID、版本遞增、自有資源路徑、跨 origin sandbox 與舊存檔相容要求。本子任務另讀 Playwright skill：`C:/Users/Tommy/.codex/skills/playwright/SKILL.md`。

驗收為 Town 傳點直接顯示可辨識的目的地名稱、標籤留在地圖內、不遮擋角色／傳點入口或操作介面，且地圖視覺沿既有 lifecycle 清除。

## 檢查

- Node `v24.22.1`：`tsc --noEmit` 通過。
- Vite `v8.3.4`：build 成功，唯一輸出位置為 `artifacts/overnight-20261026/portal-labels/dist`；沒有重建根目錄 `dist`。
- 在隔離 localhost 雙 origin sandbox iframe 載入既有 format 4 Town 存檔，於 1280×720 檢視後將同一頁 resize 至 960×540。兩個目的地同時可見且可辨，角色站在潮痕營站傳點時標籤仍在角色頭頂上方，沒有遮住角色、入口或 controls。這裡的4是存檔格式，manifest schema仍為2。
- 視檢圖片為 q70 JPEG：`artifacts/overnight-20261026/portal-labels/town-1280.jpg`、`artifacts/overnight-20261026/portal-labels/town-960.jpg`。
- 未新增或執行測試／全套回歸，符合本次純文字畫面調整的最小驗證要求。sandbox harness 的唯一 console error 是它未提供的 `/favicon.ico` 404；未見遊戲執行期錯誤。另有 harness 預期的 sandbox 同源／腳本警告。

## 指紋與清理

- `src/render/index.ts` 修改前 SHA-256：`F27E262A3B1924113BB49B39B5FF71693FAA3B90173C495277CD5EF678DFD799`。
- 修改後 renderer SHA-256：`BF389A96890912228CEECC75D7A784BF229C878CD904BC679CC7F3F2914D64CC`。
- Dist manifest 版本：`1.0.0-beta.18`；`dist/game.json` SHA-256：`7EA3955DABC38141A727924CEAC83008BE0581E9210F68CBCF1AA9314DF918F1`。
- `dist/index.html` entry SHA-256：`24DFBB9F31A65CF98186807BC8F0A304B51310018E0831714F4589D32FEE77D7`。
- 主 JS bundle `assets/index-BPLc23-E.js` SHA-256：`1C26346100C38D09BEEE5B7CC331210E29274BA1DC757C67021D9B3C302E6CAB`。
- 僅關閉本子任務的 `morning-portal-labels` session；CLI 顯示無開啟 browser。自有 harness PID `31428`、`22648` 已停止，55956/55957 與 64591/64592 均無 listener。未打包、commit、push、tag 或發布。
