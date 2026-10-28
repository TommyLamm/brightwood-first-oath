# D beta.15 瀏覽器重試派工

2026-10-25（香港時間），依使用者「再次嘗試瀏覽器測試」續作。沿用已通過ZIP驗證的beta.15來源與成品，不重建、重跑單元測試或重封包；本次不涉及發布或正式帳號。

## 工具恢復與隔離

主代理在既有npm cache找到 `@playwright/cli`，並找到bundled Playwright與已安裝Chrome／Edge。以Node v24.22.1直接呼叫現有CLI，繞過先前Git Bash初始化錯誤，不安裝依賴。sandbox內Chrome Crashpad pipe失敗、服務無法保持連線；透過exec的require_escalated由自動審查批准後，專用localhost harness與隔離Chrome成功載入真正的beta.15 iframe及遊戲選單。未沿用一般玩家profile或原本的origin。

開始前核source treeSHA `8c9388902ffee77d3081e56bbf6caa80388902e8c1ef8beb162a4d2ab6401407`、dist treeSHA `8789d7abde697223beb41fcc2cd4fe5077869848d579b52691035fd8311f715a`均相符。現有ZIP不因測試重建，先前驗證紀錄保留。

## 本批owner

| Owner | 獨占測試範圍 | 隔離及交付 |
| --- | --- | --- |
| 全新GPT-6 Luna Max d_browser_retry | 連續R1、R2門／梯／西返、viewport／Esc與兩子路徑 | session `brightwood-beta15-retry-20261025`；`artifacts/ruins-d/browser/retry-20261025/`；`ruins-d-browser-retry.md` |
| 全新GPT-6 Luna Max d_browser_namespace_retry | 格式1–4匯入、取消／優先／失敗、舊件／備份保全 | session `ruins-d-namespace-retry`；另起ephemeral ports；`artifacts/ruins-d/browser/namespace-retry-20261025/`；`ruins-d-browser-namespace-retry.md` |
| 全新GPT-6 Luna Max d_browser_branches_retry | R3／R4、旅冠代表姿勢、冰潮替代配點短分支 | session `ruins-d-branches-retry`；另起ephemeral ports；`artifacts/ruins-d/browser/branches-retry-20261025/`；`ruins-d-browser-branches-retry.md` |

三owner不控制對方context／port、不重生共享fixtures、不改src/dist/package/manifest或ZIP，也不使用close-all。完整截圖、原始trace與log留各自證據目錄；主對話只收文字摘要。測試層可在自有origin種合法fixture，不透過內部遊戲API跳過玩法。

本派工紀錄只證明工具恢復與開始測試，不代表路線、首領、存檔或全部Plan15驗收通過；實際結果以三份owner報告及後續整合交接為準。Headless解碼或AudioContext運行不能當作已聆聽配樂；正式平台及雲端仍須另有環境與授權。

## 用量中斷後的續作方法

2026-10-26由全新owner接手時，舊主線session已不存在，故q17後半以現有fixture＋先前畫面／checkpoint重建合法synthetic進度並驗證，不能宣稱保住原始canonical raw或單次無縫通關。namespace已完成的browser小log整理成正式報告，不重跑通過項。

測試操作batch結束後先用正常暫停UI，再讀source、截圖或分析；避免把CLI命令之間長時間站在攻擊區內的傷害，錯當成最後一次短動作的傷害。枝線owner曾回報「fullHP在1.4秒死亡」，後續同一有界正常輸入批次量得6.5秒HP無損、再接近1.6秒只扣59且穩定，已撤回短時爆量傷害推論。這是測試時間觀測修正，不是遊戲damage參數修改。

清理紀錄必須區分PID和TCP port；查同號PID不存在不能當作port已關閉，sandbox的EPERM／EACCES亦不能當ECONNREFUSED。只停止自己明確擁有的session／process，不碰其他owner的context。
