# T15：Playroom adapter、固定工具與候選ZIP

目的：交付平台能接收的靜態成品與正式SDK薄介面。所有權src/platform/**、public/vendor/**、public/game.json、public/cover.png、.playroom/**、tools/playroom/**、.github/workflows/release.yml。G0後可準備，正式封面／打包需T14成品；package scripts變更交主Agent，不自行改根設定。

先依根AGENTS完整讀當時main七文件，來源見05。本包不能實作或呼叫帳號／管理API，不用第三方同名Playroom套件代替本專案SDK。分段交付：T15-a先完成01..07與09..10供T14接正式adapter；T15-b在T14完成後做08封面及11..12候選驗證，不讓整包等待造成循環。

## 步驟

- [x] T15-01 記完整規格讀取時間、URL與版本軸，確認跟目前Manifest／工具相容；讀失敗報URL及原因，不猜欄位。
- [x] T15-02 在成品外隔離平台checkout，固定依賴，按標準跑sdk:build/game:schema/game:tools；不執行無關遠端命令或把發布token交給工具。
- [x] T15-03 將生成工具ZIP放.playroom/tools及SHA256 lock放.playroom/game-tools.lock.json，記版本／來源／metadata／逐檔雜湊。不假設遠端工具Release已存在。
- [x] T15-04 SDK JS（及需要的d.ts）複製public/vendor，使用相對匯入；只保留一份正式SDK。
- [x] T15-05 playroom-port.ts實作07 CloudPort，透傳ready／load／save、null、saved及Error.code/machineCode，不catch成空存檔；無自製postMessage、無帳號憑證。
- [x] T15-06 建正式Manifest schema2，候選ID/名稱/作者用06、devices只有desktop、cloudSave readable[1]/write1；不宣告leaderboard，不加$schema／未知欄位。
- [x] T15-07 instructions寫實際按鍵與玩法、description不誇稱官方／完整世界，entry index.html、cover cover.png、tags≤8；本機候選版號與未發布狀態清楚。
- [ ] T15-08 T14正式畫面可用後從實際畫面製800×500封面，≤5MiB，不能用概念圖冒充截圖；本包不另開共用瀏覽器干擾主Agent，可請其提供一次真實截圖。
- [x] T15-09 tools/playroom提供明確本地pack/validate入口，指向固定工具解壓CLI；dist來源、artifacts/game.zip輸出，工具／zip均在dist外。
- [x] T15-10 複製當時最新workflow到release.yml，GAME_DIR=dist，在版本檢查前加npm ci/build，Node24與checksum/metadata全驗證；不添加略過失敗設定。
- [ ] T15-11 主Agent交候選dist後執行官方pack及完整validate，另查機密／.env／原稿／無關檔案及64/256MiB／10000entries限制；保留實際輸出。
- [x] T15-12 report列工具版本／SHA／SDK／Manifest／產物路徑、實際命令、未驗證事項與需要主Agent提供的整合；清楚區分本機ZIP與未發布。

> T15-02/03 已由官方平台 main checkout 生成、驗證並固定工具 ZIP／lock；本機 pack/validate 入口需先解壓至 `.playroom/tools/extracted-1.1.0/`。T15-08、11 仍待 T14-c 的實際畫面與候選成品。

## 發布邊界

本輪目標公開上架不等於現在有推tag／Release／平台API授權。準備workflow及候選可以做；真發布需明確要求與指定公開repository，版本增版、tag一致、不覆寫既有Release。平台管理者匯入後逐版人工預覽確認，不能由腳本假確認。STATE_CONFLICT需刷新人工重確認，不自動補最新狀態重送。

若無法取得官方工具，繼續完成adapter／manifest／workflow與靜態成品，報工具阻塞；手動ZIP不能標官方驗證通過。
