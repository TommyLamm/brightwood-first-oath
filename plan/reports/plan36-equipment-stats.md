# Plan 36 W01・裝備能力預覽

2026-10-29。新增純 model `previewEquipmentStats`，以 domain 裝卸結果與 `deriveStats` 回傳裝卸前後能力，不暴露 player、不改輸入；舊 `previewEquipmentAction` 保留供現有 handler 使用。

驗收覆蓋武器替換、卸下 body 的防禦與生命上限、滿包換裝、domain 失敗原錯誤，以及 level/vitality 派生；每個成功或失敗情境均比對 player 與 rules 未變。

驗證：`& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/equipment-stats-preview.test.ts`，exit 0；1 個檔案、5 個測試通過。

未驗證：UI 顯示、排版、focus、reader 與 click 行為（屬 W02）。
