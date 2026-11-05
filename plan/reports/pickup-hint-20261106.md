# 拾取目標提示 — beta.72

2026-11-06 01:10 HKT，本機候選 `1.0.0-beta.72`，未發布。

## 改動與原因

既有按住拾取每150ms連撿已存在，本輪保留。新增情境提示：靠近掉落物時顯示目前拾取鍵、物品名稱與數量（或金幣數）、按住連拾說明。NPC／傳送門優先，接著掉落物，再攀爬／下跳提示；暫停、面板及待恢復時不顯示。

`src/app/pickup-target.ts`集中原有90px圓形範圍、最近距離及同距離ID排序，讓命令、按住重複及UI同源。現在也排除到期掉落物，避免處理命令後才清理到期物造成的時間邊界錯誤。既有冷卻、背包規則、掉落機率、存檔格式及SDK不變。

## 驗證

- `tests/pickup-target.test.ts` 6項與`tests/movement-hint.test.ts` 5項，共11/11通過：範圍／到期／同距離、名稱與數量、顯示閘門、改鍵／優先序、實際命令取得提示目標。
- `tsc --noEmit`及Vite build通過，成品`dist/`，JS `index-azp8xydq.js`。
- 未跑全回歸、content（內容資料未改）、browser、ZIP或平台／帳號驗收；實際提示排版未驗。
- 本機Node24.19.0；不將本輪建置宣稱為符合發布規格要求的24.22.1+環境。

## 規格

01:07 HKT重新經網路完整讀取Playroom main的game-agent-template、game-development、command-contracts、game.schema、game-release、playroom-sdk、sdk-versioning、save-compatibility。沿用固定ID、相對路徑、可讀1–5／寫5，未進行發布操作。
