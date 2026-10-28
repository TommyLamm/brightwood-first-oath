# W02・木葉世界與共用導航修正交接

日期：2026-10-27。狀態：**W02_NAVIGATION_UPDATED／FOCUSED_CHECKS_PASS；尚未打包成新候選。** 本報告只描述本包實際修改；不把工作樹中其他代理或先前工作留下的 dirty diff 算入本包。

## 已完成

- `src/ui/index.ts`：標題頁按實際恢復規則決定「上次進度」地名。只有 `guardian-arena` 存檔顯示恢復點「古礦入口」；冰潮洞窟、日井祭壇、誓鐘內殿等其他首領地圖顯示其實際存檔地圖。
- `src/ui/index.ts`：古礦守衛勝利卡依 q08 狀態說明核心／任務條件及手動回報領獎；只有領取 q08 後的第一章結算卡才說明核心已交付、獎勵已領，並指引從赤岩山徑經古礦入口回祭壇、再走東側航路到雪痕海岸找雪芽。q09 可接時，任務追蹤列也直接指出霜雪群島目的地。
- `src/ui/world-map-model.ts`、`tests/world-map.test.ts`：新增供標題頁使用的 saved-map 顯示 ID helper，並加一個聚焦案例覆蓋 Guardian 修復點與另外三個首領地圖。
- `README.md`：現況改列四區、18 張地圖、19 主線與 q20 支線；beta.5 改明確標成首版歷史。區域圖及傳點條件描述依目前資料更新，列出封存 beta.18 的 SHA 與其有限驗收範圍，明確說明工作區後續來源尚未建成候選、q21／q22 仍屬提案，以及平台／全區完整流程等未驗邊界。保留操作方式、公開 repo、歷史 beta.5 release 連結及素材來源。

## 保留的正確行為與邊界

共用地圖本來已由真實 catalog 顯示各區地圖數、探索數、相連傳點與入口條件；現有 focused cases 覆蓋 Frost 的 q08、沙海的 q11＋Lv30、遺跡的 q14，及不同任務狀態下的入口。地圖選取只改情報圖表，不移動角色。`PLANNED_REGIONS` 保留作 catalog 尚無可玩地圖時的 fallback；目前三個已實裝後續區域不會被標成待開發。這部分沒有重寫。

q11、q14、q19 的任務目的地／手動回報語義與各區入口已有內容，本包不調整契約或任務資料；q19 後的世界結局／探索回饋留給 Plan16 W06，未新增 q19 結局。未改 `src/app/`、內容、存檔格式、SDK／manifest 版本或素材。

## 檢查與環境

- 使用 bundled Node：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`，版本 `v24.22.1`。
- `node_modules/vitest/vitest.mjs run tests/world-map.test.ts --exclude '**/.worktrees/**'`：1 個檔案、9 個案例通過。
- `node_modules/typescript/bin/tsc --noEmit --pretty false`：exit 0。
- `git diff --check -- README.md src/ui/index.ts src/ui/world-map-model.ts tests/world-map.test.ts`：exit 0；Git 顯示 README LF 轉 CRLF 提示，無 whitespace error。
- 沒有執行完整測試套件、build、browser、pack、zip 驗證或發布。

## 候選與後續驗收

最近封存候選仍為 `1.0.0-beta.18`；其 ZIP SHA-256 為 `779361b5dedbf1a39465d5775a82ec08da920d1c77bb3afa01b26c6e72896f87`，pack／完整 validate 的既有紀錄見 [beta.18 封包交接](overnight-beta18-package-20261026.md)。它不含本輪與工作區其他後續修改。正式平台 preview、雲端存檔、全區完整流程、可聽音訊、原生全螢幕與效能仍不能由本包檢查推定已驗。

下一步依 Plan16 推進其他工作包；需要重跑時只選受後續變更直接影響的 focused checks。保持現有版本、格式、遊戲 ID、玩家存檔與候選產物不變。
