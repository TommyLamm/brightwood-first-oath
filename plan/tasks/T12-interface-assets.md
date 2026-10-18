# T12：24物品圖示、技能、UI皮膚及特效

目的：UI及戰鬥有可辨識的正式視覺。所有權public/assets/interface/**、art-source/interface/**。讀08/10；manifest對G0型別。不得改UI程式或物品ID／增加技能。

目前狀態：PARTIAL。T12-01–06 已完成。獨立六格VFX中，sweep、hit、levelup、guard 已通過尺寸、alpha及辨識檢視並加入manifest。heavy-strike 的v2、v3、fresh、v4、v5、v6、v7及最後一次v8水平候選均不合格並只留source-only。v8雖可辨識起勢、斜向下劈、命中、左右擴散及收尾，但輸出為2172×724、3:1而非指定6:1；六格皆未達16px安全邊，有79,683個半透明像素，並有可見紅色邊緣像素。拒絕runtime，不修正、不加入manifest、不再生成。`vfx:heavy-strike` 維持UNFINISHED且缺於manifest；T12-07–10仍部分未完成，細節見reports/T12.md。

## 步驟

- [x] T12-01 固定圖示風格：32×32顯示、清楚輪廓、物品與裝備造型對應T10參考；透明背景，不含小字。
- [x] T12-02 生成四武器／三衣服／三帽圖示，能以形狀區分升級，不只同圖換標籤。
- [x] T12-03 生成四藥水圖示，小大與紅藍可辨；六材料與四任務物分別有圖，數量合計24。
- [x] T12-04 生成heavy-strike/sweep/iron-guard/vitality/rest-recovery五技能圖示；不把basic或敵招塞入可學技能清單。
- [x] T12-05 生成quest/portal/shop/player四marker，display小尺寸仍清楚，不含遊戲文字。
- [x] T12-06 生成panel/button三態/bar三類/slot二態皮膚；只做美術，不畫固定像素位置的整張不可互動介面。
- [ ] T12-07 部分完成：sweep、hit、levelup、guard 四組六格透明動作圖已驗收；heavy-strike v2、v3、fresh、v4、v5、v6、v7及最後一次v8均未通過alpha／格界／構圖要求，判為UNFINISHED。v4修正至v8來源只保留source-only，不抽格、不進manifest；本階段嘗試已結束。
- [ ] T12-08 部分完成：manifest 有46個圖片key及4個VFX動畫key；24個item keys不變。必需的 `vfx:heavy-strike` 尚缺，故完整包載入檢查仍不會通過。
- [ ] T12-09 部分完成：四組runtime strips 已看過逐格效果，檢查6×1切格、RGBA alpha與guard中心透明。最後候選v8為2172×724 RGBA、6格各362×724（3:1而非指定6:1）；逐格alpha>0 inset為`(41,154,0,66)`、`(5,53,0,84)`、`(1,31,2,34)`、`(1,166,0,64)`、`(5,92,16,66)`、`(15,335,117,98)`，全部未達16px；79,683像素為alpha 1–254，另有可見紅／粉邊緣。動畫節奏可辨，但構圖、透明度與安全邊不合格，未抽 runtime。
- [ ] T12-10 部分完成：四組runtime strips、全部ImageGen prompts、來源與透明補邊腳本已入專案；runtime interface PNG仍為3,208,165 bytes，低於6MiB。heavy-strike v2/v3、fresh、v4 attempt/repair、v5、v6、v7及v8 attempt與完整prompt／hash／逐格檢查紀錄保留於source log，均未加入runtime；因缺`vfx:heavy-strike`，素材包仍不完整。

完成：清單齊全、manifest可解析、技能效果有動作而非單張白光；文字由UI繪製，任何按鈕行為不是本包負責。
