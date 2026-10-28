# 遠古遺跡 D／Plan15 交接

後續交接入口（2026-10-26）：本文件保留D首次完成時狀態。瀏覽器已恢復並補完namespace、分段q15–q19／R2及少量枝線；後續必要改善已另立beta.17並完成ZIP。請先讀[自主優化集中交接](overnight-optimization-handoff-20261026.md)與[主線重試報告](ruins-d-browser-retry.md)，不要將初次工具失敗視為目前全部未驗，也不要把分段或舊版本證據當成beta.17完整通關。

2026-10-25（香港時間）。ID `brightwood-first-oath`，本機候選 **`1.0.0-beta.15`**。本輪由主代理統籌全新 GPT-6 Luna、max reasoning，最多三名並行，各批明確釋出檔案後交接。主代理完整讀線上規範並依使用者指示轉述給子代理；主對話沒有載入圖片。**程式及本機候選 ZIP 完成，真實瀏覽器驗收受環境阻礙，Plan15 尚未全部驗收。**

## 完成狀態

| 狀態 | 結果 |
| --- | --- |
| SOURCE_READY | 完成：namespace、明確匯入／暫不匯入、metadata、聚焦測試及獨立 build |
| LOCAL_BROWSER_VERIFIED | **UNVERIFIED**：沒有載入遊戲 iframe，R1–R4及聲畫／計時／resize／瀏覽器存檔驗收均未執行 |
| ZIP_VALIDATED | 完成：固定 tools1.2.0 pack／完整 validate exit 0，另做有限路徑／機密樣式掃描 |
| PLATFORM_PREVIEW_VERIFIED | 未執行：未提供平台測試環境 |
| FORMAL_CLOUD_VERIFIED | 未執行：未操作正式帳號或玩家資料 |
| GITHUB_RELEASED | 未發布，沒有 commit／push／tag／Release |
| PLATFORM_PUBLISHED | 未匯入／人工 review／上架 |

## 程式與資料保全

正式入口及 `GameApp` 預設 ID 統一為 manifest 的 `brightwood-first-oath`。canonical key 仍為 `brightwood-first-oath:save:v1`，development 另加 `:dev`，不以 key 尾碼代替資料格式號。明確傳入的其他遊戲 ID 仍可作隔離測試。

canonical 不存在時，本機 standalone／guest 才檢查同模式 `maplewood-swordsman` 舊 key，先驗格式1–4與目前完整 catalog，再顯示「匯入舊版進度／暫不匯入」。匯入前重查連線模式、來源與目標，逐字複製並回讀確認；取消、來源變更、目標出現、寫入失敗均保留原件。canonical 已存在時優先使用它，損壞時不暗中回退舊件。原舊 key 與歷史備份不刪、不雙寫。

匯入的格式1–3在第一次正常寫4前保留 canonical `:formatN-backup`；不同既存備份或失敗會停止覆寫。authenticated／preview 不提供本機匯入。現有 SDK readiness 沒有帳號識別資訊，不能宣稱偵測同模式的帳號身份變化；本次以禁止 authenticated 匯入、重新檢查可見 readiness 與 generation 取消保護匯入流程，沒有擴張讀取帳號或憑證。

package／lock／manifest 版本統一 beta.15，Node engines 收緊為 `>=24.22.1 <25`，依賴不變。維持 schema2、SDK1.1.0／protocol1、讀1–4寫4、desktop、無排行榜；q01–q20、首領數值／時序及素材不變。版本不代表格式5。

## 實際驗證

- 最終兩個聚焦檔共 **27個不同測試案例通過**：namespace21、app6。首批兩檔23項；補4個資料保全負例後只重跑變更的 namespace 檔21項，沒有重跑 app 或 C 的127項。包括正式 manifest ID／預設 App、dev/build 隔離、四格式匯入、取消、canonical優先、錯誤資料、模式變化、invalidate、精確回讀、setItem拋錯及備份衝突。
- 使用 bundled **Node v24.22.1**；一次 typecheck、production loader 219個引用（四包與 anchors）、一次獨立 Vite build與成品檔案／SHA核對通過。沒有內容定義變更，未重跑 `check:content` 或完整測試套件。
- D build 後重生11份 synthetic fixtures，rules／world／11筆save validators通過；這些不是瀏覽器或正式雲端通過證據。
- 固定工具1.2.0 ZIP及metadata五檔SHA通過；pack／validate透過既有runner再次自動驗工具完整性，兩者exit 0。另掃274個路徑及14個runtime文字entries／8類高信心秘密樣式，零發現；這是有限掃描，不是全面安全保證。

瀏覽器工具限制：Playwright wrapper在Git Bash初始化時access denied；直接npx短探測無輸出；CUA IAB不可用；Firefox原生啟動呼叫掛起452.6秒後被主代理中斷，沒有成功窗口或載入結果。自有雙origin服務PID21308已停止。沒有遊戲截圖、實際通關、首領雙招／配樂聆聽／戰鬥時間或本機瀏覽器匯入證據。ownership停止metadata曾寫入中斷而成0 bytes，依已讀記錄重建並註明，未冒充原始完整證據。詳見 [browser report](ruins-d-browser.md)。

## 來源與產物

來源包含既有未提交A–C與本輪D修改，不能僅用HEAD代表候選。基礎HEAD `d410f674a7e69ba0ec3704b4764549bb5041323a`；沒有清理 `.claude/`、`.worktrees/` 或舊A/B/C成品。

| 項目 | 路徑／值 |
| --- | --- |
| D成品 | `artifacts/ruins-d/dist/`；274檔、135,702,472 bytes |
| Source treeSHA | `8c9388902ffee77d3081e56bbf6caa80388902e8c1ef8beb162a4d2ab6401407`；341個scoped source/config/public檔 |
| Dist treeSHA | `8789d7abde697223beb41fcc2cd4fe5077869848d579b52691035fd8311f715a` |
| ZIP | `artifacts/ruins-d/game-beta15.zip`；131,513,398 bytes、274 entries、解壓135,702,472 bytes |
| ZIP SHA-256 | `1d7de2c3d38f19ff03bbc279daaea5b724c354183545ed66758d63dbb376e7dc` |
| 封面 | `cover.png`，133,001 bytes；沿用既有封面，未生成新圖 |
| 固定工具SHA | `24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022` |

逐檔指紋、引用、建置與ZIP摘要留 `artifacts/ruins-d/{source-fingerprint.json,asset-reference-check.json,build-summary.json,zip-validation-summary.json}`；驗收摘要 `artifacts/ruins-d/acceptance-summary.md`；原始pack／validate／有限掃描紀錄在 `artifacts/ruins-d/logs/`。artifacts依既有ignore只留本機，不會因來源push自動包含。

規格讀取時間約2026-10-25 20:46–20:52 HKT，全文來源與批次分工見 [dispatch](ruins-d-dispatch.md)。各項實際命令及限制見 [environment](ruins-d-environment.md)、[namespace](ruins-d-namespace.md)、[storage failures](ruins-d-storage-failures.md)、[integration](ruins-d-integration.md)、[browser prep](ruins-d-browser-prep.md)、[package](ruins-d-package.md)。

## 下一步

瀏覽器工具可用後，先核現有source/dist指紋沒有改變，重啟自有隔離harness，按Plan15 §5/§6完成R1–R4及聲畫／本機存檔代表路線；不因本輪工具失敗新增永久作弊入口或重跑全部C測試。沒有相關程式變更時沿用同一build／ZIP，不為補瀏覽器證據重建。

正式平台URL／授權測試登入context可用後，再做D3。Git提交／push、tag／Release、平台匯入／人工review／上架各按後續明確授權處理；發布前重查遠端beta.15 tag（本輪shell DNS受限，公開Release及raw ref404只作旁證）。正式Release唯一附件名仍須`game.zip`；直接複製本機已驗ZIP時須核前後SHA相同。格式4的正式相容／保存、雙登入context及衝突／session等外部驗收仍未完成，不自行建立橋接版或操作玩家進度。
