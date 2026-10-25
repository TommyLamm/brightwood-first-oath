# 遺跡 A 批次：Atlas 與音訊交接

日期：2026-10-25（香港時間）。狀態：本批負責範圍完成，交主代理整合；未發布。

## 來源與適用要求

已讀 `AGENTS.md`、`plan/12-next-chapter-ancient-ruins.md`、`plan/reports/ruins-a-dispatch.md`、`ruins-a-world.md`、`ruins-a-saves.md`。另透過網路完整讀取 Playroom `game-agent-template.md` 及七份 main 文件（`game-development.md`、`command-contracts.md`、`game.schema.json`、`game-release.yml`、`examples/starter/playroom-sdk.js`、`sdk-versioning.md`、`save-compatibility.md`），網址加 `?read=20261025`。

本批依規格保留存檔並宣告 schema 2 可讀格式 1／2、寫格式 2；候選版本提高且不覆寫已發布產物；自有資源維持相對路徑；沒有發布授權。`.codegraph/` 不存在。

## 完成項目

- 新增 `ruins` Atlas scope 與兩個真實節點：潮痕營站 `(16,72)`、盤根石道 `(40,55)`。世界圖遠古遺跡入口位於 `(69,86)`，入口狀態從琥珀砂岸通往營站的 q14 portal 推導；q14 未 claim 時顯示領獎要求，claim 後顯示開放。
- 區域圖接上 `region-ancient-ruins-map-v1.png`、繁中 alt、兩張地圖詳情、入口狀態及青綠／白石樣式。真地圖存在時隱藏同座標的待開發 marker。Atlas exploration count 只計有正式圖表座標的地圖；新區目前兩張。地標沿用 `select-map`，只改圖表選取，不改玩家位置。
- `mapOrder` 加入營站與石道。`src/app/assets.ts` 登記：`actor:ruins-moss-carapace`、`actor:ruins-archivist`、`actor:ruins-medic`、`env:ruins-camp` 與 `env:ruins-root` 的 sky/far/mid、`item:moss-ceramic`、`theme-ruins` 與 `theme-ruins:combat`。未修改環境、actor 或 interface manifests；由其他素材工作接續註冊。
- 新增原創 `theme-ruins` 32 小節 base/combat；以首誓動機作低音木管與遠鐘變奏，戰鬥層沿同一調性與和聲。M4A fallback 遵循 AAC 160k 規格；四個 Ogg/M4A 檔合計 **5.69 MiB**，低於新增 runtime 24 MiB 預算。兩張地圖新增滴水、遠鐘及石道環境音床。
- `package.json`、`package-lock.json` 與 `public/game.json` 版本一致升至 `1.0.0-beta.12`。Manifest 宣告 `readableFormats: [1, 2]`、`writeFormat: 2`；description 只提及已開放的遺跡 A 兩張地圖。
- `tests/world-map.test.ts` 加入圖表數量、q14 claimed 門鎖與選取不移動 assertions；原精確測試期望不需改動。

## 驗證

- `node node_modules/vitest/vitest.mjs run tests/world-map.test.ts`：Vitest 回報 **9 個 test files、55 個 tests 通過**。Vitest 的 substring filter 也選入 `.worktrees/*/tests` 副本，並非嚴格單檔範圍；依主代理指示不重跑已通過的檢查。其他 worktree baseline 失敗若出現，屬不相關舊副本，不修改。
- `node tools/audio/generate-audio.mjs --only theme-ruins`：成功生成並驗證音訊 manifest 的 40 個音訊項目；輸出 `theme-ruins` -16.0 LUFS、combat -16.3 LUFS。Generator 的音訊驗證涵蓋現有全部曲目及效果音。
- 聚焦 metadata 檢查確認 base/combat 各為 looped music，group/layer 與 Ogg/M4A fallback 路徑正確，四檔合計 5.69 MiB；AAC stream metadata 為 48 kHz stereo AAC-LC，average bitrate 約 161/165 kbps（160k 編碼目標）。
- 未執行 typecheck、build、瀏覽器或正式帳號存檔驗收；由主代理統一處理 typecheck/build，素材與正式整合仍待其他批次完成。未建立發布 tag、Release 或平台上架。

## 整合下一步

主代理整合後做一次統一 typecheck、build，輸出至 `artifacts/ruins-a/dist`。待素材代理交付區域圖、環境圖與 actor/interface manifests，再執行必要內容檢查。不要把 build 成功當成 iframe、正式存檔或發布驗收通過。
