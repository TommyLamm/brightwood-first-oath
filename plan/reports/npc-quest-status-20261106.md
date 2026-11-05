# NPC 任務狀態辨識 — beta.84

2026-11-06 03:16 HKT，本機 `1.0.0-beta.84`，dist 已建置，未發布。

NPC 原本同時以金葉表示「可接取」及「可交付」。現在保留金葉與原來位置，名稱旁增加 `! 可接取` 或 `✓ 可交付`；可交付同時用淡綠文字輔助，辨識不只依賴顏色。同一 NPC 同時有兩種狀態時，先顯示可交付；領獎後自然回到下一個適用狀態或純名稱。沒有改任務條件、對話、獎勵、NPC 動畫／位置或存檔。

`questMarkerStates` 直接使用既有 QuestView，只有 available giver 及 ready turn-in 會出現；可交付的優先序不依賴陣列順序。renderer 名稱與金葉可見性使用同一結果。

開工前 03:11 HKT 經網路取得 Playroom 範本、開發與操作規格、Schema、workflow、SDK、版本及存檔文件，8/8 與先前完整讀取全文相同。穩定 ID、相對資源、SDK 與讀 1–5／寫 5 保留。

Node 24.22.1：`src/render/geometry.test.ts -t "renderer quest markers"` 3 passed／10 skipped，typecheck 及 build 通過。限定既有基本案例、兩種排列下的優先序、領獎／缺失定義。未跑其他 geometry tests、全回歸、content、browser、ZIP 或平台驗收；文字及顏色的實畫未重驗。

唯讀前置也確認 standalone 啟動已有立即回應，無須再改 SDK；48 個相同受阻掉落／32 滿格、500 次 Node 合成 selector 測量約 0.090 ms／次，未據此加快取，不能當成瀏覽器 FPS 證據。
