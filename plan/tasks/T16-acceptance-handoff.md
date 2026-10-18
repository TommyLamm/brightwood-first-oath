# T16：主 Agent 的候選驗收與交付

目的：集中最少必要整合驗證，不讓所有子代理各跑一遍。主Agent擁有本包及plan/reports/T16.md；修程式按所有權回派，或主Agent先收回該包再修，不與仍在寫的代理搶檔。依賴T14-c及T15。

## 步驟

- [ ] T16-01 讀各report與status，逐包核對實際檔案／匯出／asset，不以代理口頭DONE取代可用內容。
- [x] T16-02 聚合typecheck/build/check:content各跑一次，只有相關變更再跑；已有核心局部測試通過不再全套重跑。失敗先定位所屬包，無關環境問題報限制不擴查。
- [ ] T16-03 核對七maps／六普通+boss／五NPC／八quests／24items／五可學技能／四包manifest；所有傳點、目標、掉落及asset引用可達。
- [ ] T16-04 真實桌面瀏覽器完成從新角色至q08結算的代表路線，含轉職／學技／配點／買賣／換裝／收集／首領；只一輪記時間及阻塞。debug跳級不算主線時長證據。
- [ ] T16-05 在同輪加入一次死亡復活、首領重試與重新開啟恢復；確認沒有重複獎勵、清檔或幽靈攻擊。
- [ ] T16-06 用不同origin iframe及版本子目錄，設定05的sandbox/allow，確認資源／console／音訊手勢／輸入焦點；不能只file://開HTML當完成。
- [ ] T16-07 一般／原生全螢幕／拒絕時沉浸模式、960×540／640×360、Esc關遊戲面板、平台退出及進度保留。只宣告desktop，不做mobile/iOS／手把矩陣。
- [ ] T16-08 有正式平台連線才做cloud：同帳號雙瀏覽器恢復、另一帳號隔離、衝突、載入失敗、回應遺失同ID重試、登出／session失效、preview不正式保存。缺環境逐項UNVERIFIED，不用fake或SDK連線當保存證明。
- [ ] T16-09 代表場景20怪／30drop／一組技能看實際FPS與明顯卡頓，記測試環境；只針對真瓶頸調整，不開新效能大工程。
- [x] T16-10 確認T15官方完整ZIP驗證及機密檢查紀錄；若候選程式再變更，重新build/pack/validate，不能拿舊ZIP的通過結果套新檔案。
- [x] T16-11 整理交付說明：名稱/ID/version、啟動方式、dist/ZIP、操作、已完成、生成素材、差異、存檔相容、實際檢查及未驗證；更新status真實狀態。
- [x] T16-12 有明確發布要求且來源齊才按05後續Release/人工匯入確認，否則明示尚未發布，不把候選文件寫成已上架。

## 2026-10-18 本輪實際進度

本包狀態 PARTIAL。T16-02、T16-10、T16-11、T16-12 已依可重現證據完成；其餘項目未完成者保持未勾選。聚合檢查通過，T15 archive pack/validate 與有限機密掃描通過；main runtime candidate 固定 `56ec0fe`，ZIP 對應該 runtime，後續僅文件提交。

單一 hidden IAB／Vite server 的真實路線以 `旅人` 正常建立並接取 q01「第一次出發」，擊敗苔殼蝸牛到 2/3（EXP 20→40，任務面板確認 2/3）；正常頁面 reload 後選「繼續冒險」，角色／地圖／道具恢復，再玩到 2/3。已看到角色、裝備武器、場景、敵人及正式 interface icons；按鍵移動、普攻、HP 藥水及 Esc 關閉有 UI 焦點的任務面板實際操作成功。q01 第三擊、回報森芽、獎勵及 q02–q08 沒走完，路線時間未測。

final `dist/` 在同一 server 以跨 origin `http://localhost:5173/dist/` iframe 載入，父頁 origin 為 `127.0.0.1`；使用 `sandbox="allow-scripts allow-same-origin allow-pointer-lock"` 與 `allow="fullscreen; autoplay; gamepad"`。production title 首屏可載，960×540／640×360 resize 可見；暫時遊玩內 ArrowRight、J、Esc 與普攻可操作。瀏覽器拒絕父頁讀取 child document，證明跨 origin。CUA 未提供 browser-console log capability；Vite server log只有一則 dist dynamic-import analysis warning，沒有 Vite錯誤。音訊播放是否可聽未驗。

T16-04/05/07/08/09 未完成；T16-06 只完成跨 origin、子目錄、sandbox/allow、resize 與基本 input 部分，console、可聽音訊及平台矩陣仍未驗。沒有 Playroom 真帳號/cloud、fullscreen、FPS、完整主線或 45–60 分鐘證據。未建立 tag、GitHub Release 或平台發布。

## 收斂規則

發現高風險核心錯誤時回派相關包，修完只重查直接受影響場景；純文字／樣式不新增測試。使用者表示自行驗收時停止可選檢查，但未做的發布必要驗收仍列未驗證。不要為了看起來完整而虛構全綠清單。

完成報告簡短可用，讓使用者能點開入口並知道還有什麼未驗證；不把所有工具輸出堆進回覆。缺完整主線屬實作未完成，缺外部平台驗收屬整合未驗證，兩者分開。
