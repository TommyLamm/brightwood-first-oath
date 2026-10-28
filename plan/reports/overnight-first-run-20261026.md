# β17 新玩家第一章入口實測

## 狀態

Owner：`morning-first-run`。本次只讀取 frozen dist 並以一般遊戲 UI 操作；不改 source、metadata、存檔數值，不 build、test、pack、commit 或發布。

## 已讀規格與本次適用要求

- `plan/01-game-design.md`：新角色流程、桌面鍵盤操作、無自動戰鬥、失焦輸入清空、按住 Z 撿拾。
- `plan/08-content-spec.md`：正式地圖/傳點、NPC 互動距離、q01–q08 的手動接取/手動領獎與順序；本次先驗 q01、q02，再按正常順序續推。
- Playwright skill、CLI reference、workflow reference：named session、快照後按穩定 UI refs 操作、短批次後再讀狀態。
- Playroom 遠端平台規範由主代理在此 goal 已完整閱讀並轉述；本次是 frozen candidate 的本機可玩性實測，不做發布驗收。

## SUT gate

- 唯一 SUT：`artifacts/overnight-20261026/import-feedback/dist`
- `game.json` version：`1.0.0-beta.17`
- entry：`index.html`
- entry JavaScript：`assets/index-C1-e-S4C.js`
- 預期 dist tree SHA256：`0256fc3faea34ab5c8c2bccf9f7434565797ecdb2dad69cd9cfd1a064bd95be4`
- 根目錄 `dist/` 不作為測試目標。

## 隔離與驗收

- Browser session/profile：`morning-first-run`；本機兩個隨機 localhost origin，各自使用空的 origin storage。
- 本機靜態服務由本任務自己的 `server.mjs` 提供，只讀上述 dist；service PID `12348`、browser PID `12412`、origin `127.0.0.1:53013`／`:53014` 與啟動時間記錄於 `artifacts/overnight-20261026/first-run/`。
- 第二個 origin 以同一 named profile 新 tab 開啟，唯讀確認 localStorage 為空；角色存檔只在第一個 origin。
- 核心驗收：一般 UI 建立 Lv1 新角色；森芽手動接 q01；以普通 Ctrl 攻擊真擊殺 3 隻蝸牛；確認任務 ready 後回森芽手動領獎；沿正常傳點抵達木葉鎮；由岩嶺教官手動接 q02、完成抵達回報並手動領獎。不得使用高等 fixture、app API、改 exp/HP/quest/clock 或跳關。
- q01/q02 完成後按 q03–q08 順序推進；遇到可重現的產品缺陷即保存 canonical raw/hash 和精簡重現步驟、通知主代理。08:40 起安全收尾，09:00 前只停止本任務服務與瀏覽器 session。

## 進度

- 狀態：q01、q02、q03 已完成並手動領獎；本 owner 停在木葉鎮，q04 對話已出現但尚未接取，供下一位 owner 從原始存檔續作。
- 已完成：一般 UI 建立角色「晨行者」，起始 Lv1/初心者；森芽手動接 q01；用 Ctrl 普攻擊殺 3 隻苔殼蝸牛；手動領 q01 後 UI 顯示 Lv3、EXP 60/103、HP120/120、coins200、小紅×14、未分配 AP10。沿 camp:east 正常抵達木葉鎮後，手動接 q02（接受時 UI 顯示「到達木葉鎮 1/1」），再手動領獎；結果 Lv10 劍士、EXP250/460、HP260/260、coins400、鐵製長劍×1、SP1/AP45 未分配。
- q01 claim 後 canonical raw：`artifacts/overnight-20261026/first-run/checkpoint-04-q01-claimed.json`，SHA256 `0c9d09071856071ce2bb3201238c0623cd02d57419c5e79d99a9950ad4de128d`。q02 ready raw：`checkpoint-06-q02-ready.json`，SHA256 `28203671a1d0e78efc40b5222295f81f97d44bac1e81e843e300c0308c87f2b0`；q02 claim raw：`checkpoint-07-q02-claimed.json`，SHA256 `2b5e25b1011b5e7c26ab6c1734c4d0571a2e5f71ed8449f432e263662e337e19`。
- 傳點操作觀察：前兩次在移動後按 Space 回覆「附近沒有可以互動的對象或出入口」；稍微前移後再正常 Space 即抵達木葉鎮。原因未定位、未穩定重現，不列產品缺陷。
- 可見性觀察：營地東側有一張 active scene 截圖當時看不到角色；後續左移 650 ms 與蝸牛接近截圖均看得到角色，沒有穩定重現，因此暫不列為產品缺陷。原圖與縮圖保存在 first-run/evidence/。
- 未驗證：q04–q08；q04「菌林調查」只在 q03 claim 後的岩嶺教官對話中呈現可接取按鈕，尚未接受或遊玩。
- 證據與 canonical 存檔：`artifacts/overnight-20261026/first-run/`。

## q03 完成與續作交接（2026-10-26 HKT 07:17）

- q02 後以一般面板將 45 AP 全加 STR、學習重斬1並裝備鐵製長劍；q03 升 Lv11 後再以一般面板將 5 AP 加 STR、用 1 SP 升重斬至2。q03 由木葉鎮岩嶺教官手動接取，正常進入嫩芽林道，手動擊殺史萊姆並拾取林心種子至 5/5；任務日誌明確顯示返回木葉鎮回報。使用場景中的「返回城鎮」正常回木葉鎮，與岩嶺教官對話後按「領取任務獎勵」手動領獎。
- 領獎後 UI 顯示 Lv13、EXP600/703、HP320/320、MP64/64、coins700，並顯示後續任務「菌林調查」；canonical raw 顯示 q03 `claimed`、背包含 `leather-vest`×1，武器仍為 `iron-sword`，身上 body 為 `cloth-shirt`，未分配 AP10、SP2，技能 `heavy-strike` rank2。raw location 是 `town` / `center`。q04 尚未接取。
- q03 4/5 checkpoint：`checkpoint-19-q03-seed-4.json`，SHA256 `3574279ec25e717e1a2f585a3f66987d1ed4bacdaaf629bf590640cdbcd087f2`；q03 ready：`checkpoint-20-q03-ready.json`，SHA256 `cde552731f31b4adb99030b6e4b3ecf36d054ad60271d939666f6428ece7d3a0`；q03 claimed canonical raw：`checkpoint-21-q03-claimed.json`，SHA256 `5b13a38c4edc917910d0d3e4031ddaa96f7d45917d27a2678022125fb650cd07`，884 bytes。來源為 UI 顯示本機已保存後唯讀匯出 `brightwood-first-oath:save:v1`；摘要在 `.meta.json`。不以 raw 回灌或修改任何數值。
- 下一步給新 owner（使用 beta18）：在「木葉鎮」找岩嶺教官，透過正常 Space 對話手動接「菌林調查」，不要重跑 q01–q03。field 回城已由「返回城鎮」按鈕確認成功；新 owner 從 `checkpoint-21-q03-claimed.json` 恢復，版本/恢復邊界須照實標註。
- 操作批次：每批以 named session 操作；先按「繼續遊戲」、click canvas 恢復焦點，短時間按住方向鍵，基本攻擊 Ctrl 以 550 ms 間隔離散按放，Z 以約 700 ms 拾取；`finally` 放開方向/攻擊/技能/藥水/拾取鍵，再使用畫面上的「暫停遊戲」按鈕（有面板時先正常關閉）。批次後讀 HUD/任務計數再決定下一步。這是本 session 可確認有效的操作方式；不代表每次輸入都命中或拾取成功。
- 缺陷：本次沒有穩定重現的產品缺陷。多個移動/攻擊批次因距離未產生命中或拾取，靠位置調整後正常完成，屬操作過程不列缺陷。未 build、test、pack，也未改 source、metadata 或存檔。
- 證據：`artifacts/overnight-20261026/first-run/evidence/`；完整 raw 與 session/server ownership 紀錄位於 `artifacts/overnight-20261026/first-run/`。
## Owner 收尾

- 2026-10-26 HKT 07:20:34 關閉 named session `morning-first-run`；Playwright CLI `list` 回報 `(no browsers)`，PID12412 已不存在。
- 先核對 PID12348 command line 是本任務 `artifacts/overnight-20261026/first-run/server.mjs`，再停止該 PID。之後 PID12348 已不存在，`127.0.0.1:53013`／`:53014` 的 listener 為 0。
- 保留 `service-ownership.json` 啟動 ownership；另存 `session-start.json`、`session-stopped.json`、`service-stopped.json`。最新接續 raw 為 `checkpoint-21-q03-claimed.json`。未關閉其他 browser/session，也未影響其他 port。