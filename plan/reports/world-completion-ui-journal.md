# W06・四區手帳、世界回顧與存檔升級 UI

日期：2026-10-27。狀態：**UI_SOURCE_COMPLETE／FOCUSED_CHECKS_PASS**；尚未建置或視覺驗收。

## 規格與適用要求

已閱讀 repo `AGENTS.md`、Plan16、`world-completion-design.md`、`world-completion-navigation.md`、`world-completion-save-design.md`、`world-completion-live-handoff.md`，以及線上 game-agent-template 和它列出的 game-development、command-contracts、game.schema、game-release、starter SDK 1.1.0、sdk-versioning、save-compatibility 文件。

本包保留固定遊戲 ID、Lv30、desktop、既有存檔資料及相對資源路徑。格式升級須由玩家明確確認；本機備份與雲端升級分開描述，預覽明示模擬且不保存。只完成本機來源與 focused checks，沒有執行發布。

## 已完成

- 新增 `src/ui/world-progress-model.ts`：以 q08／q11／q14／q19 的 `claimed` 推導四區章節及 q19 世界結局；q20／q21／q22 分組為支線，不把探索率或支線領取狀態設為結局門檻。
- `src/ui/index.ts`：手帳以木葉、霜雪、沙海、遺跡四組主線及獨立支線組呈現任務狀態、目前目的地／回報 NPC 和下一區入口。q19 領取後，手帳可反覆查看世界完成回顧、自由探索提示及尚未領取支線路線；木葉鎮向岩嶺教官對話時也會看到完成回饋，不彈強制結局視窗。
- 航標對話只在 q21 進行中提供「調查航標」，送出精確的 `inspect`／`frost-route-marker` 命令；手帳的該目標文案使用「調查」。滿級任務獎勵卡保留原始 EXP 數字並註明 EXP 不再累積。
- 舊格式確認畫面依來源分別呈現本機「備份 formatN 並升級」、雲端明確升級及 preview 模擬；畫面只提供確認升級或「暫不升級，暫時遊玩（不保存）」，不提供 Continue／NewRole 繞過確認。確認 command 僅在仍有 `saveUpgrade` 時送出，錯誤訊息可留在確認畫面供重試。
- `tests/world-progress.test.ts` 覆蓋章節推導、q19 結局與未完成支線、任務分組、升級文案及確認／航標命令。`tests/world-map.test.ts` 另確認地圖數為 7／3／4／4，合計 18。

## 檢查

- bundled Node `v24.22.1`：`tests/world-progress.test.ts`、`tests/world-map.test.ts`，2 個檔案、14 個案例通過。
- `tsc --noEmit --pretty false`：通過。
- `git diff --check`：相關 UI／focused test 檔通過。
- 未執行完整測試套件、content check、build、browser、pack、ZIP 驗證或發布；最終 UI 視檢留給整合候選集中處理。

本包沒有修改存檔契約、app/persistence/content、版本、素材或 `dist`。所有既有 dirty 變更保留。
