# T12：24物品圖示、技能、UI皮膚及特效

目的：UI及戰鬥有可辨識的正式視覺。所有權public/assets/interface/**、art-source/interface/**。讀08/10；manifest對G0型別。不得改UI程式或物品ID／增加技能。

目前狀態：素材製作 DONE（2026-10-18）。使用者已明確授權確定性素材匯出，v8 原稿保留，已匯出 `vfx-heavy-strike-v9.png` 並加入 manifest，現有47 images／5 VFX animations。六格正方形、16px安全邊及binary alpha已檢查，詳 reports/T12.md 與 source-log.md。遊戲接合與Playroom驗收未執行。

## 步驟

- [x] T12-01 固定圖示風格：32×32顯示、清楚輪廓、物品與裝備造型對應T10參考；透明背景，不含小字。
- [x] T12-02 生成四武器／三衣服／三帽圖示，能以形狀區分升級，不只同圖換標籤。
- [x] T12-03 生成四藥水圖示，小大與紅藍可辨；六材料與四任務物分別有圖，數量合計24。
- [x] T12-04 生成heavy-strike/sweep/iron-guard/vitality/rest-recovery五技能圖示；不把basic或敵招塞入可學技能清單。
- [x] T12-05 生成quest/portal/shop/player四marker，display小尺寸仍清楚，不含遊戲文字。
- [x] T12-06 生成panel/button三態/bar三類/slot二態皮膚；只做美術，不畫固定像素位置的整張不可互動介面。
- [x] T12-07 五組六格透明VFX均已入庫；heavy-strike v9由既有ImageGen v8原稿依使用者授權確定性匯出。
- [x] T12-08 manifest現有47 images／5 VFX animations，包含vfx:heavy-strike，24 item keys不變。
- [x] T12-09 新heavy-strike已視檢六格動作；768×128、6×1、每格128×128，至少16px透明邊，alpha只有0／255；其餘四組沿用先前驗收。
- [x] T12-10 正式素材、原稿／prompt、v9匯出腳本與metrics已存專案；runtime圖片3,212,480 bytes，低於6MiB。

完成：清單齊全、manifest可解析、技能效果有動作而非單張白光；文字由UI繪製，任何按鈕行為不是本包負責。
