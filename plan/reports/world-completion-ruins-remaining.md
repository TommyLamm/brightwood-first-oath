# W05 遺跡證據收尾

日期：2026-10-27（香港時間）。狀態：**分段證據已核對；只確認 q17 兩隻木偶擊殺待補；實際聽音未驗**。本次唯讀文件與既有證據，沒有啟動瀏覽器或修改遊戲、候選成品、存檔、素材、版本或封包。

## 規格與判定原則

已讀 repo `AGENTS.md`、Plan16 W05、Plan15 R1／§5–§6、W00 基線、W01 設計、Plan15 remaining review，以及 D browser 原報告、retry／branches／namespace 報告、B app/UI/render 報告。Playroom 範本已由網路工具於本輪完整讀取；root 本輪已重讀八份 main 規格。依 Plan16 W05-02，只補 synthetic checkpoint 確實跳過的正常操作；Plan15 允許合法 fixture 作分段起點，不要求從零或不間斷通關。Fixture 狀態不算 UI 操作證據，q19 手動回報與已證的滿袋／旅冠／勝利再戰不重做。

## q15–q19 操作矩陣

| 步驟 | 證據路徑 | 判定 | 最少補動作 |
| --- | --- | --- | --- |
| q15 接取與前往營站 | [01 sand start](../../artifacts/ruins-d/browser/retry-20261025/01-sand-start.jpg)、[05 Town](../../artifacts/ruins-d/browser/retry-20261025/05-town-position.jpg)、[06 q17 活躍畫面](../../artifacts/ruins-d/browser/retry-20261025/06-puppet-heavy.jpg)。起點 [main-q15-start fixture](../../artifacts/ruins-d/fixtures/main-q15-start.json) 沒有 q15；後續一般遊戲畫面顯示 q15 活躍並已推進到 q17。 | PASS（分段正常 UI 狀態；沒有 q15 hand-in raw 或專用交付截圖） | 不從零重走；現有分段報告已記錄 q15/q16 正常流程。 |
| q16 接取、3 擊殺、手動交付 | 上述一般 UI 路段最後顯示 q17 活躍；這表示 q16 前置已完成。[q17 重建檔](../../artifacts/ruins-d/browser/retry-20261025/q17-after-puppets-reconstructed.json) 內 q16 claimed 是合成狀態，不能單獨作 q16 操作證據。沒有找到 q16 專屬擊殺／交付 raw 或截圖。 | PASS（依原 q15 起點後的正常路段及 q17 可用狀態；逐步證據有限） | 無須重做；若後續要求 q16 逐步收據，從合法 q16 狀態只補該任務段，不要求重玩四區。 |
| q17 接取 | [06–08 q17 畫面](../../artifacts/ruins-d/browser/retry-20261025/06-puppet-heavy.jpg) 顯示普通遊戲中 q17 活躍、木偶 0/2；其後才使用重建 checkpoint。 | PASS（活躍狀態有前置 UI 截圖；沒有獨立接取按鈕截圖） | 無。 |
| q17 擊殺 2 隻弦弦木偶 | [08 west stele](../../artifacts/ruins-d/browser/retry-20261025/08-west-stele.jpg) 仍為 0/2；[重建腳本](../../artifacts/ruins-d/browser/retry-20261025/make-q17-checkpoint.mjs) 明確把 `ruins-string-puppet` 設為 2，輸出的 [重建存檔](../../artifacts/ruins-d/browser/retry-20261025/q17-after-puppets-reconstructed.json) 因此不是擊殺證據。 | **待補**（唯一確認由 checkpoint 跳過的主線操作） | 由合法 q17 active、木偶 0/2 的隔離起點，以一般戰鬥擊殺兩隻並留存前後任務計數；可沿用已完成的兩碑狀態，不重做石碑、q18/q19 或其他分支。 |
| q17 西／東碑 inspect | [08](../../artifacts/ruins-d/browser/retry-20261025/08-west-stele.jpg) 顯示重建前兩碑 0/1；[30 east interaction](../../artifacts/ruins-d/browser/retry-20261025/30-q17-east-stele-interaction.png) 顯示西碑 1/1、東碑 0/1；[q18-active raw](../../artifacts/ruins-d/browser/retry-20261025/q18-active-canonical-save.json) 記錄兩碑均 1/1。重建檔將兩碑清零，故後續結果來自 UI 流程，不是 fixture 預置。 | PASS（畫面前後狀態及 browser raw 相符；無需重抓兩碑全程） | 無。 |
| q17 手動向行舟交付 | [34 NPC return location](../../artifacts/ruins-d/browser/retry-20261025/34-q17-npc-return-location.png) 顯示完成、待向行舟回報；隨後 [q18-active raw](../../artifacts/ruins-d/browser/retry-20261025/q18-active-canonical-save.json) 為 q17 claimed、q18 active。重建 checkpoint 是 q17 active，沒有預置 q17 claimed。 | PASS（前後 UI／raw 狀態；沒有單獨拍下領取按鈕） | 無。 |
| q18 接取與擊敗司鐘者 | [35 sanctum entry](../../artifacts/ruins-d/browser/retry-20261025/35-q18-sanctum-entry-paused.png) 顯示 q18 active、擊敗 0/1；[36–43 boss／return captures](../../artifacts/ruins-d/browser/retry-20261025/36-q18-boss-approach.png) 至 [43 camp return](../../artifacts/ruins-d/browser/retry-20261025/43-q18-camp-return.png)，以及 [q18 active raw](../../artifacts/ruins-d/browser/retry-20261025/q18-active-canonical-save.json) → [boss-ready raw](../../artifacts/ruins-d/browser/retry-20261025/q18-boss-ready-canonical-save.json)。q17 checkpoint 沒有 q18。 | PASS（q18 接取後的一般 UI 戰鬥；計數 0→1） | 無。 |
| q18 手動向芷衡交付 | 主線 [43](../../artifacts/ruins-d/browser/retry-20261025/43-q18-camp-return.png) 顯示待回報；後續 [q18-claimed raw](../../artifacts/ruins-d/browser/retry-20261025/q18-claimed-canonical-save.json) 與 [q19-active raw](../../artifacts/ruins-d/browser/retry-20261025/q19-active-canonical-save.json) 記錄 q18 claimed。另有獨立 ready 分支的 [滿袋拒領](../../artifacts/ruins-d/browser/branches-retry-20261025/q18-full-bag-claim-blocked.png) 與[清理後成功交付](../../artifacts/ruins-d/browser/branches-retry-20261025/q18-claim-success-q19-offered.png)，報告確認一般 UI 領取。 | PASS（一般 UI 交付在獨立 ready 分支有畫面；主線有交付後 raw） | 不重做滿袋／旅冠分支或 q18 交付。 |
| q19 手動回報 | [retry report](ruins-d-browser-retry.md) 記錄一般方向鍵走 Town、與教官對話並按「領取任務獎勵」；[47 q19 claimed](../../artifacts/ruins-d/browser/retry-20261025/47-q19-claimed-town-1280x720.png)、[q19 claimed raw](../../artifacts/ruins-d/browser/retry-20261025/q19-claimed-canonical-save.json) 記錄金幣 4,900→5,200、q19 claimed，其他角色資料保全。 | PASS | 不重做。 |

因此，合成 checkpoint 的精確影響是：本次重建把 q17 設成 active 並直接給了木偶 2/2；它沒有預置兩碑 inspect、q17 hand-in 或任何 q18 狀態。前一段普通 UI 截圖已見 q17 活躍，但木偶仍 0/2；只需補兩隻木偶擊殺。不要要求連續通關，也不把 q17 之後的普通操作誤判為 fixture 操作。

## W05 可聽音訊

現有 [Plan15 review](plan15-remaining-review-20261026.md)、[D retry](ruins-d-browser-retry.md) 與 branches 報告都明列沒有實際聆聽；D retry 未進入首領戰。B 的 `app-audio` focused tests 僅證明有效調律事件觸發，素材／解碼／AudioContext running 或播放 Promise 均不能證明人耳聽到。Plan16 W05-03 的探索音樂、首領／phase2 切換、誓鐘復原短音仍是**未驗**。

本輪可用 UI 工具沒有被動系統輸出／loopback 擷取與回放能力；因此無法在不取麥克風、不外傳音訊、不讀取 runtime 私有 state 的條件下提供真正遊戲輸出 clip。最低可驗條件是有本機系統輸出 loopback 擷取與本機回放能力，在實際遊戲依序觸發探索、首領及 phase2 音樂切換、勝利復原短音，將原始輸出 clip 留在工作區並實際聆聽；目前不應以已有截圖或測試標記 PASS。

## 本次範圍

沒有改動 `src/`、metadata、assets、dist、存檔或 ZIP；沒有啟動 browser、測試、build、pack、commit，也沒有建立音訊錄製環境。只留下本證據矩陣。候選版本／正式平台項目不在本矩陣範圍。
