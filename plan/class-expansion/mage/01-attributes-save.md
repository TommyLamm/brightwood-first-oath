# 53-11-01・INT、職業與存檔

2026-11-06，Asia/Hong_Kong。**DONE**。上層：[法師實作](../11-mage-followup.md)。

## 實作

- mage路線初始STR4／DEX4／INT12，三職業初始總量20；INT可透過同一AP交易與預覽分配。
- 法師HP56＋12×(Lv−1)、MP72＋6×(Lv−1)；攻擊2INT＋DEX−1＋武器、防禦floor(STR/4)、暴擊5%。兩被動只在正式法師且達需求等級時生效；裝備共用既有防具。
- 格式7每角色明確包含INT；讀1–5的單角色、6的四角色後補INT4，不改原STR／DEX／AP／角色ID。格式6拒絕混入INT／mage；7拒絕缺INT、超額能力及不支援資料。
- 原件保全、備份精確讀回、確認升級、序列寫入、衝突／失效停寫沿用原管線。INT變更算重要檢查點。四個槽位及共享設定不變。

## 接點

src/contracts/types.ts、commands.ts、ports.ts；src/content/rules/jobs.ts；src/domain/progression/index.ts；src/persistence/validate.ts、index.ts；src/ui/ap-allocation-preview.ts。

## 實際驗證

- mage-foundation 7案例通過：初始總量／INT交易、被動／SP／專職限制、1–5與6遷移、7嚴格驗證、format6原字節備份／7寫入、路線快取隔離。
- persistence24、namespace26、character-profile8案例通過；舊遺跡與App保存／切角相關案例的最新結果見[最終交接](../../reports/mage-beta87-20261106.md)。沒有重跑全回歸。
- 既有四角Lv30高進度容量樣本新增INT後40,085bytes；64KiB上限維持，不截短角色。
- 正常UI法師分配45AP至INT，保存值INT57／AP0；正常劍士INT4，重載／切角後互相隔離。

## 限制

beta.85／beta.86均不能讀格式7；正式帳號雲端與跨帳號驗收未做。候選只在本機，不操作玩家原件、不發布。
