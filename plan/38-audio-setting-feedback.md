# 38・基礎體驗：靜音與零音量設定說明

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan37交接](reports/plan37-handoff.md)完成後執行；唯一現況見[status](status.md#current-state)。

主代理讀index.ts的settings builder／onInput／onChange與audio-controller gain設定：靜音與各slider分開保存，改slider不會清muted；總音量0會讓其他channel即使非0仍為0。現有頁面沒有共同說明。本批只呈現已提交的settings狀態，不改音訊控制／設定資料／事件；拖動中的百分比仍由原onInput更新，說明在原change/view render後更新。

## W01・全新Luna Max UI單owner

唯一可寫index.ts buildSettingsPanel的mute button／說明／三個slider aria-describedby、新plan/reports/plan38-audio-ui.md。

抽出原makeButton為muteButton，原文字／title／class／action不變，追加aria-describedby='brightwood-first-oath-audio-settings-note'。其後新增p.ms-panel-note同id，文字依序選第一個符合條件：

1. settings.muted：「目前已靜音；調整音量不會解除靜音，可按「開啟音效」。」
2. masterVolume===0：「總音量為 0%；如需聲音，請調高總音量。」
3. musicVolume===0且sfxVolume===0：「音樂與音效音量均為 0%；可分別調高需要的音量。」
4. musicVolume===0：「音樂音量為 0%；音效保留目前設定。」
5. sfxVolume===0：「音效音量為 0%；音樂保留目前設定。」
6. 其他：「總音量會共同控制音樂與音效；靜音不會清除滑桿設定。」

在builder本地if/else選文字，不另造helper／model／tests。p置mute button後、volumeGrid前，以textContent/makeElement，不innerHTML、不role／aria-live／hidden。三slider追加同aria-describedby；原aria-label／valuetext／data／focus／minmaxstep／值／label皆保留。原onInput/onChange/settings-mute handler、audio-controller、signature、state、CSS、存檔、音樂資源不改。不聲稱可實際播放、聲音已測或雲端已保存。

只一次完整指定Node24.22.1 tsc --noEmit，root讀全部局部diff；純呈現不加tests／DOM／browser。真拖動／change／讀屏／版面／音訊未驗。

## W02・全新Luna Max候選

W01審閱後核高於beta44未用版本與新目錄，只metadata版本、新artifacts/plan38-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp及新plan/reports/plan38-candidate.md。一次指定Node24.22.1 build／固定tools1.2.0 pack／完整ZIP validate／Python311完整路徑audit。只複製前批audit至新tmp並替換所有plan／tmp／version；artifact由Path元件組成，不能要求源码存在連續路徑字串而誤判。核組成後resolvedpaths，不硬猜字串次數；讀lock用Python或-AsHashtable。每步即存原命令／輸出／exit，不重跑成功checks，舊成品唯讀。列六版本metadata、SHA/counts、有限8patterns文字scan及binary未掃範圍。不得tests／tsc／browser／server重跑。

## W03・主代理交接及保留

新plan/reports/plan38-handoff.md與Plan/status/README，一次文件引用檢查，完成後才開下一Plan。新說明不代表真audio／iframe／平台驗收。

主代理本批完整網讀Playroom範本、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs123–126，完整尾段無失敗）。適用固定身分／存檔相容／相對路徑與iframe／新候選不覆寫；保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0。無.codegraph，保留dirty、HEAD a20f4ac、真資料／profiles／舊候選。不commit／push／tag／Release／發布／額外排程，不例行重試0x6D。02:40已刪除，07:50保留。
