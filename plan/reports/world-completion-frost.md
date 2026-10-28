# Plan16 W03・霜雪收尾彙整

**本輪已收束：新增q21／q11閉環、航標新位置與真q08出航已有實證；舊q09滿數交付／q10整鏈未重演，保持PARTIAL，不當未改核心的新實作缺口。** 最後q09active／霜牙3/6，HP679／MP98／金5206；raw SHA `8226fe89e8a85dc5493046e5882bc8fcbd357628666a378a0e8674a092b9136a`，詳[最小驗證收束報告](world-completion-frost-finish.md)。QA session、profile Chrome、server32480與4176／4177均已關，原q08檔及全部profile/證據保留。下方「繼續中」為先前階段，不再自動刷舊任務。

## b18 q09／q10 最新進度（2026-10-27）

Frost q09／q10 仍為 **PARTIAL**，不屬完整正常閉環PASS。b18本次最後HUD顯示q09 active、霜牙3/6、金幣5206、HP679/712且暫停；exact live raw確認背包霜牙3、q10缺省，format5 Frostshore、MP98。q09未ready／claimed，q10未接取／重演，q11未到達。根指示完成已開始的短段後停止，且已關閉該專用Playwright session與server；詳[專屬續報](world-completion-frost-finish.md)及[q09／q10報告](world-completion-frost-q09q10.md)。既有q11／q21／Guardian證據未重做且仍限原報告範圍。

2026-10-27。**SOURCE_READY／Q21與Q11_TARGETED_BROWSER_PASS**；保留影像及未重驗範圍，不宣稱從零連續通關。

後續 W03-02 有界修正已完成：航標移至既有高台 `(1770,430)`，精確 validator 同步；5相關案例、content與tsc通過。beta20正常爬梯／調查成功，原Sol確認唯一1280構圖名稱完整避手帳、石碑接平台／梯頂關係合理，不需新素材。詳[位置修正](world-completion-marker-readability.md)及[新圖結論](world-completion-marker-visual-beta20.md)。下表舊beta19名稱PARTIAL是歷史觀察，本構圖已補正；不外推其他尺寸／視角。

| 地圖 | 本期結果 | 證據與限制 |
| --- | --- | --- |
| 雪痕海岸 | 雪芽提供q21、清楚說明q11領獎後的沙海出航；已正常手動領q21及q11 | [最後操作報告](world-completion-frost-final.md)：q21增加500金／紅3藍2；q11增加2000金／冰潮長鋒1，兩者claimed保留 |
| 霜松隘道 | 既有梯子／高台航標可正常抵達、調查並返程 | q21正常inspect／手動領獎沿用beta19；beta20移至1770後再正常調查counter1，同Sol確認本1280構圖名稱完整避手帳／接地合理。舊beta19遮擋記錄保留作修正來源 |
| 冰潮洞窟 | 正常入圖、見預警／確認首擊命中、同一次attempt勝利、正常西返雪芽領q11 | Sol見守望獸專屬血條及白色傷害數字；q11 counter0→1再claimed，沒有把MP消耗／按鍵數當命中；不量包含暫停的戰鬥時長 |

q11領獎後已實際從海岸東門進琥珀砂岸，原Sol確認新live profile的沙海地形／人物可見；原始檢查點 `output/playwright/world-frost-beta19-b6/q11-claimed-sand-seam.raw.json` SHA `e311d8fe7a47c4c42902f09dda43110bd87f4f80ed168753aca40b9c181a7063`，q11／q21 claimed、9850金、HP653／MP26、紅18藍20。此檔與profile保留，未覆寫正常玩家q08原件。

本輪fresh b15已從正常q08原始format4檔的逐字副本，在獨立empty profile明確備份升級後正常Continue：赤岩山徑→古礦入口→守衛祭壇→雪痕海岸，沒有重打Guardian。首次Frostshore／left raw SHA `7c4e2a6095df028de4b4ada0c68809c23372b2d75e19e0b07f29ce130b73dfb2`，HP493／MP86／金5056／紅藍各9，q08claimed且q09／q10尚未接。q08→霜雪實際接縫已補；q09／q10正常操作繼續中，見[專屬續報](world-completion-frost-q09q10.md)。原件及format4備份SHA均仍為 `d257d1382d915523918b93a411a2f04490e48aabb3c166403cf32088aec490ed`。

q09／q10既有採集／擊殺及消耗規則未改，沿用[內容核心案例](world-completion-region-content.md)與[世界基線](world-completion-baseline.md)；沒有另外重演完整採集、出售或從q08開始的連續流程。高台任務不成為q10／q11或跨區門檻，相關獨立性、封頂及一次領獎由focused cases涵蓋。素材判斷詳[原Sol報告](world-completion-visual-review.md)。

W03-03配置核對：洞窟西返門位於地面x100，首隻普通蟹巡邏460–660，首領巡邏1770–2050，沒有把普通怪或首領生成在西入口。既有正常入圖／向東接近／Sol確認專屬首領與可見攻擊提示／勝利西返結果可沿用；本期沒有證據要求移生成點、巡邏或修改兩招。此為配置與既有實測對照，不宣稱已量精確預警毫秒或全程無受擊。

此彙整只對照已完成報告，沒有新增遊戲修改、測試、build、browser或pack。午後使用者恢復後由新Luna從Sand接既有W04，霜雪已完成步驟不重做；當前所有權與服務狀態以[即時交接](world-completion-live-handoff.md)為準。
