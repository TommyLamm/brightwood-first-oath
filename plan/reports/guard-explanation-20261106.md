# 守護防禦說明 — beta.81

2026-11-06 02:50 HKT，本機`1.0.0-beta.81`，`dist/`已建置，未發布。

能力面板原本只列基礎防禦，快捷列雖有守護時間，沒有清楚說明加成後數值。現在標明基礎防禦，守護期間另列加成、目前戰鬥總防禦與剩餘秒數；快捷列tooltip也說明加成。

`deriveActiveGuard`集中原本rank×defensePerRank與到期邊界，實際CombatActor及UI共用。UiSnapshot.stats仍是原永久能力，裝備／AP預覽基準不變，守護規則／持續時間／MP消耗未改。面板signature只看加成有無／數值，倒數單獨更新並aria-live=off，不每秒重建整張面板；到期會移除說明。不新增存檔欄位。

開工前02:46 HKT重新經網路取得Playroom範本及七份規格，8/8與已完整讀全文一致。固定ID、相對資源、SDK及可讀1–5／寫5保留。

## 最小驗證

- Node24.22.1：新`guard-status.test.ts`3/3、既有app-gameplay「buff pose」精選1例通過（25例未執行），typecheck及build通過。
- 覆蓋實際rank2施放後加成6／30秒、基礎stats不覆蓋、到期精確邊界、未學／無角色、唯讀派生資料不改gameplay／save；既有姿勢案例確認施放路徑保留。
- 未新增browser、截圖、content（資料未改）、全回歸、ZIP或平台／帳號驗收；新增說明實畫未驗。
