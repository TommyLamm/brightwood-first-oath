# NPC 對話焦點改善交接

日期：2026-10-26（香港時間）。本批只修改對話面板焦點、兩句玩家操作說明與 beta.16 metadata；沒有封包、commit、push、tag 或 release。

## 基線與原因

在凍結 beta.15 與 synthetic `q17-q20-ready` 存檔中，靠近行舟後按 Space 開對話，`document.activeElement` 留在 canvas；畫面有兩個可領獎任務，必須再 Tab 才能到任務按鈕。點 HUD「Space 互動」也得到相同焦點。Space keyup 後兩個按鈕仍在，沒有誤領。Esc 關閉後焦點回 canvas。基線互動在隔離 harness 的 versioned game URL 執行；另開了 preview-shaped iframe 頁確認相對路徑載入。

beta.16 的第二次 Enter keydown browser probe 證實另一個直接相關風險：第一個 Enter 領取 q17 後，焦點移到新出現的 q18 接取按鈕；`repeat: true` 的下一個 Enter 會打到 q18。已加入對話 action 專用的 repeat guard，保留後續獨立按鍵操作。

基線準備時曾試用改寫 q16 狀態的本地 fixture；遊戲正確拒絕了缺少 q17 前置條件的存檔。通過結果全部使用原始有效的 `q17-q20-ready` fixture；該次被拒 fixture 留在本批資料夾供追溯。

## 實作

- [src/ui/index.ts](../../src/ui/index.ts)：首次打開對話後聚焦第一個啟用中的內容 action；沒有內容 action 時聚焦關閉按鈕。對話重繪會依穩定 `data-focus` 保留原按鈕焦點；該 action 消失或被停用時，焦點落到下一個可用 action 或關閉按鈕。其他面板沿用原有焦點行為。
- 對話按鈕以任務 ID 或 action ID 設定穩定焦點 identity；停用按鈕不參與對話焦點選擇或還原。
- HUD interact 只有在最上層不是 dialogue 時才把焦點送回 canvas；沒有打開對話時仍可用鍵盤移動。
- 只在 dialogue action button 上攔截重複 Enter/Space keydown，避免一次長按因焦點移動而啟動第二個任務 action。
- 設定操作指南與 [public/game.json](../../public/game.json) 說明普攻和技能點按施放、長按不連發。
- [package.json](../../package.json)、[package-lock.json](../../package-lock.json)、`public/game.json` 版本升為 `1.0.0-beta.16`。Node engine 保持 `>=24.22.1 <25`；沒有改 dependencies。保留工作樹中原有的其他內容、description 與存檔 metadata 修改。

## 驗證

- 安全 Node v24.22.1 執行 `typescript/bin/tsc --noEmit` 通過；Enter repeat 修正後重跑一次通過。
- Vite 8.3.4 將最終 beta.16 build 寫入 [dist](../../artifacts/overnight-20261026/dialogue-focus/dist)。Enter repeat probe 發現風險後先改 source，再重建最終 dist；交接以第二次 build 為準。
- 真實 browser 用隔離兩 origin harness 與專用 `night-dialogue-focus` session，最終互動走 preview iframe：
  - Space 開 dialogue 後焦點在首個 q17 領獎按鈕；同次 Space keyup 後 q17、q20 仍可領取。
  - HUD interact 開 dialogue 後焦點也在首個 q17 領獎按鈕。
  - 首個 Enter 手動領取 q17；後續 `repeat: true` Enter 指向 q18 接取鈕但沒有啟動 q18，q20 領獎仍在。新的獨立 Enter 接取 q18，焦點移到 q20；獨立 Space 領取 q20 後焦點回到關閉按鈕。
  - Esc 關閉後焦點回 canvas；接著按方向鍵不需再點擊。I/J/M/K 分別打開並關閉正確面板。
  - 設定中將互動鍵改為 Y 再改回 Space；商店數量欄重繪後仍保留輸入值 7 與焦點。
- Browser console 沒有遊戲錯誤；可見一個父頁 `/favicon.ico` 404 及 harness iframe sandbox warning。
- 沒跑全套測試或內容檢查。Remote beta.16 tag 查詢因 `github.com` DNS 解析失敗而未驗；沒有平台、雲端或 release 驗證。

## 成品與證據

- QA build：`artifacts/overnight-20261026/dialogue-focus/dist/`，manifest `1.0.0-beta.16`。
- SHA-256 dist fingerprint：`44583c48e0ff832b212177e88e9c1028dc61be0d2d16d65b83abe396dc81a4ab`（274 files，135,703,482 bytes）。逐檔 fingerprint 在 `artifacts/overnight-20261026/dialogue-focus/dist-fingerprint.json`；entry JS `assets/index-lHm1gsN3.js` SHA-256 `0b0e9bebfcdc5cb94c6c6aef6b7dec95efde9c321ecbfd2a6db073052f30a0e3`。
- Browser command summaries、fixture 與兩次 harness ownership 狀態在 `artifacts/overnight-20261026/dialogue-focus/`。最終 browser session 已關閉；PID 15820 的 beta.16 localhost harness 已停止。

## 後續

主代理可將 UI 改動與 beta.16 QA 成品整合。Remote tag 需在 DNS 可用時再查；本批沒有任何發布操作。
