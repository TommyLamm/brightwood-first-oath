# 清空後不重新啟動舊按住輸入 — beta.83

2026-11-06 03:05 HKT，本機`1.0.0-beta.83`，`dist/`已建置，未發布。

唯讀直接重現：ArrowRight首次按下→releaseAll→repeat keydown，原本isHeld由false又變true。KeyboardInputState會在repeat判斷前加heldCodes，可能重新啟動暫停／失焦／換圖／重綁已清掉的狀態。

現在先處理repeat再加held；已綁定鍵仍阻止瀏覽器預設，原本已按住的狀態保持，清空後要有新的keydown才重啟。沒有改鍵位、攻速或移動速度。

開工前03:01 HKT重新經網路取得Playroom範本與七份規格，8/8與已完整讀全文一致。ID／相對資源／SDK及可讀1–5寫5未變。

Node24.22.1：`key-bindings.test.ts`9/9、typecheck／build通過。新增覆蓋移動、右Ctrl、拾取、右Alt在清空／repeat／新按下後的狀態與重綁身份；舊正常長按與焦點／文字輸入案例保留。未新增browser／真OS事件驗收、content、全回歸、ZIP或平台檢查。現象重現是模型事件序列，不當成OS實機證據。
