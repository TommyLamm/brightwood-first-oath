# Brightwood: First Oath

本專案的唯一最新狀態入口：[當前狀態與驗收界線](plan/status.md#current-state)。Plan18 的工作範圍、候選與證據均由該入口維護；本輪流程交付見[Plan18 交接](plan/reports/plan18-process-handoff.md)。

## 歷史快照（以下為當時記錄，現況見頂部入口）

2026-10-27本輪本機交付已收束：Sand主線／q22正常領獎及南航入遺跡已補，所有自有QA服務已清理；原存檔與未提交內容保留。Frost舊q09最後實測3/6未領、q10未重演；相關未改核心測試沿用，不宣稱全流程實機通關。詳[狀態板](plan/status.md)及[最新交接](plan/reports/world-completion-live-handoff.md)。

該階段來源與凍結候選為 **1.0.0-beta.20**，包含航標位置修正，已通過 build、固定 Playroom tools 1.2.0 pack 與完整 ZIP 驗證；[候選報告](plan/reports/world-completion-candidate-beta20.md)記錄指紋。實際瀏覽器流程仍為部分驗收，正式平台／雲端尚未驗證。原01:25／06:30排程已刪；當時使用者另授權2026-10-28香港04:05一次性續作，當前任務完成後由全新Sol Extra High只寫基礎體驗改進計畫，寫好即停，不新增遊玩內容或自動實作。此為歷史授權，後續工作以頂部狀態入口為準。

## 遊戲簡介

原創桌面單機 2D 劍士冒險遊戲，遊戲 ID：`brightwood-first-oath`。

[公開 Repository](https://github.com/TommyLamm/brightwood-first-oath) · [歷史預發布：beta.5](https://github.com/TommyLamm/brightwood-first-oath/releases/tag/v1.0.0-beta.5)

目前來源包含木葉世界、霜雪群島、黃金沙海與遠古遺跡，共18張可玩地圖（7／3／4／4）、19個主線與q20／q21／q22三個支線。beta.19新增霜雪航標調查、日井盆地探索、四區任務手帳及q19完成後可重開的世界回顧。四區內容尚未完成整體遊戲驗收。

存檔格式為讀1–5、寫5。舊格式首次保存前須明確選擇備份升級；暫不升級可不保存地暫時遊玩。beta.18不能讀格式5，原始本機備份須保留；正式雲端另受已公開版本相容檢查，不因本機ZIP有效就代表已通過。

## 本機執行

使用 Node.js `>=24.22.1 <25`：

```sh
npm ci
npm run dev
```

建置與固定 Playroom 工具打包：

```sh
npm run build
node tools/playroom/pack.mjs dist artifacts/game.zip
node tools/playroom/validate.mjs artifacts/game.zip
```

`dist/` 是靜態成品；請透過 HTTP 伺服器開啟。`artifacts/`、`node_modules/`、工具解壓目錄及工作樹快取不提交；固定工具 ZIP 與 lock 保留在 `.playroom/`。Release 提供 `game.zip`。

## 操作

方向鍵移動／爬梯、左 Alt 跳躍、左 Ctrl 普攻、Z 拾取、Space 互動；1–3 技能、Q/W 藥水；I/E/K/C/J/M 開啟面板，Esc 關閉面板或暫停。

## 候選驗收與來源

最新候選：`artifacts/world-completion-beta19/dist/`；ZIP `artifacts/world-completion-beta19/game-beta19.zip`（131,520,178 bytes），SHA-256 `68644dc701fb51fa8f11d69a0698819b4cb01203c8a258d9085c37c5aca6b53b`。相關focused案例、最終型別檢查、一次build及官方pack／完整validate已有證據；瀏覽器與圖片審核按實際完成範圍另記。見 [beta.19封包報告](plan/reports/world-completion-candidate.md)。

封存 beta.18 候選的型別／建置／內容檢查、固定 Playroom tools 1.2.0 打包與完整 ZIP 驗證已通過；封包 SHA-256 為 `779361b5dedbf1a39465d5775a82ec08da920d1c77bb3afa01b26c6e72896f87`。該候選只做過有限本機 iframe／畫面檢查，且不包含目前工作區的後續修改。驗收範圍與未驗項詳見 [beta.18 封包交接](plan/reports/overnight-beta18-package-20261026.md) 與 [Plan16](plan/16-world-completion-roadmap.md)。

正常角色已跨 beta.17／beta.18 分段完成 q01–q08、手動領完第一章獎勵並結算；這不是 beta.18 從零連續通關，也不是四區全流程驗收。完整四區操作、45–60 分鐘節奏、可聽音訊、精確首領轉場清理、原生全螢幕、正式平台 preview／雲端存檔及效能仍未完整驗證。未發布或上架。

圖片原稿、提示詞及匯出證據保留在 `art-source/`，正式資源位於 `public/assets/`；音訊為可重現的原創合成內容。本專案不包含 Playroom 平台人工驗收或上架操作。

- [計畫與開發索引](plan/README.md)
- [Plan16 W02 導航修正交接](plan/reports/world-completion-navigation.md)
- [驗收報告](plan/reports/T16.md)
- [打包報告](plan/reports/T15.md)
- [素材來源交付](plan/reports/asset-recovery-20261018.md)

## 世界地圖（目前四區來源）

按 M 或點選「世界地圖」開啟島嶼總覽；木葉世界有七張地圖，霜雪群島、黃金沙海與遠古遺跡各有獨立區域圖，分別包含 3、4、4 張地圖。選取地標可查看地區情報、等級、居民、探索狀態、相連區域及真實傳點條件；切換圖表或地標不會移動角色，實際移動仍須走已開放的場景傳點。「目前位置」會重新選取角色所在區域，Esc 關閉面板。

世界總覽會按存檔中的訪問紀錄統計探索數，並顯示各區入口條件：霜雪入口要求 q08 已領獎；沙海入口要求 q11 已領獎及 Lv30；遺跡航路要求 q14 已領獎。條件及可玩地圖數來自現有世界資料；未完成的計畫區域僅保留為目錄 fallback，不會遮蓋已加入的四區內容。

第一章首領戰勝利只取得守衛核心，不會代替q08回報及手動領獎；q08領獎後才完成第一章並開放霜雪航路。q11、q14、q19的目的地／回報與入口狀態依任務及傳點資料顯示；q19領獎後可查看世界旅程回顧並繼續完成未領支線，不要求先探索18/18或全部支線完成。

## 歷史來源：beta.5 首版

beta.5 首版交付包含七張地圖、六種普通怪物、一名首領、五名 NPC、八個任務及 24 種物品，並加入世界地圖與圖像化能力／任務頁。當時的預發布連結及這些描述只記錄首版，不代表現況。C 開啟力量／敏捷插畫卡，J 開啟冒險手帳；來源提示詞保留於 `art-source/world-map/`、`art-source/illustrated-panels/`，首版交付報告見 [beta.5 世界地圖／圖像化面板報告](plan/reports/world-map-visual-panels-beta5.md)。beta.5 使用的存檔格式為 1；現行格式與相容範圍以遊戲 manifest 及存檔相容報告為準。
