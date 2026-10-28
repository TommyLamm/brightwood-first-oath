# 遠古遺跡包 D：瀏覽器驗收狀態

日期：2026-10-25（香港時間）。狀態：**LOCAL_BROWSER_UNVERIFIED**。本報告只記錄環境限制；沒有完成任何遊戲內瀏覽器驗收。

## 已完成的本機準備

- 使用安全 Node **v24.22.1** 重生 `artifacts/ruins-d/fixtures/`。遊戲 ID `brightwood-first-oath`、來源 manifest `1.0.0-beta.15`、save format 4；`validateRules`、`validateWorld` 及全部 **11** 筆 `validateSave` 均通過。索引已更新至 beta.15 catalog。
- 確認凍結 D dist fingerprint 為 `8789d7abde697223beb41fcc2cd4fe5077869848d579b52691035fd8311f715a`。未修改 dist、src、tests、package 或 manifest。
- 專用雙 origin harness 曾由本輪啟動：PID **21308**，父頁 `127.0.0.1:60554`、遊戲 origin `127.0.0.1:60555`，版本 beta.15。現已透過本輪 terminal session Ctrl+C 停止；停止後 PID 查無程序。

## Browser 阻礙與證據

- Playwright skill wrapper 不能由 Git Bash 啟動，錯誤：`NtCreateDirectoryObject(\BaseNamedObjects\msys-...) : 0xC0000022`。
- `npx` 版本為 12.0.2；一次直接執行 `npx --yes --package @playwright/cli playwright-cli --help` 在 10 秒探測內沒有產生輸出。未再追修環境。
- CUA browser inventory 為空，`cua.getBrowser({id:"iab"})` 回 `Browser is not available: iab`。
- `@oai/sky` 的 Windows app inventory 有 Firefox 與 Firefox Private Browsing，兩者當時未運行且沒有 window。啟動 private Firefox 的唯一呼叫在 **452.6 秒**後回 `aborted by user`，沒有回傳啟動結果；主代理隨後的程序檢查也未找到 Firefox。
- 沒有打開 harness URL、沒有載入 D iframe、沒有瀏覽器截圖／錄影／遊戲日誌；`artifacts/ruins-d/browser/` 沒有可作為遊戲驗收證據的畫面。

因此 R1–R4、兩個版本路徑與 preview 子路徑、首領攻擊／轉場／勝利、resize／Esc、旅冠穿戴、兩配點計時，以及 namespace 舊 key 匯入、raw 備份、取消、壞檔與儲存失敗皆**未驗證**。fixture validators 和啟動 harness 不代表遊戲行為通過。

## Harness ownership 記錄

`artifacts/ruins-d/browser/harness-ownership-21308.json` 的原檔在 Ctrl+C 時寫入中斷而成為 **0 bytes**。目前 stopped 記錄由 browser owner 依原始啟動輸出與先前讀到的 ownership 內容重建，並已在該 JSON 的 `metadataRecovery` 欄註明；它不是未受損的原始停止證據。
