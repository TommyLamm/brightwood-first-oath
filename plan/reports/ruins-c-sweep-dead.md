# 遠古遺跡 C：低掃／倒下姿勢恢復

日期：2026-10-25（香港時間）。狀態：**7格來源與正規化素材已交付，可交給 assembly owner**。本批只寫入 `art-source/ruins-c/sweep-dead-frames/` 與本報告；沒有改 `public/`、manifest 或程式，沒有 commit/worktree。

## 已讀規格與驗收

- 已讀專案 `AGENTS.md`、`plan/14-ruins-bell-sanctum.md` §5／§8、`plan/reports/ruins-c-dispatch.md`、`plan/reports/ruins-c-profiles.md`、imagegen skill。依 dispatch 記錄，主代理已在同一開發任務完整網路讀 Playroom 模板及其七份規格，本批沿用該閱讀紀錄。
- 適用姿勢為 cell 2／3／5 的低掃蓄力／回復，以及 cell 24–27 的四段倒下；cell 4 重用 `profiles/normalized/ruins-bell-keeper-sweep-active.png`。保持朝右、同一四足青銅機關、白石面具和懸鐘，四足完整可見，不把同圖平移當新姿勢。
- 驗收 7 張 192×192 RGBA；pivot x=96，alpha>0 最低列 y=188，四邊至少 3px 透明；保存原始 PNG、exact-session 生成紀錄、prompt/revisedPrompt、SHA 與拒稿理由。只做素材相關檢查。

## 七格交付

| cell | 姿勢 | Raw PNG SHA-256 | Normalized PNG SHA-256 | Alpha>0 bounds / 透明邊界 |
| ---: | --- | --- | --- | --- |
| 2 | `sweep-windup-0` | `29aa310d2c9e81843550ceed221cfc04827f767980d2bf377cb635c5e5c8e672` | `2e08375b3c4c15e6d7d6a67d46cd97190c18b805876c4011c09126055866396a` | `[5,67,188,189]` / L5 T67 R4 B3 |
| 3 | `sweep-windup-1` | `b305054e003cc87c69cf672ffa5060386fe8814592994e0a2101f27bcbc87f42` | `38cc912419443baccc11af80f785a1d7a7ce67703cff358c533313e54a17014a` | `[3,80,189,189]` / L3 T80 R3 B3 |
| 5 | `sweep-recovery` | `2b342314789501c6dfbaa8df78e2212d2992ed443298bc9ef3be388b7776f044` | `8764484ad121ad98f7c1d61d33ce2084e7fd33cc859d889e0afae7b534f4a884` | `[4,63,188,189]` / L4 T63 R4 B3 |
| 24 | `dead-0` | `641e5ffbde23125e52c0f6a472d7ee1c5b8c4a833774ef056bc4e84c0b77252f` | `9f8ca2ce41c31b014c7e590f1298ba9258755fae0a60284fd595667db0166ab6` | `[5,75,188,189]` / L5 T75 R4 B3 |
| 25 | `dead-1` | `dec8907ed88c4e1e50da14b226f8d4ee05f081dd7698ae8b8e04b01de615fd68` | `d8dca18166b54d5d2881186795673b9e00bf740648a168b28bf472e4095eb6e4` | `[5,90,187,189]` / L5 T90 R5 B3 |
| 26 | `dead-2` | `8114f8309cf876988146b049bc87ad11a18ec84a15f8515e4938f64e39d9950f` | `b5dffae970329f18818dae6ba882eb3dca756022ffcfc416591154bce7089212` | `[5,91,188,189]` / L5 T91 R4 B3 |
| 27 | `dead-3` | `d7aede70adf2813cf7706f11bceb65225d929c95dee890fdd4dead298f4b6134` | `a3ceb55c5b3fb31c17bcece72c96827bb61a42c60f1b01af13967480cdea2fca` | `[5,119,187,189]` / L5 T119 R5 B3 |

Normalized paths are `art-source/ruins-c/sweep-dead-frames/normalized/ruins-bell-keeper-{sweep-windup-0,sweep-windup-1,sweep-recovery,dead-0,dead-1,dead-2,dead-3}.png`. Matching unmodified-generation raws are in `raw/`.

## Exact-session recovery與選稿

來源限定為 session `01a17211-48ac-7592-abbf-af07ddf32a7d`：

- rollout：`C:/Users/Tommy/.codex/sessions/2026/10/25/rollout-2026-10-25T15-58-17-01a17211-48ac-7592-abbf-af07ddf32a7d.jsonl`
- generated images：`C:/Users/Tommy/.codex/generated_images/01a17211-48ac-7592-abbf-af07ddf32a7d/`

Metadata `metadata/ruins-c-sweep-dead-frames.json` 列出全部 11 個 imagegen 結果的外層 call ID、image item ID、savedPath、原稿 SHA、prompt 路徑／雜湊、revisedPrompt 狀態及選用決定。逐一確認 session 回傳的 revisedPrompt 存在且與輸入 prompt 完全相同；輸入 prompt 已按原文保存於相應 `prompts/`，因此 revisedPrompt 路徑與雜湊指向同一份文件，沒有重複存一份相同文字。原稿均為 1254×1254 RGBA，檔案 SHA 與 exact savedPath 來源相同。

先前未落盤的 dead-3 第三候選 `exec-aeab4a4e-4857-4b7b-bb75-cf2d98fa763b.png` 已從指定 session 原樣複製到 `raw/ruins-bell-keeper-dead-3.raw.png`。審圖可見支架比 dead-2 更低、面具和鐘口沉至足部高度，鐘仍連在支架上，四個完整足部可辨，所以選為 cell 27；沒有重新生成。dead-3 candidate-01 因比 dead-2 直立、未完成下沉而拒；candidate-02 因上框仍高於 dead-2 而拒，兩張原稿、prompt 與 review JPEG 仍保存在 `raw/rejected/`／`prompts/rejected/`。

另從 exact session 找回第一張低掃 windup 嘗試 `exec-9c3f3824-7f33-4061-aa57-df5aed3e6b7f.png`，此前未落盤。它與 candidate-01 使用相同輸入 prompt；視覺上鐘口過低、蹲姿更像 active，作為 candidate-00 保存在 `raw/rejected/`。candidate-01 的原 owner 拒稿註記同樣是太接近 active、鐘口過低。cell 2 選擇後續更精確約束「鐘保持較高、只小幅屈膝」的第三稿；cell 3、5 使用連續蓄力與回彈姿勢。四段 dead 序列從支架屈曲、鐘體下墜到低位靜止逐步收束。

## 正規化與審圖

- 原稿保留不變；使用 premultiplied RGBA LANCZOS 縮放。透明 alpha<8 尾點在縮放前後清零，再只裁掉透明 padding，未裁任何 alpha>0 像素。
- 尺寸 188/1254 為預設縮放。windup-1 使用 187/1254：以188縮放時可見寬187，無法在置中同時保留左右各3px透明邊，因此僅縮小一個像素。各正規化格仍是192×192 RGBA、中心像素x=96、最低alpha>0列y=188。
- 原稿 review JPEG 為 RGB(58,58,58)中性底、1000px長邊、quality 70。已逐批檢視有效姿勢及 dead-3 三個候選；正規化序列縮圖位於 `review/sweep-dead-normalized-sequence.jpg`（quality 70，含cell4既有參考）。

## 檢查與交接

- 已核對 11 個 exact-session savedPath、image item ID、call ID、prompt/revisedPrompt與SHA；所有復原 raw 與指定 generated image SHA 相同。
- 已檢查 7 個 normalized PNG 的尺寸、RGBA、alpha>0邊界、中心點與四邊透明距離；詳見 metadata。已目視檢查生成原稿及 normalized sequence review。
- 這是素材批次，未執行程式測試、typecheck、build、瀏覽器、manifest或發布檢查；不聲稱上述項目通過。
- Assembly owner 可取用 `normalized/` 七格，cell 4沿用 `profiles/normalized/ruins-bell-keeper-sweep-active.png`。Atlas映射及來源完整紀錄在本目錄metadata JSON。
