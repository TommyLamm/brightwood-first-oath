# 可直接派工的17個工作包

每位子代理必讀：根AGENTS、[01](../01-game-design.md)、[07](../07-shared-contracts.md)、自己的工作包。內容包另讀[08](../08-content-spec.md)，素材包另讀[10](../10-asset-spec.md)。規格按根AGENTS完整讀網路，不只依賴其他代理摘要。

以下所有權皆相對專案根；不得跨界改檔。共同contracts、package設定、app／主入口、聚合與狀態板只有主Agent擁有。每包可寫自己的plan/reports/Txx.md。

| 包／入口 | 寫入所有權 | 完成依賴 |
| --- | --- | --- |
| [T00](T00-foundation.md) 骨架契約 | 根設定、src/contracts/**、src/main.ts最小入口、tools/check-content.ts框架 | 無；主Agent |
| [T01](T01-rules-content.md) 規則資料 | src/content/rules/**、tests/rules.test.ts | G0 |
| [T02](T02-movement.md) 移動 | src/domain/movement/**、tests/movement.test.ts、src/content/dev/movement-lab.ts | G0 |
| [T03](T03-combat.md) 戰鬥 | src/domain/combat/**、tests/combat.test.ts | G0 |
| [T04](T04-progression-inventory.md) 成長經濟 | src/domain/progression/**、tests/progression.test.ts | G0；正式資料T01 |
| [T05](T05-world-quests.md) 地圖任務 | src/content/world/**、src/domain/quests/**、tests/quests.test.ts | G0；跨表驗證T01 |
| [T06](T06-actors-boss.md) AI首領 | src/domain/actors/**、tests/actors.test.ts | G0＋T02公開介面；正式資料T01 |
| [T07](T07-renderer.md) 世界畫面 | src/render/** | G0；正式完成T05/T10–T12 |
| [T08](T08-ui.md) 介面 | src/ui/** | G0；真實內容T01/T05 |
| [T09](T09-persistence.md) 存檔 | src/persistence/**、tests/persistence.test.ts | G0；正式驗證T01/T05 |
| [T10](T10-actor-assets.md) 角色圖 | public/assets/actors/**、art-source/actors/** | 10文件；manifest接合G0 |
| [T11](T11-environment-assets.md) 環境圖 | public/assets/environment/**、art-source/environment/** | 08/10文件；manifest接合G0 |
| [T12](T12-interface-assets.md) 圖示特效 | public/assets/interface/**、art-source/interface/** | 08/10文件；manifest接合G0 |
| [T13](T13-audio.md) 聲音 | src/audio/**、public/assets/audio/**、tools/audio/** | G0＋10文件 |
| [T14](T14-app-integration.md) 組裝 | src/app/**、src/main.ts正式接線、tests/integration/** | a=G0；c=T01–T13＋T15-a |
| [T15](T15-playroom-package.md) 平台包裝 | src/platform/**、public/vendor/**、public/game.json、public/cover.png、.playroom/**、tools/playroom/**、.github/workflows/release.yml | G0；候選T14 |
| [T16](T16-acceptance-handoff.md) 驗收 | plan/reports/T16.md、交付說明；修程式需主Agent調度 | T14-c＋T15 |

## 直接使用的子代理提示模板

> 你負責工作包Txx，完整閱讀plan/tasks/Txx對應文件與指定共用規格後實作。你不是唯一在此程式庫工作的代理；不得還原其他人的修改，須配合既有變更。只可修改本包所有權路徑與plan/reports/Txx.md，不改package／lock／contracts／main／app／其他包。先核對實際contracts；發現接口缺口向主Agent提出具體signature及原因，不用any或重複型別繞過。
>
> 目前依賴狀態：由主Agent填入真實狀態。按照本包Txx-01起逐項實作，完成實際可用函式／資產，不只寫stub或prompt。只做本包最少必要檢查，不開共用瀏覽器、不跑全套build、不新增依賴；需依賴由主Agent處理。完成後報實際檔案、公開介面、接線例子、檢查結果、未完成與阻塞；把同樣資料寫到自己的report。未驗證不得報通過。不要擴充首版外功能。

主Agent必須替換Txx、具體路徑及依賴狀態，不直接把有空白變數的模板丟給子代理。分派後用訊息／子代理完成回報協調，不為子任務建立使用者側新聊天。全部使用同一份正式契約。

## 報告格式

包與子步驟狀態；實際修改檔案；公開匯出；消費者如何呼叫（5–15行接線範例即可）；實際檢查；未驗證／阻塞；需要主Agent整合的入口。主Agent確認後更新全局狀態，子代理不修改其他包的report。
