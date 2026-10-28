# Browser QA run record

每個 browser run 複製一份到本輪新 output 目錄後填寫。不要覆寫歷史 record；沒有觀察到的欄位明確填「未知」，不適用才填「不適用」。不得貼 token、Cookie、完整環境變數或無關使用者資料。

## 1. Run 與權限上下文

- 狀態：`未啟動 / 執行中 / 待收束 / 已清理 / 觀測受限 / 失敗停止`
- 開始時間（含時區）：
- 結束時間（含時區）：
- 執行 agent：
- 啟動理由及本次要回答的問題：
- 當次授權／工具 approval 上下文（只記類型與必要識別，不貼秘密）：
- 執行環境／權限上下文（例如本次實際 sandbox 模式）：
- 沿用的已驗證結果與來源；本次不重測的項目：
- 本次驗收範圍、前置與未驗範圍：

## 2. 候選與執行工具

- Game ID（預期 `brightwood-first-oath`，仍須核對）：
- Game version（核對值）：
- Devices 宣告（預期 `desktop`，仍須核對）：
- 存檔宣告（預期讀格式 1–5／寫格式 5，仍須核對）：
- Candidate 絕對路徑：
- Candidate 指紋／識別值：
- 指紋來源及計算／產生時間（如沿用須連回來源）：
- Node 實際版本及絕對路徑：
- Browser CLI 實際名稱、版本及絕對路徑：
- Chrome 實際 channel／版本及絕對路徑：
- Config 絕對路徑、版本或可追溯指紋：
- Config 來源／讀取時間：

歷史 cache 路徑不可視為固定契約。上述版本或路徑如本次無法確認，填「未知」並說明觀測限制；不可推測填值。

## 3. 隔離上下文與來源

- 新 run ID（唯一）：
- CLI session name：
- 新 profile 絕對路徑：
- 新 output 絕對路徑：
- Server 專屬 exec session ID：
- Game loopback port／origin：
- Host loopback port／origin：
- Preview prefix：
- Port 可用性觀察、方法、時間與權限上下文：
- iframe `sandbox`：
- iframe `allow`：
- Fixture 路徑／ID／format／來源／provenance：
- Fixture 是合成資料嗎？：
- Canonical-null guard（origin/key、檢查方法、結果、證據路徑）：
- 新 run 與既有 profile／origin／output 隔離確認：

## 4. 本輪程序 owner

僅記錄本輪觀察到的程序；PID 不可由歷史紀錄複製。命令列保留識別本輪所需內容，如含秘密只記遮除標記，不抄秘密。

| 角色 | 本輪完整命令列（秘密遮除後） | PID | 啟動時間／時區 | Parent PID／程序 | 識別依據與證據路徑 |
| --- | --- | --- | --- | --- | --- |
| CLI／daemon |  |  |  |  |  |
| Chrome 主程序 |  |  |  |  |  |
| Server |  |  |  |  |  |

- CLI session 與 daemon 的關聯證據：
- Chrome profile／parent 關聯證據：
- Server ports／exec session 關聯證據：
- 無法觀測的程序欄位及原因：

## 5. 操作與證據

- 開始頁面（首次未知啟動上下文應為 `about:blank`；若沿用已知可用上下文，記錄依據）：
- 啟動／失敗結果，觀察值：
- 若出現 `0x6D` 或 crashpad 錯誤：保留 log 路徑；是否已停止並避免換 profile：
- 若有環境對照：具體新差異、當次授權／approval、唯一對照及結果：
- 遊戲狀態與操作步驟（含正常 pause 結果）：
- Before raw 路徑及保存狀態：`已保存 / 匯出失敗 / 未產生 / 不適用`
- After raw 路徑及保存狀態：`已保存 / 匯出失敗 / 未產生 / 不適用`
- 必要 log／截圖路徑及保存狀態：
- 直接觀察：
- 推論（與觀察分開）：
- 未知／未驗／觀測限制：
- 本次結果表述及其證據涵蓋範圍：

raw 匯出失敗時不可寫成已保存；保留現有 profile 並記錄失敗。未執行的能力不得標 PASS。

## 6. 收束與最後觀察

- 放鍵／正常暫停完成：
- Before／after raw 與必要 log 已保全：
- 指定 CLI session close 方法／結果／時間：
- 自有 server exec session Ctrl+C 方法／結果／時間：
- 本輪程序收束結果與證據：
- 本輪 ports 收束結果與證據：
- 執行收束查詢的權限上下文及限制：
- 未觀測到的範圍（例如其他權限上下文或全主機）：
- Profile、raw、log 與截圖是否保留及位置：
- 最終狀態：`未啟動 / 待收束 / 已清理 / 觀測受限 / 失敗停止`
- 尚待處理、owner 不明或需回報主代理的資源：

狀態填寫原則：

- **未啟動**：沒有本輪 browser、profile、daemon、Chrome 或 server；寫「無本輪 QA 資源」，不稱清理通過。
- **待收束**：記出仍活動的本輪 session／程序／server，並指出唯一可觀測 owner；停止條件成立時不再嘗試關閉未知資源。
- **已清理**：只對實際觀測到且已正常收束的本輪資源下結論，保留查詢證據。
- **觀測受限**：列明查詢範圍、權限及未知；不得外推為全主機乾淨。
