# 畫質第一批素材與可重現匯出

2026-11-05；已接入本機 `1.0.0-beta.60`，未發布。

## 新製作圖像

- 工具：內建 ImageGen；沒有使用 API／CLI fallback。
- 編修目標：`cloth-attack-edit-target.png`，從原布衣攻擊六格按 3×2 排列取得。
- 完整實際 prompt：`cloth-attack.prompt.txt`。
- 未加工輸出：`cloth-attack-generated.png`，1536×1024 RGBA。
- 工具原始輸出保留在 `C:/Users/Tommy/.codex/generated_images/01a1a951-d349-7641-9734-ed5049f38f49/exec-02352ce6-399b-4f6d-b103-e1022d4a1904.png`。
- 只替換布衣攻擊 32–37 格，以及原本對應的 38–39 填充格；其他布衣狀態的影格像素保持一致，圖集仍為 1536×1536。

## 原稿細節恢復

兩把武器、六種環境物件與重擊皆從 repository 內保留的既有 ImageGen 原稿匯出，沒有把低解析 runtime 圖放大充作新細節。

- 冰潮長鋒：`art-source/expansion-frost/sword/frost-tide-sword-imagegen-transparent-rgba-1254.png`。
- 日井誓刃：`art-source/expansion-sands/sentinel/reward/sunwell-oathblade-raw-v1.png`。
- 平台：`art-source/environment/env-tile-platform-t11-06-stone-timber-one-shot-20261018.png`，沿用原匯出器的內部材質裁切及接縫處理，取消 48 色限制。
- 梯子、傳送門、營地牌、礦坑門、祭壇：`art-source/environment/env-*-v1.png` 高解析原稿。
- 重擊：`art-source/interface/interface-vfx-heavy-strike-v8-attempt1.png`，沿用六個原始分區與動畫位置，取消八色減色，保留半透明細節。

原稿 prompt／來源記錄分別在各來源資料夾的 source log／notes；新攻擊稿的 prompt 完整保存在本資料夾，不把歷史缺失的 prompt 重建成原文。

## 重現與幾何

執行 `python art-source/quality-pass1-20261105/export-quality.py`。需要 Pillow 與 numpy，沒有新增 npm 依賴。

三份 `*-manifest-before.json` 保留本批替換前映射。匯出器只對採用項目更新 runtime URL，保留資產 key、邏輯尺寸、pivot、動畫影格和時序。

機械處理限 alpha 清理、裁切、預乘透明縮放、圖集排版與原有平台 wrap band；沒有用程式繪製角色姿勢。

`export-report.json` 記錄所有原稿／輸出 SHA-256、尺寸、大小及身形外框差異。布衣與環境外框差異 0 邏輯 px；兩把劍最大 0.5 邏輯 px。素材檔案增加 326,877 bytes，基本 RGBA 解碼估計增加 2,365,440 bytes，不代表瀏覽器實測峰值。

## 檢視與驗收

- 素材比較：`output/quality-pass1-20261105/asset-comparison.jpg`，素材合成圖，非遊戲截圖。
- 實機對照：同目錄 `world-final-comparison.jpg`、`attack-final-review.jpg`、`game-final-1280-review.jpg`。
- 最終無頭結果：`output/playwright/quality-pass1-20261105-02/run-record.md`。
- 綜合交接：`plan/reports/quality-pass1-20261105.md`。

尚未擴展至其他主角裝束／全世界背景重製；未驗後期武器的實際裝備流程或重擊技能實際施放。本批保留原有錨點與技能時序，使用靜態結構、既有相關測例及瀏覽器載入／解碼核對。
