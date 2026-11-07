# beta.89 全量自動測試

2026-11-07 08:57–09:00，Asia/Hong_Kong。依使用者「跑一次完整測試」執行全部既有 Vitest 測試，以及型別、內容、正式建置與完整 ZIP 驗證。**結果：全量測試失敗，不能標示全綠。** 沒有修改遊戲程式、測試資料或斷言；沒有重跑通過案例、commit、push 或發布。

受測版本 `brightwood-first-oath / 1.0.0-beta.89`，來源 HEAD `cc09a2e36033a844d37196c335fa2e6ea01da356`，測試前工作區乾淨。使用既有 bundled Node **24.22.1**，直接呼叫 package.json scripts 對應的本機入口，未安裝或升級依賴。

## 結果與證據

| 檢查 | 實際結果 |
| --- | --- |
| 全量 Vitest | **91 檔：75 過／16 失敗；616 案例：536 過／80 失敗／0 跳過**，exit 1；Vitest 報告執行時間 9.23 秒 |
| `tsc --noEmit` | exit 0 |
| `tsx tools/check-content.ts` | exit 0，rules 與 world 跨表檢查通過 |
| `vite build` | exit 0，119 模組；主 bundle `index-DbJzL9GF.js` |
| 固定 tools 1.2.0 pack | exit 0，使用專屬輸出路徑，保留原候選 |
| 固定 tools 1.2.0 完整 ZIP validate | exit 0 |

新二轉核心 `class-completion` 28 案例、`integration/profile-management` 2 案例，以及 archer-skills 6、mage-skills 8、rogue 12 均於此次全量執行通過；此結果不代替其他失敗的保存／遷移案例。

完整原始 [Vitest 日誌](../../output/qa/full-test-beta89-20261107-01/vitest.log)、[JSON](../../output/qa/full-test-beta89-20261107-01/vitest-results.json)、[80 項失敗索引](../../output/qa/full-test-beta89-20261107-01/failures.md)、[摘要](../../output/qa/full-test-beta89-20261107-01/summary.json)，以及 typecheck／content／build／pack／validate.log 保存在同一專屬目錄。日誌最初產生於 `output/full-test-beta89-20261107-01/`，完成後移至已忽略的 `output/qa/`，沒有改寫原始日誌內容。

獨立測試 [game.zip](../../artifacts/full-test-beta89-20261107-01/game.zip) 為 **157,006,172 bytes**；SHA-256 `0aa1eafdd9d4cb934ad33d0b1fa25df10d127c225808ca18f49cf1044871a395`，與既有 beta.89 候選相同。

## 失敗分布

| 測試檔（相對 tests/） | 失敗數 |
| --- | ---: |
| character-profile.test.ts | 4 |
| mage-foundation.test.ts | 4 |
| persistence-namespace.test.ts | 22 |
| persistence.test.ts | 12 |
| ruins-b-save.test.ts | 12 |
| ruins-c-save.test.ts | 8 |
| ruins-save.test.ts | 7 |
| integration/app-persistence.test.ts | 3 |
| integration/character-selection.test.ts | 1 |
| integration/sunwell-quests.test.ts | 1 |
| ruins-gallery-combat.test.ts | 1 |
| ruins-gallery-world.test.ts | 1 |
| rules.test.ts | 1 |
| integration/app-foundation.test.ts | 1 |
| world-progress.test.ts | 1 |
| integration/app-gameplay.test.ts | 1 |

## 初步判讀與下一步

這是讀取失敗輸出與程式後的分類，尚未透過修正／重跑證明所有根因。

- **74 項保存、遷移及角色管理案例：** 多處仍預期寫入 format8、把 format9 當不支援，或以現行產生器建立資料後標成舊格式。共用 `tests/fixtures/legacy-save.ts` 只移除 INT，仍留下現行 LUK 等欄位；現行歷史格式驗證明確拒絕這些新欄位。`mage-foundation` 的舊 profile 包含新增 warehouse／deletedCharacter；`character-profile` 把第五欄視為非法；`character-selection` 將現行 profile 標為 format8 後載入失敗，繼而讀取 null gameplay。應依每個歷史契約重建 fixture、保留原始 bytes／備份／重試斷言，再分批重跑失敗案例，不能據此認定所有失敗都只是測試問題。
- **4 項內容斷言：** 仍固定期望 34／40 個物品或 13 個平台，實際為 52 個物品與 22 個平台。需核對新增職業內容及應保留的舊 ID，再更新過時總數斷言。
- **1 項升級提示文字：** `world-progress.test.ts:80` 要求連續片語「備份原始 format4」，目前文字已在前句說明 format4、後句說明備份原始存檔。需按實際提示語意調整斷言或文案。
- **1 項休息回血：** `integration/app-gameplay.test.ts:574` 使用 `dtSeconds: 0`，仍預期 HP70→72；`src/app/gameplay.ts:518` 明確只在 dt>0 時執行恢復。需先確認凍結與時間推進契約，再使用有效前置驗證恢復，不能直接認定一般遊玩不回血。

建議下一個 task 為「修復全量回歸的歷史存檔 fixture 與過時斷言，釐清 dt=0 恢復契約」，優先處理保存相關 74 項。此次僅測試與診斷，沒有為取得綠燈而修改驗證器或刪除斷言。

## 規範與驗收邊界

本輪已透過網路完整讀取最新 main 的 [範本](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)、[開發規範](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)（含尾段）、[操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)、[Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)、[workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)、[SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)、[版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)與[存檔規範](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)。本次適用既有全量測試、型別／build 與固定工具 ZIP 檢查，以及如實區分未驗項目；不涉及發布。

此次完整範圍為**既有自動化測試與建置／封裝檢查**。沒有啟動瀏覽器或 QA server，沒有四職業全主線／四首領人工通關、八分支實戰平衡、音效／全螢幕、正式平台預覽或正式帳號雲端／跨設備／format9 協商驗收；這些維持未驗，mock 測試與 ZIP 通過不替代正式驗收。beta.89 尚未發布。
