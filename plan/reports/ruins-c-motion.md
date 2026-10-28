# C：司鐘者 motion frames 恢復與驗收

日期：2026-10-25（香港時間）。狀態：**7 個姿勢已接收，可交給 assembly owner**。

## 規格與驗收

已讀取 `AGENTS.md`、`plan/14-ruins-bell-sanctum.md`、`plan/reports/ruins-c-dispatch.md`、`plan/reports/ruins-c-profiles.md`、三張 profile 的 `art-source/ruins-c/profiles/metadata/ruins-c-bell-keeper-profiles.json`，以及 ImageGen `SKILL.md`。dispatch 記錄主代理已完整閱讀 Playroom 模板與七份線上規格。

適用要求：沿用同一個朝右的四足機關司鐘者 identity（青銅支架、白石面具、單一懸鐘）；idle-1 和 walk-0..5 必須是不同的真實姿勢；所有四足與腳掌完整、透明背景；192×192 RGBA 不裁肢體、alpha>0 bounds 中心與 x=96 的差不超過 0.5px、最低可見列 y=188、四邊至少 3px 透明。原稿、實際 prompt、ImageGen 來源與逐格 SHA 留在本子目錄。驗收包含單張檢視、walk 六格接觸表，以及 normalized alpha/hash 檢查。

共用 identity anchors 沿用既有三張原稿：`art-source/ruins-c/profiles/ruins-bell-keeper-idle-0.png`、`ruins-bell-keeper-slam-active.png`、`ruins-bell-keeper-sweep-active.png`。本批沒有改 `public/`、manifest 或程式。

## 接收姿勢

所有 raw 與 normalized SHA、實際 `savedPath`、ImageGen item ID、外層 call ID、完整實際 prompt 路徑和候選 metadata 都記在 [`accepted-frames.json`](../../art-source/ruins-c/motion-frames/metadata/accepted-frames.json)。下表列出最終 raw 原稿與 assembly 使用的 canonical normalized 圖。walk-1 與 walk-3 是從版本候選升格；被取代的正規化稿已保存在 `normalized/rejected/`。

| Pose | 選定候選 | Raw source | Canonical normalized | Raw SHA-256 | Normalized SHA-256 |
| --- | --- | --- | --- | --- | --- |
| `idle-1` | `v2` | `ruins-bell-keeper-idle-1-v2.png` | `ruins-bell-keeper-idle-1.png` | `e53fadc79ca70f5d21c7143688fbcd5e81991cc35f58a85f63fa25d090f44555` | `6f3523680604916f43012d7dbb527a503913c21eb09251521ea29deaa3b7f74d` |
| `walk-0` | `v1` | `ruins-bell-keeper-walk-0-v1.png` | `ruins-bell-keeper-walk-0.png` | `cf3a04f7e39291ef60596e75995fbdebb44ddc1521a5d305f25b65e5464b0150` | `b6168991735f62b5004fec37dcc6bb2dd1063df4db8d1f05642ee44b37088dd6` |
| `walk-1` | `v3` | `ruins-bell-keeper-walk-1-v3-v1.png` | `ruins-bell-keeper-walk-1.png` | `eca3a553ca75d2f1ef3152735d92a1cf5b323d0ace3dcb9a3a4f353ae96961e5` | `f0708ffbefd46a2b3b2784562acbd0e8e1d146f42dc1229f202d257de44f8b6b` |
| `walk-2` | `v1` | `ruins-bell-keeper-walk-2-v1.png` | `ruins-bell-keeper-walk-2.png` | `e5cfd37f038a9cf2b734f20e6038140020cc9c651f55b0c3a38524b8f10e152b` | `02a982600608fe0319ca9691b21be0bd12a334639d3b13a47d40425fcc9fcdc9` |
| `walk-3` | `v3` | `ruins-bell-keeper-walk-3-v3-v1.png` | `ruins-bell-keeper-walk-3.png` | `c6bb6c0666b8c6acd8dc063c387141198888f79419bf37a6c7974ead0db1f33a` | `74bc99870dde6cadbf979d4b0dbdc1672350961a6738cabed5ae059b2babfbce` |
| `walk-4` | `v1` | `ruins-bell-keeper-walk-4-v1.png` | `ruins-bell-keeper-walk-4.png` | `a42d1b01277dbcdce6b66fd9fd1c5a61dcf01b9f78fa88cd593237b358d2f02a` | `6be65a813b1f74f975c471687c94339f99ecba641891ef1fc12145dcd5f8f5b1` |
| `walk-5` | `v1` | `ruins-bell-keeper-walk-5-v1.png` | `ruins-bell-keeper-walk-5.png` | `a1576d4d61504f02089b06695f114b3db9e0e0225201c95f0cd256801625abce` | `74fb40220130375da1c5d39e80d673d14f56a7e285d1f9547cdf40a9f062a5eb` |

六格步態接觸表：[`ruins-bell-keeper-walk-cycle-q70.jpg`](../../art-source/ruins-c/motion-frames/review/ruins-bell-keeper-walk-cycle-q70.jpg)，1178×836、JPEG quality 70、中性灰底。每格在 192px 檢視仍能區分支撐、抬腳、落地與 recovery；四足分離可數。idle 比較使用既有 [`ruins-bell-keeper-idle-pair-v2-q70.jpg`](../../art-source/ruins-c/motion-frames/review/ruins-bell-keeper-idle-pair-v2-q70.jpg)，idle-1-v2 的抬起前足與鐘擺位移在 192px 仍可辨，沿用此前已接收的稿件。

## 拒收候選與 session 恢復

| 候選 | 原因 | ImageGen item ID | Metadata |
| --- | --- | --- | --- |
| `idle-1-v0` | Reject: normalized pose is too close to idle-0. | `exec-8075d3fa-a937-4e8e-a1ab-2fdf90735349` | `ruins-bell-keeper-idle-1-v0.json` |
| `idle-1-v1` | Reject: still too close to idle-0 at 192px. | `exec-39f88f5c-cf25-4df1-82de-b65565d1c9e0` | `ruins-bell-keeper-idle-1-v1.json` |
| `walk-1-v1` | Reject: fifth leg/foot beneath the bell. | `exec-43df98f5-977d-4348-9820-789e6fc916fa` | `ruins-bell-keeper-walk-1.json` |
| `walk-1-v2` | Reject: edited result still has an extra limb/foot. | `exec-1de563bd-7652-4d52-8bb4-136e37a24d10` | `ruins-bell-keeper-walk-1-v2.json` |
| `walk-3-v1` | Reject: extra center leg/foot below the bell. | `exec-406a7c0e-9635-4820-af85-401f3062e2cb` | `ruins-bell-keeper-walk-3.json` |
| `walk-3-v2` | Reject: five legs remain, including a far-right extra limb/foot. | `exec-eaecbb60-776c-42a6-ba32-0b0a05112155` | `ruins-bell-keeper-walk-3-v2.json` |

walk-1-v3 從指定舊 session `01a1720e-f000-73e2-9553-7cd17539d3b4` 的 item `exec-80667417-7333-4962-af64-50d855db2ff5` 恢復；先前 raw 與 normalized 已存在，SHA 已與 item 的 exact `savedPath` 原稿比對，視檢確認四足，因此直接接收，沒有重生。該次外層 exec 在 ImageGen 成功後被用量中斷，session item 保留 revised prompt、savedPath 與外層 call ID，但原 wrapper `output_hint` 未保存；metadata 已如實標為 unavailable，不猜補內容。

walk-3-v1 因鐘下中心多一隻腿而拒收。精確檢查同一舊 session 確認既有 `walk-3-v2.txt` 只有修正 prompt，沒有 v2 圖片結果，因此按該 prompt 生成 v2；v2 仍有五隻腳，拒收並保留。新建 `walk-3-v3.txt` 只針對 far-right 多餘前肢修正，最終稿保留兩前兩後四條完整腿，接收。walk-4 與 walk-5 使用原有姿勢 prompt，均保留完整四足並呈現不同的對側落地／回復階段。

Walk-0/2、idle-1-v2 與所有新輸出均保留完整 actual prompt；逐一 metadata 記錄工具修訂 prompt 是否與送出 prompt 相同。新輸出以 built-in ImageGen、`transparent_background: true` 生成，output_hint 已保存在 `metadata/*-output-hint.txt`。源 prompt 位於 `prompts/`，工具實際 revised prompt 位於對應 `*-actual.txt`。

## 標準化與檢查

使用 `tools/process-motion.py` 對原稿做 deterministic 全畫布等比縮放，premultiplied-alpha Lanczos、清除 alpha<8 尾點，不裁切，再定位到 192×192。接收集逐張核對 RGBA 尺寸、alpha bounds、四邊透明 margin、y=188 最低可見列、bbox center 與 x=96 相差不超過 0.5px，canonical normalized SHA 與候選 SHA 相同，且每張 workspace raw SHA 與來源 savedPath 相同。

另以中性底 JPEG quality 70 檢視 raw 的四足、面具、支架、單鐘與 walk 姿勢差異；接觸表限制在 1280px 長邊。未執行 game tests、typecheck、build 或 browser 檢查：本批只交付原始圖像素材，依專案指示不跑無關程式檢查。

下游 assembly 可直接使用 `normalized/ruins-bell-keeper-idle-1.png` 與 `normalized/ruins-bell-keeper-walk-0.png` 至 `walk-5.png`；逐格來源和 SHA 請讀 `metadata/accepted-frames.json`。
