# beta.18 封包交接

香港2026-10-26 07:03。**SOURCE_READY／ZIP_VALIDATED；LOCAL_BROWSER_PARTIAL；未發布。** 主代理整理已完成的fresh Luna Max封包owner證據；沒有為此重跑任何檢查。

`brightwood-first-oath` v`1.0.0-beta.18`，schema2、讀1–4寫4、desktop不變。最新來源只補傳點目的地文字，沒有更改通行／任務／存檔／數值；[source及必要視檢報告](overnight-portal-labels-20261026.md)。

- Source：341 files／134,994,082 bytes，manifest SHA `afe0a07312bb9378c64cc15c9ca24ccd3b40cb05d58a3e20b1ef8483408d6ee6`。
- Frozen dist：`artifacts/overnight-20261026/portal-labels/dist/`，274 files／135,705,260 bytes，manifest SHA `8c965c1835e938e1ff54d79c377f2088d08be564077c3be64c766086f4f62857`。
- ZIP：[game-beta18.zip](../../artifacts/overnight-20261026/beta18-package/game-beta18.zip)，131,514,190 bytes，274 entries，解壓135,705,260 bytes，cover133,001 bytes。SHA `779361b5dedbf1a39465d5775a82ec08da920d1c77bb3afa01b26c6e72896f87`。
- Node24.22.1、固定Playroom tools1.2.0；archive SHA `24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022`與逐檔metadata相符。官方pack／完整validate各一次exit0，封包後source／dist manifest仍MATCH。
- ZIP逐檔路徑／bytes／SHA與frozen dist相同，無missing/extra/duplicate/unsafe/case-collision/prohibited path。限定14文字entry、1,722,923 bytes、8類pattern零命中；不是通用binary或語義secret audit。

完整方法、工具、gate、逐檔manifests及log見[artifact封包報告](../../artifacts/overnight-20261026/beta18-package/package-report.md)、[summary.json](../../artifacts/overnight-20261026/beta18-package/summary.json)和[驗收摘要](../../artifacts/overnight-20261026/beta18-package/acceptance-summary.md)。本次封包沒有重跑source owner已完成的typecheck、build或browser，也沒有跑測試套件。

beta.18的browser證據只限Town標示1280×720及同頁960×540視檢，沒有把beta.17從零first-run／beta.15分段遺跡流程算成beta.18全流程驗收。正式平台preview／雲端／可聽聲音／瞬時phase清理／全遊戲仍未驗。舊產物保留，沒有commit、push、tag、Release或平台發布。下一步沿用目前first-run證據，只補真正缺口；[集中交接](overnight-optimization-handoff-20261026.md)。
