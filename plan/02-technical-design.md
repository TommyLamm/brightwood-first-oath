# 架構定案

TypeScript strict、Phaser 3、Vite、Node 24；HTML/CSS 介面，不加 UI 框架、ECS 或自製完整編輯器。T00 選擇可用且相容的穩定版本並固定 lockfile；其他代理不各自升級。不能混用 Phaser 不同主版本 API。

## 依賴與時鐘

contracts 不依賴執行庫；content 只依賴 contracts；domain 使用 contracts 與傳入唯讀資料；render 依賴 Phaser 不實作經濟；ui 依賴 DOM 不直接改世界；persistence 經 adapter 存取 SDK；app 唯一決定迴圈、交易及接線。型別與函式以 [07](07-shared-contracts.md) 為準。

邏輯固定 60Hz，dt 單位秒；冷卻時間為整數 gameTimeMs。Phaser update 提供時間，app 最多補五步、丟棄剩餘累積；背景／暫停／切圖不累積傷害。渲染不得二次推進碰撞。

位置以腳底中心、X 右 Y 下、世界 px；角色碰撞 24×44，圖格 96×96。視口 960×540，等比適配，640×360 時 UI 可捲動。世界與 UI 縮放分開。

## 資源與部署

Vite base './'，自有資產在 public/assets，各包寫獨立 manifest，由 app 聚合。入口、game.json、封面、SDK 進 dist，ZIP 到 artifacts。無必要外部 CDN／串流。

按地圖組載入，重用角色及 UI；退出場景清監聽器、計時器、碰撞器與暫態效果。地形碰撞、美術、生成及傳點分離。完整目錄所有權在工作包索引。

## 多人接點與驗證

有 seq 的 GameCommand、純 domain、可注入亂數、執行期不重用實體 ID、PersistentState／WorldSnapshot 分開。未來可接權威伺服器，首版不做外部身分／網路／競技防作弊。

T00 建立真實 typecheck、build、test、check:content 指令；子代理只跑本包核心檢查，主 Agent 集中整合。細節見 [11](11-integration-and-validation.md)。
