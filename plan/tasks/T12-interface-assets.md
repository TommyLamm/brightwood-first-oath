# T12：24物品圖示、技能、UI皮膚及特效

目的：UI及戰鬥有可辨識的正式視覺。所有權public/assets/interface/**、art-source/interface/**。讀08/10；manifest對G0型別。不得改UI程式或物品ID／增加技能。

目前狀態：PARTIAL。T12-01–06 已完成；T12-07 的五個VFX底稿及一次alpha修正仍有近不透明色帶，未納入manifest。T12-08–10 等待合格的五組VFX。細節見 reports/T12.md。

## 步驟

- [x] T12-01 固定圖示風格：32×32顯示、清楚輪廓、物品與裝備造型對應T10參考；透明背景，不含小字。
- [x] T12-02 生成四武器／三衣服／三帽圖示，能以形狀區分升級，不只同圖換標籤。
- [x] T12-03 生成四藥水圖示，小大與紅藍可辨；六材料與四任務物分別有圖，數量合計24。
- [x] T12-04 生成heavy-strike/sweep/iron-guard/vitality/rest-recovery五技能圖示；不把basic或敵招塞入可學技能清單。
- [x] T12-05 生成quest/portal/shop/player四marker，display小尺寸仍清楚，不含遊戲文字。
- [x] T12-06 生成panel/button三態/bar三類/slot二態皮膚；只做美術，不畫固定像素位置的整張不可互動介面。
- [ ] T12-07 生成五vfx六格透明動作圖集：heavy-strike、sweep、hit、levelup、guard，按10的key及時序，不在圖片加傷害數字。
- [ ] T12-08 建interface manifest，核對24 item keys與08逐一相符，圖格整除／動畫可用，不能缺圖時全部回同一icon。
- [ ] T12-09 檢視新圖實際縮到顯示尺寸後的可辨識、alpha、六格效果是否連續。只修失敗組，不反覆截整個遊戲。
- [ ] T12-10 runtime檔入public/assets/interface，原稿／prompt入art-source，預算6MiB。report列完整keys與formal/temporary狀態，提早交藥水／劍／UI基本框給T08。

完成：清單齊全、manifest可解析、技能效果有動作而非單張白光；文字由UI繪製，任何按鈕行為不是本包負責。
