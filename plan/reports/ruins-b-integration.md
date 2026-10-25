# 遠古遺跡包 B：整合交接

日期：2026-10-25（香港時間）。整合檢查與候選 build 已完成，等待主代理最後審查；未發布、未 commit。

## 來源與適用要求

- 閱讀 `AGENTS.md`、`plan/13-ruins-echo-exploration.md`、`plan/reports/ruins-b-dispatch.md`，以及 B 的 contracts/saves、monster/rules、world、app/UI/renderer、scene/NPC/assets 和 atlas assembly 交接。
- 主代理在本工作階段已完整網路閱讀 Playroom `game-agent-template.md` 及其列出的七份 main 規格：`game-development.md`、`command-contracts.md`、`game.schema.json`、`game-release.yml`、`playroom-sdk.js`、`sdk-versioning.md`、`save-compatibility.md`。本整合承接該規格檢視紀錄。
- 參照 `artifacts/ruins-a/check-assets.mjs` 與 A 的 `asset-reference-check.json`；只新增 `artifacts/ruins-b/` 範圍的檢查與證據，未修改 A checker、A 證據或 beta.12 成品。
- 適用要求：候選版本同步為 beta.13；schema 2 存檔宣告讀 1／2／3、寫 3；候選正式寫 3 仍須平台橋接版實際理解新 ID／inspect。全部資產 URL 保持相對路徑。B 新 runtime ≤4 MiB，A+B ≤24 MiB。未獲發布指示時不推 tag、不做 SDK／雲端發布、ZIP 或上架。

## 整合改動

- `package.json`、`package-lock.json`、`public/game.json`：同步 `1.0.0-beta.13`；`cloudSave` 改為 `{ readableFormats: [1, 2, 3], writeFormat: 3 }`；遊戲描述加入回聲長廊。沒有建立或移動 git tag。
- `tests/persistence.test.ts`、`src/platform/playroom-port.test.ts`、`tests/ruins-save.test.ts`：更新唯一寫入格式 3 的斷言／輸入；未知格式樣本用 7 保持真正不支援格式測試，舊格式 1／2 fixture 保留作讀取測試。
- `tests/rules.test.ts`：固定核准清單更新為 33 items、18 skills、16 monsters，並包含 B 兩個新敵方技能。
- 新增 `artifacts/ruins-b/check-assets.mjs` 及其執行證據 `artifacts/ruins-b/asset-reference-check.json`；新候選 build 輸出於 `artifacts/ruins-b/dist/`，證據為 `artifacts/ruins-b/build-summary.json`。
- 整合 owner 沒有修改 actors／environment／interface／audio manifests。素材 owner 已在其交接內完成 scene 資產與 manifests；atlas assembly owner 追加兩張怪物圖和十個 animation entries，詳見 `plan/reports/ruins-b-atlas-assembly.md`。

## 實際驗證

- beta.13 占用檢查：`git tag --list '*beta.13*'` 無結果；`artifacts/` 無 beta.13 tag／成品路徑；build 前 `artifacts/ruins-b/dist` 不存在。`artifacts/ruins-a/dist` 存在並保留。
- legacy 聚焦測試首輪：

  ```text
  npx vitest run tests/persistence.test.ts src/platform/playroom-port.test.ts tests/ruins-save.test.ts tests/rules.test.ts --exclude '**/.worktrees/**'
  ```

  3 個檔案通過，合計 35/36 tests；唯一失敗是 `rules.test.ts` 固定敵方技能清單漏列兩項新技能。補入 `ruins-prowler-sweep` 與 `ruins-puppet-slap` 後，只重跑 `npx vitest run tests/rules.test.ts --exclude '**/.worktrees/**'`，結果 1 檔、10/10 通過。其餘三個檔不重跑。
- `npm.cmd run typecheck`：exit 0。
- `npm.cmd run check:content`：通過 `rulesCatalog` 及 `worldCatalog + cross-reference validation`。兩項檢查是在 `public/game.json` 僅補描述文字前完成；未為純文字改動重跑。
- 素材齊備後執行 `node --import tsx artifacts/ruins-b/check-assets.mjs`：通過。4 個 manifest packs、207 個相對 URL／引用檔、10 個新增 runtime 檔（scene 8、monster atlas 2）共 **2,467,832 bytes／2.35 MiB**。A 的 beta.12 新增 runtime 為 **11,840,449 bytes**；A+B 合計 **14,308,281 bytes／13.65 MiB**，低於 B 4 MiB 及章節 24 MiB 預算。檢查包含長廊引用、兩怪五種動畫及格位、石碑靜態 animation 契約、PNG 尺寸／格線、第三地標 `(67,39)`、版本與存檔宣告；未重做逐幀 alpha 檢查，該項由 assembly owner 完成並記錄於其交接。
- 素材到位後執行 `npx vitest run tests/integration/app-foundation.test.ts --exclude '**/.worktrees/**'`：1 檔、12/12 通過。沒有在缺圖狀態反覆重跑；本次在正式 assembly 完成後針對先前失敗的依賴執行一次。
- build：`npm.cmd run build -- --outDir artifacts/ruins-b/dist`，exit 0；Vite 轉換 65 modules。build 產物核對找到 `index.html`、`game.json` 與全部 10 個新增 runtime assets；產物 manifest 為 `1.0.0-beta.13`，入口為 `index.html`。結果記於 `artifacts/ruins-b/build-summary.json`。
- `git diff --check -- package.json package-lock.json public/game.json tests/persistence.test.ts src/platform/playroom-port.test.ts tests/rules.test.ts`：exit 0，無 whitespace error；Git 僅提示部分檔案下次由 Git 寫入時會正規化 LF／CRLF。此命令只檢查指定的 tracked diff；Git diff 不會納入新檔（包含 `tests/ruins-save.test.ts`、B checker/evidence 及本報告）。

## 限制與尚未完成

- 未做真實瀏覽器手感／畫面驗收、正式 Playroom SDK 驗收、雲端格式 3 寫入／橋接部署、完整 ZIP 驗證、Release 或平台發布。fixture 與本機候選不能代替公開橋接版本實際支援 B catalog／inspect 的證據。
- 未 commit，也不更新主計畫狀態或宣布 B 完成；留由主代理最後審查、維護狀態及決定後續。
