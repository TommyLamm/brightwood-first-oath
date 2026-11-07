# beta57・Terra 本機驗收派工

2026-10-29（Asia/Hong_Kong）。**PAUSED_BY_USER／LOCAL_QA_NOT_STARTED**。使用者明確要求「讓 Terra 來驗收」，並限定「不需要，本機測試就可以」。只做本機真瀏覽器／子目錄／跨來源 iframe；不登入平台、不做真帳號雲端、不發布正式版或新候選、不新開優化 Plan。

root 本次完整網讀八份 Playroom 規格（refs209–212，含完整尾段）；讀取 Playwright 與 computer-use 技能、browser lifecycle、overlay-review、beta24 browser recovery、Plan19 失敗紀錄及既有合成前置。已確認 npx 可用、無 .codegraph。Playwright 為首選；其他 UI 工具必須先完整讀對應技能與 API，只有單一 Terra 可操作 browser。

## 目標與所有權

全新 GPT-6.1 Terra／max／fork none 為唯一 browser／視審 owner。候選固定是實際 GitHub beta57 的本機副本 `.playroom/tmp/release-beta57/published/game.zip`：131,528,745 bytes，SHA-256 da32d0cfdf606c86d954466a54dabc0f765edf6ba1ff116635180f703c20589f。已過 build／ZIP／有限文字掃描沿用發布結果，不重跑。

run ID `beta57-terra-local-20261029-01`。只新寫 `output/playwright/<run>/`（profile／raw／圖／log／fixture／harness）、`.playroom/tmp/<run>/`（實際ZIP新解壓副本／工具暫存）及 `plan/reports/beta57-terra-local-acceptance-20261029.md`。root 獨占 status／README／本派工文件。全部 src／public／tests／舊候選／舊證據／玩家資料唯讀；Terra 不修產品 source，不 commit／push／tag／Release，不另派子代理。

## 啟動與隔離

不重演已知失敗的 use_default crashpad 路徑。先用 beta24 已有成功證據的一般桌面權限情境，經當次 exec 工具 approval，讓獨立 profile 的 headed Chrome 首次開 about:blank；這是本次初次啟動，不做對照矩陣。若重現0x6D則一次留log停止該路徑，不自動再升權、換profile或重裝。若工具自動審核拒絕，記動作／理由並通知root；不繞過拒絕。

工具版本／路徑本次解析記錄，無需下載更新。歷史 CLI cache 路徑只作線索，不是固定契約。Node 已有24.22.1；Python311可用。先新 profile／output／CLI session，再按 lifecycle 填 run record，記 daemon／Chrome／server 各自 owner。預定不同 loopback ports43971 game、43972 host，先實際bind確認；另需 fixture origins 時才新增獨立已核port，逐一記錄。

實際ZIP解壓到新tmp，作版本／預覽子目錄 served assets；host iframe 設 sandbox="allow-scripts allow-same-origin allow-pointer-lock"、allow="fullscreen; autoplay; gamepad"。子目錄指向實際 beta57，不能重build或偷偷用 source devserver代替。

## 明確驗收矩陣

每列保留實際動作／預期／觀察／PASS或FAIL或UNVERIFIED／證據路徑。只執行必要短route；正常輸入遇阻先記錄，不長時間農怪或用內部API跳進度。

| 組 | 必做短段 |
| --- | --- |
| A | 空白新 origin 的 canonical-null guard；正常新角色（無效名字提示→合法名字）、一般行走／普攻／互動／暫停／Esc、存檔後 reload／Continue，對照名字及實際進度。 |
| B | 設定：右Ctrl別名衝突提示、一次合法新綁定與實際開背包一致、Esc取消；靜音與三音量說明。用正常UI恢復此QA角色設定。音訊聽感無法觀測則明記，不把設定值當聲音PASS。 |
| C | 商人／滿包合成前置：small-red98+small-blue5+30cloth-cap共32格；紅買1可補堆疊、買2不可、帽不可買；數量欄有焦點時相鄰單擊只交易一次。預覽／金幣／數量與after raw對照。 |
| D | 背包：分類數／HUD容量、出售前槽後舊選取／數量不轉到移位物；裝卸預覽與實際數值、藥水預覽→實際HP/MP及冷卻提示。 |
| E | 進階合成前置：AP8／SP3、level10 swordsman、受傷HP/MP、少量藥水及cloth-cap、snail-shell等真catalog物品；測單次AP預覽／全部敏捷、技能SP／maxHP預覽、素材批次收入／騰位／金幣after預覽。必須先validateSave／prepareSave接受新fixture，不能自創catalog條目。 |
| F | 手帳：q01可接取及active counters snail3待回報兩個獨立合成前置，測選取一致／HUD待回報數／接取與回報NPC地圖入口；q01領獎須實際走近guide點擊一次，保存前後raw，不把合成完成計數稱正常打怪通關。商店外的商人地圖入口如可由正常UI保留商店達成則測，無法達到則記未驗，不改DOM強顯示。 |
| G | 同一新角色正常NPC接任務→一小段目標／互動或傳點，證明輸入不鎖死；不補整個22任務／全世界通關。Frost勝利返回標籤若無法短route達到，保留靜態修補證據與本機未驗，不注入bossResult。 |
| H | 960×540主要route；640×360只補背包／商店／手帳的擁擠必要畫面，確認按鈕可見可點、文字可讀，不做更小尺寸矩陣。子目錄跨來源iframe資源及console錯誤。可用本機host正常按鈕測iframe全螢幕進出／Esc／進度保留；只能視為本機host能力，不能當正式平台PASS。 |

合成前置採既有 Plan19 fixture／generator 作唯讀參考，在新run建立新檔及provenance；既有原件不改。每一fixture只seed至其自己全新空origin（canonical key `brightwood-first-oath:save:v1` 必須先為null），不得覆蓋已建角色的canonical存檔；原始與after raw獨立留存。seed後全部用正常遊戲UI／鍵盤，不直接寫app state／dispatch內部命令／改DOM／CSS。較早成功的局部視審只作歷史，不外推beta57。

## 停止、回報與收束

遇產品疑點一次清楚重現，附before/after及最短步驟通知root分類，不自行修 source；其餘獨立項可繼續。環境問題與遊戲問題分開，未測不作FAIL。每完成一組即報進度，不持續貼長log或大JSON。完整圖片留檔，AI審圖只載必要1–2張、長邊≤1280、JPEG60–75。

最後放開輸入、正常暫停、保存after raw、只close本run CLI session、只Ctrl+C本run server session。owner無法確認則不操作其他PID，按可觀測範圍記cleanup；保留profile/raw/log/圖片。報告逐項結果及本機正式版阻斷問題，雲端／正式平台按使用者要求未測。root 審結果後再判斷正式版條件，不自動升版／發布。

## 實際派工限制

root 兩次以全新 gpt-6.1-terra／max／fork none 建立 browser 子代理，均遭工具 agent thread limit reached 拒絕。中間僅中止本對話已完成但顯示 pending_init 的三個舊候選／UI 子代理；未釋出可建新執行緒名額。Terra 尚未建立、browser／server／fixture seed 均未啟動，未產生 PASS。已詢問使用者是否另開明確的 Terra 本機驗收任務；待回答前不擅自建立其他對話或改用 Luna 假稱 Terra。

## 使用者暫停

使用者對另開 Terra 本機任務的問題回答「先停在這裡」。已依此停止，不建立新任務、不再嘗試派工、不啟動 browser／server／seed、不執行驗收。先前矩陣僅為已保存的派工方案，沒有任何新測試結果。beta57 prerelease、來源、舊候選及資料保持原狀；等待使用者明確恢復指令。
