# Plan27 W01・AP 能力預覽

## 範圍與來源

依 `plan/27-ap-allocation-preview.md` 的共用判定契約新增 `src/ui/ap-allocation-preview.ts`。helper 只呼叫既有 `applyProgressAction` 的 `allocateAp`，保留 domain 的錯誤 `code`／`message`；成功時以既有 `deriveStats` 產生加點前後快照及剩餘 AP，不回傳 domain draft player，也不修改輸入或派送操作。

聚焦案例放在新檔 `tests/ap-allocation-preview.test.ts`，共六組：力量 +1／+5／全部 AP、敏捷防禦門檻、暴擊上限、無效量與 AP 不足、安全整數溢出，以及裝備與被動技能影響。成功與失敗路徑都檢查輸入未變且預覽不提供 player。

## 進度與驗證

- 已讀：repo `AGENTS.md`、Plan27、本批已由主代理完整讀取的 Playroom 範本及七份線上規格；並讀取 progression、contracts 與既有 preview 實作作為 API 參考。
- 本批只新增 helper、focused test 與本報告；未改其他檔案。
- 驗證命令：`& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/ap-allocation-preview.test.ts`
- 結果：exit code 0；1 個 test file 通過，6 個 tests 通過（Vitest 5.0.5，809 ms）。

## 交接

W01 已提交 root 審閱 helper 與 focused case。待審閱；UI 整合仍待 W02，尚未由此批驗證 UI、TypeScript 全專案、build 或瀏覽器行為。
