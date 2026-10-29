# Plan 35 候選成品

版本 `1.0.0-beta.42`，ID `brightwood-first-oath`。新成品位於 `artifacts/plan35-1.0.0-beta.42/`，使用 tools 1.2.0；未覆寫既有候選。

## 正式步驟

1. Build，Node v24.22.1，exit 0：

   ```powershell
   $nodeExe = 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
   $env:PATH = "$(Split-Path -Parent $nodeExe);$env:PATH"
   $nodeVersion = & $nodeExe --version
   if ($nodeVersion -ne 'v24.22.1') { throw "Expected Node v24.22.1, got $nodeVersion" }
   & $nodeExe .\node_modules\vite\bin\vite.js build --outDir artifacts/plan35-1.0.0-beta.42/dist
   exit $LASTEXITCODE
   ```

2. Pack，exit 0：

   ```powershell
   $nodeExe = 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
   $env:PATH = "$(Split-Path -Parent $nodeExe);$env:PATH"
   & $nodeExe .\tools\playroom\pack.mjs artifacts/plan35-1.0.0-beta.42/dist artifacts/plan35-1.0.0-beta.42/game.zip
   exit $LASTEXITCODE
   ```

3. Validate 完整 ZIP，exit 0：

   ```powershell
   $nodeExe = 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
   $env:PATH = "$(Split-Path -Parent $nodeExe);$env:PATH"
   & $nodeExe .\tools\playroom\validate.mjs artifacts/plan35-1.0.0-beta.42/game.zip
   exit $LASTEXITCODE
   ```
4. Python 3.11 audit，exit 0：`& 'C:\Users\Tommy\AppData\Local\Programs\Python\Python311\python.exe' .playroom/tmp/plan35-candidate-beta42/audit_candidate.py`。

## 結果

- ZIP：131,527,297 bytes；274 entries；SHA-256 `a993bf40992be64e724590eb22845b1b803b0f691fc76d9e69754545d4afbda4`。
- dist：274 files、135,749,311 bytes；manifest SHA-256 `b49c82b4ede99e2c3811e0bdeac900f53c1408249eea6e6288f226d8b5138cf7`。
- source manifest：427 files、135,755,315 bytes；SHA-256 `28a05eeec4746ebef0d19e97d94c5b5015f46687ff142d3921cc0c2d97262a44`。
- package、lock、source/dist/ZIP manifest 的六個版本值一致；author `TommyLamm`、ID、`desktop`、cloud save 讀 1–5／寫 5 一致。
- 有限掃描：14 個文字項目、8 組 patterns、0 命中；260 個二進位項目（133,982,337 bytes）未掃描，沒有超過文字大小門檻的項目。完整 audit 輸出：`.playroom/tmp/plan35-candidate-beta42/zip-audit.json`。
- 未重跑 focused tests／tsc；未做 browser 驗收。

## 交接補記

原owner把報告誤寫至reports/，主代理已移回本Plan指定的plan/reports/。各步工具輸出原未另存log；owner後續僅從已有tool結果補成tmp摘要，不重跑任何檢查。三次setup guard失敗（build前替換次數guard、audit前lock空root key的JSON讀取與路徑assertion）未通過的步驟與先後另記tmp/prep-notes.md，不能算正式build／pack／validate／audit失敗或重跑。保留有限文字掃描與真UI未驗界線。
