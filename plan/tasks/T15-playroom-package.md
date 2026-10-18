# T15：Playroom adapter、固定工具與候選ZIP

目的：交付平台能接收的靜態成品與正式SDK薄介面。所有權src/platform/**、public/vendor/**、public/game.json、public/cover.png、.playroom/**、tools/playroom/**、.github/workflows/release.yml。G0後可準備，正式封面／打包需T14成品；package scripts變更交主Agent，不自行改根設定。

## 2026-10-18 15:40 HKT 最新交接

- T10–T12正式素材已完整（actors 22 images／64 animations＋96 anchors、environment 20 images、interface 47 images／5 effects）；音訊沿用已交付的16個WAV。遊戲接合與完整路線仍由T14/T16驗收，素材完成不代表候選已可玩。
- 已重新完整讀取根 `AGENTS.md`、Playroom `main` 範本及其七份線上規格，並讀本包依賴的 README/status、asset recovery report、05/07/10/11、T15 task/report。版本要求維持 SDK/tools 1.1.0、protocol 1、Manifest schema 2；候選固定 `brightwood-first-oath`／`1.0.0-beta.1`、desktop、cloudSave format 1。
- 對 adapter、Manifest、固定工具入口及 Release workflow 做了最新規格差異檢視，未發現需要改動的包裝缺口；工具 ZIP SHA-256 與 lock 相符。此 audit 沒有改 source，亦未執行 build、瀏覽器、pack 或 validate。
- T15-08等待T14提供真實遊玩畫面。請把實際執行中的遊戲截圖原始PNG放在 `art-source/cover/gameplay-source.png`；畫面須包含遊戲場景與玩家，不能以概念圖、素材圖集或空白載入／標題畫面代替。由原圖製作精確800×500的 `public/cover.png`，保留來源證據。
- T15-11待整合方完成最終build並明確授權後，在main repository根目錄依序執行 `node tools/playroom/pack.mjs dist artifacts/game.zip` 及 `node tools/playroom/validate.mjs artifacts/game.zip`，然後另查ZIP內容無機密與無關檔案。不得手動ZIP或提前重跑 build/install；未經授權不建立tag、Release或呼叫平台API。

先依根AGENTS完整讀當時main七文件，來源見05。本包不能實作或呼叫帳號／管理API，不用第三方同名Playroom套件代替本專案SDK。分段交付：T15-a先完成01..07與09..10供T14接正式adapter；T15-b在T14完成後做08封面及11..12候選驗證，不讓整包等待造成循環。

## 步驟

- [x] T15-01 記完整規格讀取時間、URL與版本軸，確認跟目前Manifest／工具相容；讀失敗報URL及原因，不猜欄位。
- [x] T15-02 在成品外隔離平台checkout，固定依賴，按標準跑sdk:build/game:schema/game:tools；不執行無關遠端命令或把發布token交給工具。
- [x] T15-03 將生成工具ZIP放.playroom/tools及SHA256 lock放.playroom/game-tools.lock.json，記版本／來源／metadata／逐檔雜湊。不假設遠端工具Release已存在。
- [x] T15-04 SDK JS（及需要的d.ts）複製public/vendor，使用相對匯入；只保留一份正式SDK。
- [x] T15-05 playroom-port.ts實作07 CloudPort，透傳ready／load／save、null、saved及Error.code/machineCode，不catch成空存檔；無自製postMessage、無帳號憑證。
- [x] T15-06 建正式Manifest schema2；使用者已定案固定候選ID `brightwood-first-oath`、名稱 `Brightwood: First Oath`。保留作者 `獨立製作`、devices只有desktop及cloudSave readable[1]/write1；不宣告leaderboard，不加$schema／未知欄位。
- [x] T15-07 instructions寫實際按鍵與玩法、description不誇稱官方／完整世界，entry index.html、cover cover.png、tags≤8；本機候選版號與未發布狀態清楚。
- [ ] T15-08 T14正式畫面可用後從實際畫面製800×500封面，≤5MiB，不能用概念圖冒充截圖；本包不另開共用瀏覽器干擾主Agent，可請其提供一次真實截圖。T14-c 已於 f0bcc6c 提交，但截圖仍阻塞：Playwright wrapper 因 Git Bash/MSYS `NtCreateDirectoryObject(...): 0xC0000022` 失敗，唯一 `npx` 備援因 registry DNS `ENOTFOUND` 失敗；未產生來源截圖或封面。
- [x] T15-09 tools/playroom提供明確本地pack/validate入口，指向固定工具解壓CLI；dist來源、artifacts/game.zip輸出，工具／zip均在dist外。
- [x] T15-10 複製當時最新workflow到release.yml，GAME_DIR=dist，在版本檢查前加npm ci/build，Node24與checksum/metadata全驗證；不添加略過失敗設定。
- [ ] T15-11 已對重新執行 `npm run build` 生成的真實 `dist/` 嘗試官方pack；因缺少 `dist/cover.png` 得到 `VALIDATION_ERROR` 而停止，未產生ZIP，故validate及ZIP層級檢查未執行。補上實際封面後完成官方pack、完整validate及檔案／大小檢查，保留實際輸出。
- [x] T15-12 report列工具版本／SHA／SDK／Manifest／產物路徑、實際命令、未驗證事項與需要主Agent提供的整合；清楚區分本機ZIP與未發布。

> T15-02/03 已由官方平台 main checkout 生成、驗證並固定工具 ZIP／lock；本機 pack/validate 入口需先解壓至 `.playroom/tools/extracted-1.1.0/`。T14-c 已提交；T15-08、11 仍待可用的實際遊戲截圖、封面及候選成品。

> 2026-10-18 adapter/vendor scoped source commit：`b46ce34`，僅含 `src/platform/**` 與 `public/vendor/**`。本次提交不代表 T15-08/11 完成；詳見 T15 report。

## 發布邊界

本輪目標公開上架不等於現在有推tag／Release／平台API授權。準備workflow及候選可以做；真發布需明確要求與指定公開repository，版本增版、tag一致、不覆寫既有Release。平台管理者匯入後逐版人工預覽確認，不能由腳本假確認。STATE_CONFLICT需刷新人工重確認，不自動補最新狀態重送。

若無法取得官方工具，繼續完成adapter／manifest／workflow與靜態成品，報工具阻塞；手動ZIP不能標官方驗證通過。
