# Plan 36 候選成品：1.0.0-beta.43

- 遊戲：`brightwood-first-oath`；作者：`TommyLamm`；裝置：`desktop`。
- 成品目錄：`artifacts/plan36-1.0.0-beta.43/`；固定驗證工具：1.2.0。
- 六處版本一致：`package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json`、`dist/game.json`、ZIP 內 `game.json` 均為 `1.0.0-beta.43`。三份遊戲 manifest 的作者、ID、裝置、雲端存檔宣告亦一致：`TommyLamm`、`brightwood-first-oath`、`["desktop"]`、讀取格式 1–5／寫入格式 5。

## 成品與雜湊

- ZIP：131,527,456 bytes；SHA-256 `d66953a8d020595abe249b073d31de2b6350ac1f97cf7225861aa81ce1312ae8`；274 entries，解壓 135,749,926 bytes。
- Source manifest：429 files、135,765,263 bytes；`source-files.sha256` SHA-256 `08c28bf289992a613f60df857250963f0aa71823594ec552f6912a0328c82b2c`。
- Dist manifest：274 files、135,749,926 bytes；`dist-files.sha256` SHA-256 `f9ef479159479cc0c3a2de6015143db92c39344150955ad72fa31feb6de29deb`。

## 執行結果

| 步驟 | 執行環境／命令 | Exit |
| --- | --- | ---: |
| Build | Node 24.22.1；Vite build 至新 dist | 0 |
| Pack | Node 24.22.1；`tools/playroom/pack.mjs` | 0 |
| Validate | Node 24.22.1；`tools/playroom/validate.mjs` 完整 ZIP 驗證 | 0 |
| Audit | Python 3.11.9；本批 `audit_candidate.py` | 0 |

Audit 掃描 14 個文字 entries（1,767,589 bytes），比對 8 類固定文字 pattern，finding 為 0；260 個 binary entries（133,982,337 bytes）未掃描，沒有超過文字掃描上限的項目。這是有限文字掃描，不代表 binary 掃描。

瀏覽器、iframe、遊戲操作與畫面驗收未執行。未建立 tag、未發布。完整命令與原始輸出見 `.playroom/tmp/plan36-candidate-beta43/` 日誌；`py -3.11` launcher 未列出安裝版本，改用 Python 3.11.9 完整路徑完成 audit。