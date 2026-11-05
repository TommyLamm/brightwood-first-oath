# Plan52 剩餘素材與 NPC 對齊（beta.66）

2026-11-05，內建 imagegen，沒有 CLI/API fallback。19 份原生輸出已完整複製到此目錄，原生檔仍保留於 Codex generated_images。

- [生成紀錄](generation-record.json)：每份原稿的實際 nativePath、工作區路徑、SHA-256、輸入圖、完整 prompt 及透明設定。旁邊 `.prompt.txt` 與 `jobs.json` 保留同一組實際指令。
- [匯出器](export.py)：4 組平台／攀爬、6 張地面、5 張中景。沿用既有 premultiplied resize／接縫工具，沒有用程式繪製創作內容。
- [素材報告](export-report.json)：19 張 runtime 的尺寸、成本、來源與匯出 hash。
- [NPC 對齊器](align-npcs.py)及[結果](npc-alignment-report.json)：不生成新角色，只將第二格作整數水平位移；第一格、尺寸、pivot、格序與350ms節拍不變。修正7位，保留3位小於1邏輯px的自然姿勢差異及靜態石碑。
- `*-manifest-before.json`、`baseline.json` 記錄 beta.65 契約與玩法基線。不要重跑更早批次 exporter 來覆蓋這一版。

## 素材選擇與匯出

地面512×512／顯示128×128；平台640×96、5格／顯示64×48；攀爬192×64、3格／顯示32×32。地面原稿上方產生的背景條帶以明確來源座標裁除，實心材質頂部對齊既有站立線；左右邊緣作小範圍接縫處理。

中景原稿實際為2172×724，**沒有達到prompt要求的3840寬**。匯出1920×540，仍為1×邏輯密度；改善來自重新繪製的葉片、岩層、石刻與木材細節，不能稱為2×解析度提升。完整橫向構圖保留，裝飾帶對齊原有高度：雪岸150px，其餘180px；下方保持全透明。主要物件及留白方向延續，但不是像素相同的輪廓。

NPC 以第一格下方15%不透明腳部作基準，搜尋第二格最合適的整數水平位移。guide +76、mentor +48、healer +70、keeper +52、merchant +49、frost-guide +112、sands-guide +22來源px；相當於原11–19邏輯px的切格偏移。沒有縮放／重畫／取消動畫；alpha≥8像素數、第一格像素、底邊及動畫契約由腳本核對。外框不能用來代替腳部註冊，招手時手臂變寬不應再被強制置中。

## 重現

```powershell
python art-source/quality-pass5-20261105/align-npcs.py
python art-source/quality-pass5-20261105/export.py
node --experimental-strip-types art-source/quality-pass5-20261105/preview-layout.mjs
python art-source/quality-pass5-20261105/preview.py
```

以上腳本只應在本批契約仍適用時重現。`prepare.py` 是建立基線的準備步驟，不是更新基線以消除檢查失敗的方法。

離線對照與10位NPC的GIF見 [output](../../output/quality-pass5-20261105/README.md)。實際驗證與未驗界線見 [交接](../../plan/reports/quality-pass5-20261105.md)。
