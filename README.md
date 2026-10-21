# Brightwood: First Oath

原創桌面單機 2D 劍士冒險遊戲，遊戲 ID：`brightwood-first-oath`。

[公開 Repository](https://github.com/TommyLamm/brightwood-first-oath) · [預發布候選](https://github.com/TommyLamm/brightwood-first-oath/releases/tag/v1.0.0-beta.3)

首版內容包含七張地圖、六種普通怪物、一名首領、五名 NPC、八個任務及 24 種物品。現有候選版本為 `1.0.0-beta.3`。

## 本機執行

使用 Node.js 24：

```sh
npm ci
npm run dev
```

建置與固定 Playroom 工具打包：

```sh
npm run build
node tools/playroom/pack.mjs dist artifacts/game.zip
node tools/playroom/validate.mjs artifacts/game.zip
```

`dist/` 是靜態成品；請透過 HTTP 伺服器開啟。`artifacts/`、`node_modules/`、工具解壓目錄及工作樹快取不提交；固定工具 ZIP 與 lock 保留在 `.playroom/`。Release 提供 `game.zip`。

## 操作

方向鍵移動／爬梯、左 Alt 跳躍、左 Ctrl 普攻、Z 拾取、Space 互動；1–3 技能、Q/W 藥水；I/E/K/C/J/M 開啟面板，Esc 關閉面板或暫停。

## 候選驗收與來源

型別、建置、內容交叉引用及官方 ZIP 驗證已通過；曾以指定 sandbox 的跨來源 iframe 檢查基本操作及 960×540／640×360 顯示。實際主線僅驗到 q01 擊殺 2/3；完整八任務、45–60 分鐘節奏、可聽音訊、全螢幕、完整 browser console、正式雲端存檔與 FPS 尚未驗證。

圖片原稿、提示詞及匯出證據保留在 `art-source/`，正式資源位於 `public/assets/`；音訊為可重現的原創合成內容。本專案不包含 Playroom 平台人工驗收或上架操作。

- [計畫與開發索引](plan/README.md)
- [驗收報告](plan/reports/T16.md)
- [打包報告](plan/reports/T15.md)
- [素材來源交付](plan/reports/asset-recovery-20261018.md)
