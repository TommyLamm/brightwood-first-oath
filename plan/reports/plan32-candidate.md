# Plan32 候選報告：beta.39

## 交接與範圍

原候選作業 owner 已中斷；本次只依其留下的記錄補寫報告。沒有重跑 build、pack、validate、audit、tests、tsc、瀏覽器檢查或雜湊掃描，也沒有修改 runtime、metadata 或候選 artifacts。

## 已記錄命令

| 命令 | 記錄結果 |
| --- | --- |
| `node node_modules/vite/bin/vite.js build --outDir artifacts/plan32-1.0.0-beta.39/dist` | Exit 0；Vite 記錄 77 modules transformed，build 完成。 |
| `node tools/playroom/pack.mjs artifacts/plan32-1.0.0-beta.39/dist artifacts/plan32-1.0.0-beta.39/game.zip` | Exit 0；pack log 記錄工具版本 1.2.0。 |
| `node tools/playroom/validate.mjs artifacts/plan32-1.0.0-beta.39/game.zip` | Exit 0；validate log 記錄候選有效，工具版本 1.2.0。 |
| `python .playroom/tmp/plan32-candidate-beta39/audit_candidate.py` | audit log 保存 JSON 結果，末行明確記錄 Exit code: 0；主代理續作已核讀尾段。 |

## 候選產物與 metadata

- 候選：`brightwood-first-oath`，版本 `1.0.0-beta.39`，author `TommyLamm`，id `brightwood-first-oath`。
- 裝置：`desktop`。Cloud save：可讀格式 1–5，寫入格式 5。Audit 記錄 `manifestConsistent: true`。
- ZIP：`artifacts/plan32-1.0.0-beta.39/game.zip`，131,526,954 bytes；SHA-256 `47b16fe3b6e4acef5075242bdc3b62bed2c38de61fff022dcf8686559ab55282`。
- Source inventory：425 files，135,747,480 bytes；既有 manifest SHA-256 `01bd375b4a856e2cf4c7669600a4d3b9756efdc99402ec795315a681998e1f85`。
- Dist inventory：274 files，135,748,222 bytes；既有 manifest SHA-256 `8589ee22f0ceb8789e046a8137add52193e5425b55757997ab581f6947257772`。

## Audit 範圍與限制

Audit 記錄掃描 14 個文字 entries（1,765,885 bytes）；260 個 binary entries（133,982,337 bytes）未掃描。Oversized text entries 未掃描數為 0。8 個有限 pattern 類別為 PEM private key header、AWS access key ID、Google API key、GitHub token、Slack token、Stripe secret/restricted key、quoted credential assignment，以及 JWT-like value with encoded JSON header。這些規則回報 0 findings；結論只適用於上述已掃文字內容與有限 pattern，不能代表 binary 內容或其他未涵蓋模式已檢查。

## 產物狀態

候選 artifacts 保留在新目錄 `artifacts/plan32-1.0.0-beta.39/`，建立時未覆寫既有目錄；舊候選亦保留。本次報告交接沒有 publish 或 Git 寫入。既有證據位於 `.playroom/tmp/plan32-candidate-beta39/`（build、pack、validate、audit logs 與 `zip-audit.json`）。
