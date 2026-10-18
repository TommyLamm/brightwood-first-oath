# T12：24物品圖示、技能、UI皮膚及特效

目的：UI及戰鬥有可辨識的正式視覺。所有權public/assets/interface/**、art-source/interface/**。讀08/10；manifest對G0型別。不得改UI程式或物品ID／增加技能。

目前狀態：PARTIAL。T12-01–06 已完成。獨立六格VFX中，sweep、hit、levelup、guard 已通過尺寸、alpha及辨識檢視並加入manifest。heavy-strike 的v2、v3、fresh、v4及新v5水平六格候選均未通過透明背景／格界安全檢查。2026-10-18 的v5短促置中構圖仍有長斬擊尾、外擴碎片及低alpha背景點，且六格alpha均觸及左右格邊；拒收、僅留art-source。vfx:heavy-strike 維持 UNFINISHED 並缺於manifest。舊五列VFX底稿與修正版仍因不透明色帶拒收。T12-07–10 仍部分未完成，細節見 reports/T12.md。

## 步驟

- [x] T12-01 固定圖示風格：32×32顯示、清楚輪廓、物品與裝備造型對應T10參考；透明背景，不含小字。
- [x] T12-02 生成四武器／三衣服／三帽圖示，能以形狀區分升級，不只同圖換標籤。
- [x] T12-03 生成四藥水圖示，小大與紅藍可辨；六材料與四任務物分別有圖，數量合計24。
- [x] T12-04 生成heavy-strike/sweep/iron-guard/vitality/rest-recovery五技能圖示；不把basic或敵招塞入可學技能清單。
- [x] T12-05 生成quest/portal/shop/player四marker，display小尺寸仍清楚，不含遊戲文字。
- [x] T12-06 生成panel/button三態/bar三類/slot二態皮膚；只做美術，不畫固定像素位置的整張不可互動介面。
- [ ] T12-07 部分完成：sweep、hit、levelup、guard 四組六格透明動作圖已驗收；heavy-strike v2、v3、fresh、v4及v5構圖均未通過透明alpha／格界檢查，該項判為 UNFINISHED。heavy-strike v4修正與v5來源只保留source-only，不抽格、不進manifest。
- [ ] T12-08 部分完成：manifest 有46個圖片key及4個VFX動畫key；24個item keys不變。必需的 `vfx:heavy-strike` 尚缺，故完整包載入檢查仍不會通過。
- [ ] T12-09 部分完成：四組runtime strips 已看過逐格效果，檢查6×1切格、RGBA alpha與guard中心透明。heavy-strike v5為2172×724 RGBA、6格各362×724；alpha>0 margin在各格左右最低0px，含28,571個alpha 1–15像素且視覺仍有長光尾／外擴碎片，故不抽成runtime strip。
- [ ] T12-10 部分完成：四組runtime strips、全部ImageGen prompts、來源與透明補邊腳本已入專案；runtime interface PNG仍為3,208,165 bytes，低於6MiB。heavy-strike v2/v3、fresh、v4 attempt/repair及v5 attempt與完整prompt／hash／逐格檢查紀錄保留於source log，均未加入runtime。

完成：清單齊全、manifest可解析、技能效果有動作而非單張白光；文字由UI繪製，任何按鈕行為不是本包負責。
