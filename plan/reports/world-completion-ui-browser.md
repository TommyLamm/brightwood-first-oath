# Plan16・四區手帳與存檔升級 UI 瀏覽器交接

日期：2026-10-27（香港時間）。狀態：**PREPARED／LOCAL_BROWSER_UNVERIFIED**。

## 候選與準備

- 根代理確認 `artifacts/world-completion-beta19/dist/` 已完成一次 build、固定工具 pack 與 full validate；本代理沒有重跑這些工作，也沒有改候選。
- 候選為 `brightwood-first-oath` `1.0.0-beta.19`，schema 2、讀取 format 1–5／寫入 format 5。根代理提供的 dist tree SHA-256：`5110333affb98209126ce849ee144838bb5a374ab8b533bd0f6b68e04a03ed4c`；ZIP SHA-256：`68644dc701fb51fa8f11d69a0698819b4cb01203c8a258d9085c37c5aca6b53b`。
- 本代理唯讀取得候選 `game.json` 與 `index.html` SHA-256：`5c209a86c8d614653413ba0e791c73ac140c256d3b9e25487312149187f40b18`、`475d1dbdad527c17ea9455b7a9c55ab1d72f56a62feda779997ace9c408d87fa`。詳細快照在 [candidate-snapshot.json](../../output/playwright/world-ui-beta19/candidate-snapshot.json)。
- 已建立專屬輸出目錄 `output/playwright/world-ui-beta19/` 與 960×540 `playwright-cli.json`。現成 CLI 的 help 可由 bundled Node 成功執行；CLI 完整路徑為 `C:\Users\Tommy\AppData\Local\npm-cache\_npx\31e32ef8478fbf80\node_modules\@playwright\cli\playwright-cli.js`。後續須使用獨立 session `world-ui-beta19-b3`，工作目錄保持在此輸出目錄。
- 曾以輸出目錄內的暫定 npm cache 路徑探測官方 npx wrapper 30 秒，未得到輸出；該 cache 路徑未建立。沒有改 repo package／lock，也沒有安裝或全域更新套件；隨後改用已存在的 cached CLI。

## 已讀依據與適用要求

- 本代理讀取 repo `AGENTS.md`、[Plan16](../16-world-completion-roadmap.md)、[存檔實作交接](world-completion-save-implementation.md)、[UI journal](world-completion-ui-journal.md)、[導航交接](world-completion-navigation.md)、[live handoff](world-completion-live-handoff.md)，以及 Playwright skill、CLI reference、workflows。Playwright skill 要求 CLI-first、先 snapshot 再按最新 refs 操作；不得轉成 `@playwright/test` 測試規格。
- 根代理已完整重讀本輪適用的八份 Playroom 線上 main 規格：game-agent-template、game-development、command-contracts、game.schema、game-release、starter SDK 1.1.0、sdk-versioning、save-compatibility。此代理只沿用該輪結論：固定遊戲 ID、desktop、相對資源路徑與 sandbox iframe；格式升級前明示並等玩家確認；暫時遊玩不保存；不將 preview 當正式雲端保存。
- 本批原定的最小驗收：format4 確認前原 raw 不變且沒有 format5；明確確認後 exact format4 backup、canonical format5，玩家欄位保全並 reload 不再出現 gate；另一獨立 context 暫時遊玩不寫 format5；q19 標題地名、主線／支線手帳分組、可重開世界回顧與未完成支線目的地；960×540 至 640×360 操作區、Esc／焦點。

## 實際執行與未驗

- 根代理通知用量窗口已用 92%，並要求本輪不要新開長矩陣；由於通知到達時尚未進候選頁，本代理依指示只留下候選快照與環境準備，交下輪續做。
- 成功執行 cached CLI `--help`；已確認 repo/global 沒有 CLI binary。CUA 只讀取了 browser/app inventory：看見既有 Chrome TeamViewer 分頁，沒有操作或導航該分頁。
- **未**啟動本代理的雙 origin server、browser session 或 iframe；未種入任何 fixture、未讀寫 browser storage、未使用雲端帳號。沒有 A–D UI 結果、截圖、raw before/after、server PID／listener 或遊戲 console 證據。
- 未執行測試、typecheck、build、pack、validate、平台 preview 或發布；以上候選 build／pack／validate 僅引用根代理結果。
- 沒有需要清理的本代理 server/context；沒有開始音訊審核，音訊仍未驗。

## 下一步

續作時先重讀本報告與根代理最新 handoff，確認 beta19 dist SHA 未變；使用 cached CLI 的 bundled Node、獨立 session `world-ui-beta19-b3`，並在本目錄建自己的 ephemeral 127.0.0.1 雙 origin harness，不共用其他 QA 的 server/profile。選擇任何 format4／q19 合成 raw 前先以候選對應的嚴格 save validator 驗證；只在新 origin 種一次 fixture，保存 raw 與 SHA，再依上述最小驗收操作。關鍵畫面只留必要小型 JPEG 供同一 Sol 審圖，不由 browser owner 自判視覺合理性。完成後核對自有 PID/listeners 與 CLI session，保全證據後清理；未做項維持未驗。
