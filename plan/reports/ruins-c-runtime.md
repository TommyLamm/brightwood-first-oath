# 遠古遺跡包 C：司鐘者 runtime／AI 交接

日期：2026-10-25（香港時間）

## 規格與範圍

開工前閱讀本地 `AGENTS.md`、`plan/14-ruins-bell-sanctum.md` 全文，以及以下 main 線上規格：遊戲代理模板、`game-development.md`、`command-contracts.md`、`game.schema.json`、`game-release.yml`、`playroom-sdk.js`、`sdk-versioning.md`、`save-compatibility.md`。模板要求相對資源路徑、保存格式需真實相容、載入／遷移失敗不得當作空存檔覆寫；本批只交 runtime 型別與首領行為，不做發布。

`.codegraph/` 不存在，依專案指示直接定位並閱讀實際來源檔。

## 已完成

- `src/contracts/types.ts` 加入 `MonsterMode: 'phase-transition'` 及 runtime-only `BellCycle`。契約為 `sequenceIndex: 0|1|2`（指下一招）、`nextAttackAtMs`、`transitionStartedAtMs`／`transitionEndsAtMs` nullable 時間戳、一次性的 `transitionUsed`。`MonsterState.bellCycle` 為 optional，僅司鐘者建立，不進 `SaveData`。`SaveEnvelope.formatVersion` 改為 4。
- `src/contracts/ports.ts` 將 `CloudSaveInput.formatVersion` 改為 4。型別與 ports 已於開工第一階段釋出給下游；後續不再修改這兩檔。持久化常數、讀取／遷移、備份流程及 manifest 未由本批修改。
- `src/domain/actors/index.ts` 為司鐘者接入獨立循環。phase 1 為重擊→橫掃、phase 2 為橫掃→重擊→橫掃；同招式使用其 `SkillDef.reach`，不被普通攻擊距離上限截短。攻擊起點與面向在 windup 鎖定；普通移動只在攻擊／轉場以外進行，沿既有 bounded chase 與地形邏輯限制於 roam 範圍，西側安全帶不會觸發追擊。
- 各招完成完整 windup／active／recovery 後才可進入下一招；phase 1 再等 600ms、phase 2 再等 300ms。首次出招及轉場結束後首招不加額外空檔。半血門檻取 `MonsterDef.maxHp / 2`；當前招式未完成時延後切階段，空檔時下個遊戲 tick 開始一次 1200ms 轉場。轉場期間可受傷、無出招／預警；結束才進 phase 2。
- 首領不受擊退。死亡與玩家已死亡時清除攻擊快照及待發轉場；新建實體重新以滿血 phase 1／循環索引 0 開始。`cloneMonster` 為 bellCycle 建立獨立副本。
- `tests/ruins-bell-boss.test.ts` 直接使用 world/rules production catalogs，覆蓋兩招配置、鎖向矩形預警、phase 1 間隔、phase 2 三招與循環邊界、1200ms 轉場、轉場受傷、單次命中、安全入口、追擊 roam 限制、死亡／玩家死亡取消及新實體重試。

world owner 已確認使用 `ruins-bell-keeper`、`ruins-bell-slam`、`ruins-bell-sweep`，且不再修改 `types.ts`／`ports.ts`。規則內容與地圖由 world owner 維護。

## 驗證

執行：

```text
npx vitest run tests/ruins-bell-boss.test.ts tests/actors.test.ts --exclude '**/.worktrees/**'
```

結果：2 個測試檔、18 個測試通過。未執行 typecheck、content check、build 或全套測試；由 integration owner 統一處理。未做瀏覽器、正式雲端或發布驗收。

## 下游交接與未完成

- App owner 需在 gameplay clone 深複製可選 `bellCycle`，確保玩家同 tick 死亡時清掉首領 combat attack／telegraph，並維持切圖、重試建立全新實體；新 `phase-transition` 模式目前會自然退回 idle 呈現，但動畫 owner 仍需接 `ruins-bell-keeper:attack-sweep` 並按 pendingSkillId 選 animation key／clock。
- `bossResult`、app/UI/renderer/audio event、persistence/save 格式遷移備份與 manifest 接線均不在本批 ownership。尤其格式 4 型別已改但 persistence 尚未實作讀 1／2／3／4、寫 4 及失敗不覆寫備份契約；需由後續 owner 完成。
- Combat 核心已用既有 `AttackInstance.hitIds` 做單攻擊目標去重，本批未改 combat engine；boss skill timing 的 focused 測試已涵蓋 active window 只命中一次。
