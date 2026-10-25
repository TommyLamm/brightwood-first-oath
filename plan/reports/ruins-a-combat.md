# 包 A 戰鬥／苔陶蟲交接

日期：2026-10-25（香港時間）

## 已完成

- 新增 `ruins-moss-carapace` 規則：Lv30、HP1100、ATK48、DEF20、speed42、EXP0、coins90、respawn9000；選用碰撞尺寸56×38、aggroRange320（計畫未指定這兩值）。
- 新增 `moss-ceramic`（材料、商店不可買、售價45）及苔陶蟲必掉1個。
- 新增敵方技能 `ruins-carapace-bite`：cooldown1400、windup550、active80、recovery770、reach60、height70、倍率1、單目標；domain actor 為苔陶蟲選此技能。沿既有 actor／combat 流程產生固定方向矩形預警，攻擊實例的 `hitIds` 保證同一目標只命中一次。
- renderer 對苔陶蟲攻擊略過等分 `totalDurationMs`，改用動畫素材的逐格時間；`animation-contract` 規定attack四格為 `[275,275,80,770]`，使第三格命中姿勢從550ms起播放80ms。其他怪物仍沿既有等分邏輯。
- 更新 rules validator 的精確數量及 `tests/rules.test.ts` 固定ID斷言；新增 `tests/ruins-carapace.test.ts`，涵蓋攻擊預警尺寸／起始時間、起手鎖向、1400ms再次起手、active window單次命中及動畫格時序。

## 素材狀態

profile prompts、兩張原圖、三版動畫sheet原圖、prompt、1280px以內JPEG審圖、檢查腳本及首版未採用downscale候選都在 `art-source/ruins-a/`。profile v2 作為概念參照；三版sheet都未接受為runtime。v2／v3雖然尺寸可整分成6×5個229×229來源格，alpha內容仍貼到或跨過內部格線；v3每條垂直內格線附近有約150–256個alpha>8像素。檢查細節見 `art-source/ruins-a/review-notes.md` 和 `check-grid.py`。

因此沒有在 `public/assets/actors/` 留下runtime PNG，也沒有修改 `public/assets/actors/manifest.json`。下一位素材代理應先評估可否將原圖的獨立alpha元件分離並重新對齊；不可把現有概念圖當正式sheet。接受後需新增真實image key `actor:ruins-moss-carapace`，columns=6、rows=5、displaySize=96×96、pivot=(0.5,1)，動畫key為 `ruins-moss-carapace:{idle,walk,attack,hurt,dead}`：

- idle frames `[0,1]`, `[200,200]`, loop；walk `[6..11]`, 六格各120ms、loop；
- attack `[12..15]`, `[275,275,80,770]`, non-loop；hurt `[18,19]`, `[100,100]`, non-loop；dead `[24..27]`, 四格各100ms、non-loop；
- unused atlas cells以該列最後有效格補滿：idle cols3–6複製第2格、attack cols5–6複製第4格、hurt cols3–6複製第2格、dead cols5–6複製第4格。

`src/app/assets.ts` 的required actor/item keys已由主代理變更。runtime素材完成時再讓他統一檢查manifest與assets loader。

## 規格來源

開始時完整讀取專案 `AGENTS.md`、`plan/12-next-chapter-ancient-ruins.md`、Playroom模板及其列出的七份 main 文件：game-development、command-contracts、game.schema.json、game-release.yml、starter/playroom-sdk.js、sdk-versioning、save-compatibility（URL以 `?read=20261025` 讀取）。本包無平台發布或存檔格式改動。

## 驗證與下一步

- 已做素材預覽與cell-alpha邊界檢查；不合規sheet已隔離在 `art-source/ruins-a/`，不是runtime素材。
- 尚未跑測試或build；`tests/ruins-carapace.test.ts`及`tests/rules.test.ts`交主代理統一執行，避免子代理各自啟動套件。建議使用 `node node_modules/vitest/vitest.mjs run tests/ruins-carapace.test.ts tests/rules.test.ts`。
- 下一步：素材代理交付合格sheet、加入actor manifest；主代理整合required asset keys、素材loader及整體A批驗收。此交接不含q15/q16、地圖、NPC或其他章節範圍。
