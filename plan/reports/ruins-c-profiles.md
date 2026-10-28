# C：司鐘者三張共用姿勢參考

日期：2026-10-25（香港時間）。狀態：**完成，可交給 motion/action 姿勢批次重用**。本批只新增 `art-source/ruins-c/profiles/` 來源圖、prompt、metadata 與本報告；沒有改 `public/`、manifest 或程式。

## 規格與本批驗收

- 已閱讀專案 `AGENTS.md`、`plan/14-ruins-bell-sanctum.md`、imagegen 技能。依派工指示，主代理已完整網路讀取 Playroom 模板及其七份規格；來源與適用要求記於 [`ruins-c-dispatch.md`](ruins-c-dispatch.md)，本批沿用該完整閱讀紀錄。
- 適用 plan14：全朝右、完整四足機關與四個可辨足部、白石面具、青銅支架與懸鐘；idle、垂鐘重擊 active、低鳴橫掃 active 三姿勢必須可辨。原稿與完整 prompt/source metadata 留在 `art-source`。
- 驗收：保留三張透明原稿；三張 normalized 同用一個縮放比例，輸出192×192 RGBA；alpha>0 最低像素落於y=188，x中心96，四邊各至少3px透明；不能裁掉肢體或以搬動重複圖冒充新動作。

## 三張可重用參考

| 姿勢 | 參考內容 | 原稿 | 192×192 normalized | 原稿 SHA-256 |
| --- | --- | --- | --- | --- |
| `idle-0` | 朝右中性站姿；青銅框架下懸單鐘，四足著地。從被停止 owner 的指定 session 原樣恢復，未重生。 | `art-source/ruins-c/profiles/ruins-bell-keeper-idle-0.png` | `art-source/ruins-c/profiles/normalized/ruins-bell-keeper-idle-0.png` | `EDB67C5BC556A7A0953610AFF549766F7F9011193D5F289C21525E2DE7C30551` |
| `slam-active` | 低蹲支撐、框架壓低，懸鐘垂直落至低位，表現重擊 active。 | `art-source/ruins-c/profiles/ruins-bell-keeper-slam-active.png` | `art-source/ruins-c/profiles/normalized/ruins-bell-keeper-slam-active.png` | `932BDB057305318BE71EBF48478BD8FACF47DAF1D7D97930EF3DB0C893648C4A` |
| `sweep-active` | 身體前傾，鐘口朝右並低位橫掃；與垂直重擊姿勢不同。 | `art-source/ruins-c/profiles/ruins-bell-keeper-sweep-active.png` | `art-source/ruins-c/profiles/normalized/ruins-bell-keeper-sweep-active.png` | `2C32C490942C215D6E99CB53FCBA4CAE8C873E8EB38C2FCAB5076C30F7F0277E` |

三張 normalized SHA-256 依序為 `b84e99a7c09ec79bd249c1181f4759d4d6cdbf8541211c9bc892cd66bbd9df41`、`bea8cf5e3da93ea2bd74d24682e0cbfbcbe112af9870c89027093267a81ba6d6`、`bf2fa533873c01f3ed6742442a27b66aa62cceb8807a2b0cfc7e64ed18b9d975`。

## 來源、prompt 與標準化

- 詳細 savedPath、UTC、session、image-result item ID、外層 exec call ID、input／revised prompt 路徑與雜湊、原稿及 normalized 雜湊均記於 [`ruins-c-bell-keeper-profiles.json`](../../art-source/ruins-c/profiles/metadata/ruins-c-bell-keeper-profiles.json)。idle prompt 在 `prompts/ruins-bell-keeper-idle-0.txt`；active prompts 與工具回傳 revised prompt 分別保存在 `prompts/` 的對應 `.txt` 及 `.revised.txt`。
- idle 原稿來源是精確 session `rollout-2026-10-25T15-28-12-01a171f5-bc1f-7680-9299-41cbbedc9061.jsonl` 的 image item `exec-86483269-0e2f-4b5e-8503-55e7078e1394`；其 revisedPrompt **存在**，且與既存輸入 prompt 完全相同。這更正了先前派工摘要的「revisedPrompt缺失」。被停止的 owner 曾在 `apply_patch` 輸入中嘗試寫入含 base64 的 `JSON.stringify(image_url)` 大字串而卡住；本批依精確 savedPath 複製原圖，沒有把 data URI 寫入工具輸入或 repository。
- 三張原稿均為1254×1254 RGBA、透明背景；複製後 SHA-256 與各自指定 savedPath 原檔逐一比對相同。原稿保持不變。
- Normalized 使用同一比例 `188/1254` 將整張原稿以 premultiplied-alpha LANCZOS 縮至188×188，再無裁切地放置於192×192透明畫布；只將 alpha<8 的低 alpha 尾點清為全透明。平移量為 idle `(2,22)`、slam `(2,26)`、sweep `(2,31)`。alpha>0 bounds 分別為`[6,57,186,189]`、`[5,86,188,189]`、`[3,78,189,189]`；各自中心 x=96、最低非透明列 y=188，透明邊界分別至少`[左6,上57,右6,下3]`、`[左5,上86,右4,下3]`、`[左3,上78,右3,下3]`像素。

## 檢視與下一步

- 已逐張以中性灰合成的1000px、JPEG品質70縮圖檢視原稿；四足、面具、懸鐘與身份一致可辨，slam低蹲／垂鐘、sweep朝右低位橫擺可與idle區別。另檢視192格 normalized 的1176×384接觸表；三格均完整落在框內，動作差異仍可讀。檢視用JPEG縮圖未保留為交付資產。
- 已核對原稿與指定生成來源SHA相同，normalized的RGBA尺寸、alpha>0 bounds及邊界條件符合plan14。此為素材批次，未執行程式測試、build、瀏覽器或發布檢查；也未聲稱這些項目通過。
- 下游 motion/action owner 可直接以 `normalized/` 三張作 identity anchors；組裝 owner 可依本 metadata 追溯原稿、prompt、來源與雜湊。
