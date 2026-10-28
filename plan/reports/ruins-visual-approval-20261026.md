# 額外遺跡視覺驗收：使用者同意與分工

2026-10-26 香港17:07開始。使用者在前次說明「額外遺跡視覺驗收因fixture載入受拒而未執行」後，明確回覆：**「同意額外遺跡視覺驗收」**。本輪依此接續該具體未完成範圍，不擴至發布或重做正常主線。

## 受控測試設定

Plan15 §5原已指定：fixture先經catalog驗證，再放進自己隔離origin。此同意涵蓋這項必要測試設定：以新建專用browser context及新loopback origin，在確認empty canonical後，只載入既有已驗證fixture完整未改原字串到該origin的brightwood-first-oath:save:v1，重新載入後用正常「繼續冒險」。不使用一般玩家origin或已完成第一章的真角色checkpoint，不改任何fixture數值／旗標／時間。設定後的移動、戰鬥、暫停與重試均用正常UI。此文件是授權範圍紀錄，不能替代工具本身的批准；若再次受拒，停止該動作並保留確切原因，不另找間接載入路徑。

## 所有權與驗收

- 全新GPT-6 Luna／max／無歷史fork：boss owner專有output/playwright/ruins-boss-approved/、自己的ephemeral服務與named context；只驗遺跡首領高擊／低掃預警、半血1200ms轉場的可見過程，以及結果／正常retry無明顯舊預警。報告ruins-boss-visual-approved-20261026.md。
- 全新同設定maps owner專有output/playwright/ruins-maps-approved/、自己的服務／contexts；只補潮痕營站、盤根石道（ruins-root-causeway，派工初期曾誤稱苔石道）、誓鐘內殿短移動／地面／背景／必要resize。不重跑已有回聲長廊片段。報告ruins-maps-visual-approved-20261026.md。
- root統籌審查、維護總交接及狀態入口。最多三名子代理並行，本輪兩名；影像與長log留workspace，必要AI審圖一次1–2張小型JPEG。

固定SUT artifacts/overnight-20261026/portal-labels/dist：brightwood-first-oath 1.0.0-beta.18、desktop、schema2、read1–4/write4；bundle assets/index-BPLc23-E.js SHA 1c26346100c38d09beee5b7cc331210e29274ba1dc757c67021d9b3c302e6cab。保留所有dirty work與舊存檔。沒有source變更就不重build／tests／pack；不改凍結平衡、不重測約18秒時長樣本，不commit／push／Release或平台上架。

root於17:07起以網路工具完整讀模板及七份main規格，補齊全部截尾：templates/game-agent-template.md、docs/game-development.md、docs/command-contracts.md、templates/game.schema.json、templates/game-release.yml、examples/starter/playroom-sdk.js、docs/sdk-versioning.md、docs/save-compatibility.md（皆https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/）。已讀Playwright skill並確認npx存在；.codegraph不存在。線上規格由root轉述，子代理無須重讀。

只將可見UI／實際圖像所支持的範圍寫通過，不把截圖當sub-frame精確清理、可聽音訊、正式平台／雲端／原生全螢幕證據。完成後核自己PID命令列與ports再清理，started與stopped紀錄分開保留。

## 已執行的設定（進行中）

兩名owner都已在本輪正常獲准的工具呼叫完成各自空白隔離origin設定，沒有沿用前輪受拒命令的間接替代：

- maps：PID328，parent65520／camp65521；q18-full-bag-ready原文5957B，讀回相同。其餘地圖依序使用另外的專用origin／context，完成一圖即關該context。
- boss：PID25376，parent60187／game60188，named session ruins-boss-approved-20261026；boss-retry-ready 3514B，SHA dcfd40ac7b555a3d0e1bd0887656ca1d41ee9bea968a168843f5784cc8cc504a，seed及reload後均原文相同，正常Continue顯示HP712/712、MP98/98。

本輪新同意後的設定已成功，前輪「seed受拒而未驗」僅是歷史結果；畫面驗收仍待owner提交證據，不能以seed成功當視覺PASS。

收尾更新：[最終交接](ruins-visual-handoff-20261026.md)已記三圖限定片段、首領兩種預警／半血轉場的可見證據；本次戰鬥以死亡結束，未新增勝利後retry清理PASS。兩名owner已關全部自有context／錄影／服務，process與listeners皆確認消失。沒有程式或封包修改，未重build／tests／pack或發布。
