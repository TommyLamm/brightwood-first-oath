# C 世界資料交接：誓鐘內殿

日期：2026-10-25。World owner 部分已完成；候選整合仍待主代理完成其他 owner 的 runtime、素材與 app 接線。

## 來源與適用要求

- 已讀 `AGENTS.md`、`plan/14-ruins-bell-sanctum.md`。
- 開工前以網路工具完整讀取 Playroom main 的[遊戲開發模板](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)，以及模板列出的七份規格：[開發標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)、[操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)、[Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)、[Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)、[starter SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)、[版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)、[存檔相容性](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)。遠端內容只作本專案開發規範。
- 本批適用：沿用既有 IDs／任務進度語義；相對資產 key 交由 manifests 實際提供；新候選資料不能冒充已通過完整 app/content/build 或正式存檔驗收。

## 新增 ID 與下游 keys

- Map：`ruins-bell-sanctum`；theme `ruins-sanctum`；music group `boss-ruins`。
- Monster：`ruins-bell-keeper`；actor image `actor:ruins-bell-keeper`；動畫 keys `ruins-bell-keeper:idle`, `ruins-bell-keeper:walk`, `ruins-bell-keeper:attack`, `ruins-bell-keeper:attack-sweep`, `ruins-bell-keeper:hurt`, `ruins-bell-keeper:dead`。
- Enemy skills：`ruins-bell-slam`、`ruins-bell-sweep`。
- Item：`oathfarer-circlet`；icon `item:oathfarer-circlet`；equipment overlay `equip:oathfarer-circlet`。
- Quests：`q18`「讓誓鐘歇息」、`q19`「帶回歸途」。沒有新增 NPC；沿用 `ruins-pathfinder`（行舟）、`ruins-archivist`（芷衡）、`mentor`（岩嶺教官）。
- Environment images：`env:ruins-sanctum:sky`, `env:ruins-sanctum:far`, `env:ruins-sanctum:mid`。
- Music：`boss-ruins`、`boss-ruins:phase2`。New win stinger key：`oath-bell-restored`；轉場沿用既有 `boss-phase`。

## 已完成

- 新增1800×720誓鐘內殿、entry spawn `(160,600)`、唯一西返 portal `(100,600)`、無NPC／平台／小怪，以及失序司鐘者 `(1200,600)` / roam `[700,1560]`。
- 回聲長廊東門新增在 `(2500,600)`，必須領取 q17；內殿西返不鎖任務。新增 map order 與遠古遺跡 atlas 第四真節點 `(86,22)`，探索總數由3升至4。
- 新增 q18（q17 → 行舟接、芷衡手動交、擊敗司鐘者、1600金幣＋守誓旅冠）及 q19（q18 → 到過木葉鎮、教官手動交、300金幣）。q20仍以前置 q16 獨立可接，不是C主線門檻。
- 新增守誓旅冠、司鐘者與兩招規則資料；rules validator 核准清單更新至34物品／20技能／17怪物、14敵方技能，並鎖定新增定義的數值。
- world validator 核准18張地圖、12 NPC、20任務；增加內殿地形、門條件、出生點、首領位置及 q18/q19 的精確配置檢查，保留 q20 的 q16 例外。
- 更新 NPC 文案與受影響的固定 catalog count 測試；新增 `tests/integration/ruins-c-quests.test.ts`，涵蓋 q17 active-ready 仍不能過門、q18 active-only kill、背包滿時原子失敗與可重試、q19 已訪即 ready 但仍需手動領取、flags 不變與 q20 獨立。

## 改動檔案

- Content：`src/content/rules/items.ts`, `src/content/rules/monsters.ts`, `src/content/rules/skills.ts`, `src/content/rules/validate.ts`, `src/content/world/index.ts`, `src/content/world/maps.ts`, `src/content/world/quests.ts`, `src/content/world/dialogues.ts`, `src/content/world/validate.ts`。
- Atlas：`src/ui/world-map-model.ts`。
- 聚焦與計數測試：`tests/integration/ruins-c-quests.test.ts`, `tests/integration/app-foundation.test.ts`, `tests/ruins-gallery-combat.test.ts`, `tests/ruins-gallery-world.test.ts`, `tests/rules.test.ts`, `tests/world-map.test.ts`。

## 檢查與待辦

- 通過：`npm run test -- --exclude '**/.worktrees/**' tests/integration/ruins-c-quests.test.ts tests/ruins-gallery-world.test.ts tests/world-map.test.ts tests/rules.test.ts`（4 files、22 tests）。`git diff --check` 對已追蹤的本批檔案通過。
- 未由此 owner 執行：typecheck、`check:content`、build；依本批分工交由 integration 統一執行。未跑全套測試、瀏覽器、ZIP或發布流程。
- 未完成的下游依賴：environment／actor／item／music／stinger 的實際 assets 與 public manifests 尚未由本 owner 建立；相關 keys 已列出供素材 owner 接線。其餘 actors/runtime、app/UI、save-format integration 由各 owner／主代理負責。
- 未改版本、存檔格式、共用 types/ports/persistence、actors、render/UI 或 public manifests；正式雲端存檔、候選 build 與 Playroom 發布仍待獨立驗收。
