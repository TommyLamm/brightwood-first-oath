# T00：主 Agent 建骨架與發布契約

目的：讓所有子代理依賴真實可匯入的共同基礎，避免各自建立專案。所有權：根package／lock／tsconfig／vite／index.html、src/contracts/**、src/main.ts最小入口、tools/check-content.ts框架。僅主 Agent執行；不先寫其他包功能。

輸入：[01](../01-game-design.md)、[02](../02-technical-design.md)、[07](../07-shared-contracts.md)、[08](../08-content-spec.md)、[10](../10-asset-spec.md)。依賴無；先按AGENTS讀線上規格。

## 步驟

- [x] T00-01 查Node/npm及現有檔案，保留使用者變更；沒有套件才初始化。Node24是發布工具環境，實際本機不可用時明列差異，不做無關全機升級。
- [x] T00-02 固定TypeScript strict、Phaser3、Vite、Vitest及tsx相容穩定版本與lockfile，新增gitignore排node_modules/dist/artifacts/工具暫存，保留應提交的固定.playroom ZIP。
- [x] T00-03 建dev=vite、build=vite build、typecheck=tsc --noEmit、test=vitest run、check:content=tsx tools/check-content.ts；test可傳單檔，Vite base='./'。content runner匯入rules/world及兩validator，驗完整跨表；未交資料明示缺少，不假成功。使用tsx避免Node直接匯TS／extensionless路徑差異。
- [x] T00-04 把07的types／definitions／commands／ports／asset-manifest分檔落入contracts，統一從contracts/index.ts匯出。補齊QuestView、QuestClaimPlan、MonsterState、ActorStep等文件欄位，禁止any。
- [x] T00-05 將怪物碰撞width/height與首領pendingSkillId、attackOrigin、attackFacing、deathReported列為明確欄位；所有初始化有預設，不讓T06另起型別。（`src/contracts/types.ts` 有欄位；T06 `createMonster` 已提供初始化預設。）
- [x] T00-06 建立穩定nextEntityId、可注入seeded RNG與結果helper放contracts/helpers.ts；這些沒有DOM／Phaser依賴。ID帶session前綴，不在runtime重用。
- [x] T00-07 建index.html遊戲容器與UI容器；src/main.ts只顯示「開發中：系統尚未接入」，可以載入Phaser但不偽造開始遊戲。無自動播放。（T00 初始入口已完成；後由 T14 commit `ab0019f` 接線替代，本次不重加 `src/main.ts`。）
- [x] T00-08 建最小內容檢查runner，依T01/T05公開資料聚合檢查；資料未就緒由主Agent暫不執行聚合，勿製造大量佔位正式內容。
- [x] T00-09 建立 `public/assets/` 四包目錄與 manifest schema policy，並由 Vite 僅打包 `public/`，讓 `art-source/` 留在成品外。2026-10-18 素材交付後四包 canonical manifests 均完整：actors 22 images／64 animations＋96 hero anchors、environment 20 images、interface 47 images／5 VFX animations、audio 16 entries；素材報告的 app loader 檢查通過，引用檔案存在。詳見 `plan/reports/asset-recovery-20261018.md`。不代表 renderer 視覺接合或音訊瀏覽器播放已驗收。
- [x] T00-10 確認最小typecheck/build，記實際命令；發布G0，通知所有包真實匯入路徑、工具指令及contracts版本。

## 完成條件與交付

根設定、型別、必要指令及入口真實可用；子代理不需要另選框架或猜命名。report列所有契約檔、匯出與實際檢查。只有G0就緒，不能標遊戲完成。後續共同介面修改仍由主Agent單一負責，處理完通知消費包。
