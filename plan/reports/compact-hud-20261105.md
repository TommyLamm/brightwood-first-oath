# 緊湊人物資訊與可收合任務追蹤

日期：2026-11-05（Asia/Hong_Kong）。本機候選版本：1.0.0-beta.59；本次未發布。

## 已完成

- 人物卡沿用既有羊皮紙與頭像素材，改用緊湊網格；一般桌面目標約 270 × 88 px，大螢幕保留適度文字放大。
- 常駐名字、等級、HP／MP；保留低血量提示。EXP 改為底部 4px 進度條，仍提供可存取數值及滑鼠提示。
- 頭像可開啟能力面板；職業沿用該面板顯示，另補完整 EXP／等級上限資訊。
- 任務追蹤標題列使用原生按鈕展開／收起，提供 aria-expanded、aria-controls；保留穩定按鈕節點和鍵盤焦點。
- 收起後顯示任務名稱及進度；單目標顯示名稱與數量，多目標顯示已完成項目數。可交付時顯示綠色「✓ 可交付」，不強制展開。
- 展開後保留目標、交付 NPC／地圖及「查看任務」入口；入口沿用既有任務選取與日誌操作。
- 裝置偏好獨立保存在 `<gameId>:ui:quest-tracker-collapsed:v1`；切圖與 UI 重建不會清除。讀寫失敗時仍可於本次遊戲收合。未更動角色／雲端存檔格式。
- 移除小視窗強制隱藏任務追蹤及舊人物卡放大尺寸的覆寫。

## 來源與適用規格

本次開始前透過網路工具讀取 main 文件（2026-11-05）；只採用專案開發與發布要求：

- [遊戲開發範本](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)
- [開發與發布標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)
- [操作與錯誤契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)
- [Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)
- [Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)
- [成績與存檔 SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)
- [版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)
- [存檔相容性](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)

本次適用：沿用既有素材／玩法、資源相對路徑、iframe 尺寸適配、命名空間儲存與儲存失敗降級。未觸及 SDK、發布流程或角色存檔格式。

人物卡視覺方向：[ImageGen 效果圖](../../output/imagegen/compact-player-hud-v1.png)；[原始提示詞](../../output/imagegen/compact-player-hud-v1.prompt.txt)。效果圖為設計參考，並非本次實作後的瀏覽器截圖。

## 第一階段驗證（實作完成時）

- `npm test -- src/ui/quest-tracker.test.ts tests/journal-selection.test.ts`：2 檔、11 項通過。包含偏好重新讀取、遊戲間隔離、原存檔不變、儲存失敗／不可用，以及進度與可交付摘要。
- `npm run typecheck`：通過，exit 0。
- `npm run build`：通過，exit 0；成品在 `dist/`。
- `git diff --check`：通過；僅既有 LF／CRLF 提示。

依使用者的最少驗證要求，未啟動瀏覽器、未重複截圖、未跑完整回歸或平台發布驗收。以上測試不證明實際畫面尺寸、跨裝置視覺與點擊流程已通過瀏覽器驗收。

## 下一步與界線

實作與必要檢查已完成。使用者後續明確要求實際畫面測試，結果見下節；未執行項目仍維持未驗，不外推完整平台驗收。

工作區原有素材清晰度、鏡頭修正及使用者文件變更均保留；本次未提交、推送、建立 Release 或上架。

## 後續實際 Chrome 畫面驗收（2026-11-05）

沿用已驗證的一般使用者執行環境及已安裝 Playwright CLI，以獨立 profile、明確 headless:true 完成測試；桌面未開啟有視窗模式。

- 1280×720 真實尺寸：人物卡 270×88、任務卡展開約 240×81／收起約 240×35；960×540 與 1920×1080 的 DOM 邊界亦無溢出。已審閱 1280 與 960 截圖，1920 未另做截圖審閱。
- 正常 UI 建立測試角色，確認收起後重載記憶、鍵盤 Enter／Space、滑鼠焦點恢復、頭像能力入口及任務詳情入口。
- 正常接取第一次出發並擊敗三隻蝸牛；收起狀態下實際進度更新，完成後保留收起並顯示綠色「✓ 可交付」。展開仍顯示森芽及晨光營地的交付位置。
- 未發現 pageerror、requestfailed、console error 或觀測頁面的 HTTP >=400 資源。測試器選取與走位問題依真實 snapshot／裁圖調整，沒有修改遊戲程式。
- 正常暫停、匯出測試 raw、關閉本輪 Chrome session 與 server；收束觀測為本輪匹配程序 0、43761 listening 0。

完整來源、測試器限制、raw、實畫與 owner／收束證據：[run record](../../output/playwright/compact-hud-20261105-01/run-record.md)。最後實畫：[任務可交付、維持收起](../../output/playwright/compact-hud-20261105-01/ready-1280-review.jpg)。未重跑第一階段已通過的檢查，未做完整回歸、手機實機或平台 iframe／雲端驗收，未發布。
