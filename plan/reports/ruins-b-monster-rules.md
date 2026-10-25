# 遠古遺跡包 B：怪物規則／AI 交接

日期：2026-10-25（香港時間）

## 範圍與來源

完成 `plan/13-ruins-echo-exploration.md` 第 6、9、11 節指派的規則／actors 子範圍。開工前讀取本地 `AGENTS.md`、上述計畫全文，以及線上 Playroom 遊戲開發模板。模板列出的七份 main 規格由主代理於 2026-10-25 完整閱讀：`game-development.md`、`command-contracts.md`、`game.schema.json`、`game-release.yml`、`playroom-sdk.js`、`sdk-versioning.md`、`save-compatibility.md`。

本次僅修改怪物、技能、物品、rules validator、actors 選招與新增專注測試；保留工作區原有 A 改動。未改 world、manifest、renderer、app、存檔、版本或發布內容。

## 已完成

- 新增 `ruins-string-puppet`（斷弦木偶）：Lv30、HP1280、ATK54、DEF23、速度56、EXP0、95金幣、9秒重生；技能 `ruins-puppet-slap`，前方160×100、倍率1.1、1000/100/900ms節拍、2200ms起手間隔；必掉1個可出售50金幣的 `broken-copper-thread`。
- 新增 `ruins-bell-prowler`（巡鈴石獸）：Lv30、HP1360、ATK56、DEF24、速度48、EXP0、100金幣、9秒重生；技能 `ruins-prowler-sweep`，前方260×30、倍率1、1100/100/900ms節拍、2400ms起手間隔；必掉1個可出售55金幣的 `muted-bell-fragment`。
- 計畫未指定邏輯碰撞尺寸；本次採木偶44×64、石獸56×40，供既有 movement/combat body 使用。
- 兩招沿用既有原地 windup／recovery、攻擊原點與方向快照、矩形預警及 CombatState 每攻擊 ID 的目標去重。死亡會清除待發快照；新地圖沒有舊 spawn 時，actors 不再輸出該怪物或預警。
- Rules validator 固定核准清單為33件物品、18個技能、16隻怪物，並確認敵人技能共12個；只增加計畫核准的新 ID。
- 新增 `tests/ruins-gallery-combat.test.ts`，使用遊戲時間推進，沒有 `sleep`。覆蓋規則／保證掉落、鎖向矩形預警、單次命中、冷卻起手界線、低掃跳躍避開、死亡／換圖取消及 patrol roam 邊界。

邊界核對：石獸在 east roamRight 2070 面向右方時，預警終點為 x2330。木偶受 spawn roamLeft 720 限制；AI 能在範圍內鎖向西側玩家時，怪物中心最早可到 x721，預警起點為 x561（約 x560）。

## 驗證

執行：

```text
npx vitest run tests/ruins-gallery-combat.test.ts --exclude '**/.worktrees/**'
```

結果：1 個測試檔、6 個測試通過。未執行 typecheck、content check、build 或全套測試；留給整合 owner 統一執行。未做瀏覽器／平台發布驗收。

## 交接

Rules IDs 已可供 world owner 使用：`ruins-string-puppet`、`ruins-bell-prowler`、`ruins-puppet-slap`、`ruins-prowler-sweep`、`broken-copper-thread`、`muted-bell-fragment`。World placement 應沿用計畫第3節的 roam 範圍；素材／renderer owner 仍需加入 actor metadata 與四格 attack authored timing（木偶 `[500,500,100,900]`，石獸 `[550,550,100,900]`），動畫接線不屬於本次檔案所有權。最終 content/typecheck/build 由整合 owner 執行一次。
