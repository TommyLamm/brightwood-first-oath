# Plan54 多職業補完與 beta.89 交接

2026-11-07，Asia/Hong_Kong。**SOURCE_READY／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL**。依使用者「實作這些內容」及確認採用的Lv20二轉方案完成本機實作。保留開始時工作區既有變更；沒有commit、push、tag、Release、平台發布、代理派工或排程。

## 實作與入口

- 標題畫面的「管理角色與共享倉庫」可改名、輸入完整名稱刪除、恢復一名已刪角色及由四欄逐一擴充至六欄。已有恢復備份時不能覆蓋；永久清除另需輸入該角色名稱。
- 同一profile共用24格倉庫，在指定角色的管理區存入／取回1個或整疊。只轉移背包物品，裝備中的物品先卸下；任務專用物品不收。背包／倉庫容量、疊加、過時選取及保存失敗均沿原子交易處理，不部分移動。跨角色轉移屬同profile，沒有跨帳號交易。
- 正式職業Lv20可回木葉鎮本職業導師身旁，從技能頁確認一次二轉。保留原技能、AP及SP；分支技自動解鎖rank1，可替換技能3並隨時切回。沒有新增地區或提高等級上限。
- 四職業皆加入LUK，初值0；每點提高0.2%暴擊率，劍士上限40%、其餘30%。能力頁、預覽與實際推導共用公式，不重新分配舊角色AP。能力頁改為四卡、縮窄時兩卡／一卡，攻擊顯示最多兩位小數。
- 盜賊新增布衣／輕革／鐵甲各四幀的短刃攻擊圖集與主角肖像；待機／移動等沿用既有同一主角姿勢。

| 二轉 | 分支技與行為 |
| --- | --- |
| 劍衛 | 守護戰吼：MP20／CD12秒，回復8%最大HP，6秒防禦+20；與原守護取較高值 |
| 狂劍 | 狂風三斬：MP22／CD4.5秒，三個各自有命中預算的近戰窗口，受擊中斷後續段落 |
| 神射 | 貫星狙擊：MP18／CD4秒，550ms前搖、440射程，穿透最多三目標 |
| 遊俠 | 游擊連射：MP18／CD5秒，安全後撤並連射三箭 |
| 元素 | 極寒新星：MP24／CD6秒，自身170範圍、最多六目標，普通怪緩速、首領免疫控制 |
| 秘法 | 汲魔彈：MP14／CD5秒，穿透最多兩目標，每個實際怪物命中回6MP |
| 影刃 | 淬毒突刺：MP16／CD4秒，命中後四次毒傷；近戰從目標背後命中另提高25%傷害 |
| 飛鏢 | 迴旋三鏢：MP16／CD3.5秒，三枚實體投射物，射程280、碰牆消失 |

毒傷每跳為floor(攻擊×0.12＋LUK×0.05)，重施刷新、不疊加。dt0凍結；死亡、換圖及角色runtime重建清除。首領轉場期間跳過當次毒傷，轉場後不補發。新投射物保留既有牆碰撞、生命期及目標預算。

主要接點為contracts、rules/specializations與advanced-skills、domain/progression與combat、app/gameplay、persistence/profile-actions與validate、ui/roster-manager與specialization-panel、render及actors anchors。

## 保存與容量

**format9讀1–9／寫9。beta.88及更舊版本不能讀9；回退需可讀9的相容修正版。** 新版profile明確包含warehouse、deletedCharacter及角色LUK；二轉需與職業相符且Lv20以上，欄位最多六個。舊1–8先按各自原始契約驗證，拒絕在舊版本偷放新欄位，再補LUK0與空倉庫／備份，不重新分配AP、SP、技能或裝備。

沿既有明確備份、讀回、使用者確認再升級的流程；本機可備份原始資料，雲端沒有虛構本機原檔備份。未知格式拒絕寫入。profile操作只在標題進行，先flush，使用既有revision／requestId／帳號世代及序列保存；失敗保留完全相同的pending快照與requestId，重試前阻擋後續物品操作。

六名高等角色、每人32格背包／全部任務、64條長bindings、另一名刪除備份及24格倉庫的明確合成樣本為**52,552bytes**，小於64KiB；沒有提高上限或截短資料。見[容量](../../output/class-completion-20261107/capacity.json)與[產生器](../../tools/qa/class-completion-fixture.ts)。此數字是指定樣本，容量仍逐次驗證。

## 規範與素材來源

本輪修改前透過網路重新完整閱讀main的[範本](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)、[開發規範](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)、[操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)、[Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)、[workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)、[SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)、[版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)及[存檔規範](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)，包括開發規範尾段。固定gameId、desktop、相對資源、SDK1.1.0／protocol1及tools1.2.0均保留。

使用內建imagegen生成短刃三裝束原稿，以既有主角外貌作參考。提示詞、透明原稿、技術裁切／縮放與四張PNG的SHA256見[素材交接](../../art-source/rogue-completion-20261107/README.md)及[提示詞](../../art-source/rogue-completion-20261107/dagger-atlas.prompt.txt)。三動作圖集接入獨立dagger錨點；肖像從原稿裁出。沒有用程式繪圖替代生成。八個二轉圖示使用既有原創圖示alias，飛鏢／毒傷標記／新星環為原生graphics，音效按職業及出射時序沿用既有素材；未宣稱新製八套圖示或音效。

## 實際檢查

使用本機bundled Node24.22.1，未重跑全回歸；分批共71個不同的直接相關案例通過，重跑的同一案例不重複加總。

| 檢查 | 實際結果 |
| --- | --- |
| class-completion.test | 28案例分批通過：八個歷史格式、無效欄位與AP、管理／恢復、六欄上限、物品轉移／滿包回滾、八分支保留資料、LUK／背擊、有限毒傷、守護、汲魔最終穿透目標及三發／三段；最後只重跑毒傷與新增首領轉場2案例，2過／26跳過 |
| integration/profile-management | 2過：真GameApp重複操作序列、本機重載／刪除活動角色／恢復，以及mock雲端失敗的原快照／requestId重試與阻擋後續操作 |
| 既有直接接點 | combat12、mage-skills8、archer-skills6、rogue12、SDK port3，共41案例分批通過 |
| 型別／內容／build | 最終typecheck與119模組build通過；world／rules內容檢查通過後無規則內容修改。UI顯示修改後重build，沒有為純文字／樣式加測試 |
| 固定工具 | tools1.2.0最終pack及完整ZIP validate均exit0 |

測試初期的Lv20 helper跳過正常Lv10轉職，造成SP期望錯誤；修正為10→轉職→20。汲魔案例改用實際spawn位置及足夠飛行時間。舊盜賊保存fixtures按歷史契約移除新欄位，現行預期更新為9；共用combat精確Hit比較促使新skillId metadata只在進階技能輸出，保留舊Hit形狀。只重跑各批失敗項目，不反覆執行已過案例。

## 有限瀏覽器證據

[本輪操作記錄](../../output/playwright/class-completion-beta89-20261107-01/run-record.md)、[runtime摘要](../../output/playwright/class-completion-beta89-20261107-01/runtime-summary.json)。使用Playwright技能與已安裝CLI／Chrome，**headless:true**，獨立class89 session／profile及43920／43921。沿AGENTS已驗證的一般使用者權限路徑，沒有重演受限啟動錯誤、開可見視窗或安裝依賴。

全部使用新loopback origin上明確合成的Lv20盜賊與Lv1接收角色，先確認該測試origin無存檔才安裝fixture，沒有讀取或覆蓋使用者存檔。**不是正常Lv1成長或完整通關證據。**

- 盜賊存入紅藥1瓶：10→9；接收者取回：10→11，倉庫回空。改名為「接收者更名」、以完整名稱刪除後恢復，同一角色ID與11瓶紅藥保留。
- 四欄擴至五欄及六欄，六欄按鈕停用。實際捲動到角色管理區，卡片476px可視／893px內容、scrollTop392／overflow:auto；原本支援捲動，沒有誤改標題卡片。
- 從鎮中心以真實方向鍵走長梯到夜嵐身旁，技能頁雙次確認影刃。原SP6及五個rank1保留；淬毒突刺MP105→89。LUK+1後AP95→94。
- 最終build於跨來源sandbox iframe重載：格式9、六欄、影刃、LUK1、AP94、SP6與兩人背包保留。技能3切回煙幕並等待實際快捷列更新，再裝回淬毒突刺；施放MP89→73，Esc出現「冒險已暫停」。
- [最終能力頁](../../output/class-completion-20261107/final-luk-iframe.png)可見四項能力、影刃與肖像；攻擊顯示31.46，暴擊7.0%。[捲動管理區](../../output/class-completion-20261107/roster-scroll.png)、[短刃出招](../../output/class-completion-20261107/venom-cast.png)及[素材合成縮圖](../../output/class-completion-20261107/rogue-art-review.jpg)保留。AI審圖只載入必要1280px以下JPEG72縮圖。
- 兩份本輪console logs共Errors0／Warnings0。未取得完整HTTP請求摘要，沒有宣稱所有請求均已核對。一個probe等待了錯誤的暫停標題「暫停中」而未返回摘要；後續snapshot及正確標題「冒險已暫停」確認實際已暫停，沒有為probe錯字修改遊戲。

瀏覽器正常close，本輪server以Ctrl+C停止。01:10:54+08的[清理觀察](../../output/playwright/class-completion-beta89-20261107-01/cleanup-observation.json)顯示兩port無listener、專屬profile無Chrome程序。

## 最終候選與未驗範圍

[game.zip](../../artifacts/class-completion-beta89/game.zip)：brightwood-first-oath／**1.0.0-beta.89**，157,006,172bytes／461entries；主bundle `assets/index-DbJzL9GF.js`。SHA256：`0aa1eafdd9d4cb934ad33d0b1fa25df10d127c225808ca18f49cf1044871a395`。詳[candidate.json](../../artifacts/class-completion-beta89/candidate.json)及[SHA256SUMS](../../artifacts/class-completion-beta89/SHA256SUMS.txt)。ZIP有限路徑檢查沒有art-source／output／tools／tests／.git及.env／pem／key副檔名；此項不是完整秘密掃描宣稱。

未做全回歸、四職業完整主線／四首領全場、八分支完整實戰平衡、三裝束逐幀全部裝備視審、主觀聽音、效能矩陣、全螢幕／沉浸模式、正式平台預覽／SDK握手、正式帳號雲端／跨設備／衝突／格式協商；mock重試測試不替代正式雲端驗收。未發布。

若後續發布，先按當時線上規範完成正式平台與雲端必要驗收，確認format9相容／回退邊界，再依明確發布授權操作。目前本輪實作與候選已完成並停止。
