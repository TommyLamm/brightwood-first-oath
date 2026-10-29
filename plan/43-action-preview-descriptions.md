# 43・基礎體驗：動作預覽說明關聯

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan42](reports/plan42-handoff.md)已完成，唯一現況見[status](status.md#current-state)。

藥水／裝備／卸下／技能／素材出售的成功預覽已有可見說明，但按鈕未關聯說明；已有aria-label時不應僅依title傳達結果。本批只用aria-describedby連到原note，不改名稱、文字、版面或計算。

## W01・全新Luna Max單一UI owner

只寫src/ui/index.ts下列五個原成功note區及新plan/reports/plan43-description-ui.md。原p改成local變數，原tag／class／文字／成功條件／append順序保留；設定id後在相應button設定aria-describedby=id。

| 原note／按鈕 | 唯一id |
| --- | --- |
| 背包usePreview.ok／useButton | brightwood-first-oath-use-preview- + bagIndex |
| 背包equipmentPreview.ok／equipButton | brightwood-first-oath-equip-preview- + bagIndex |
| 裝備preview.ok／unequipButton | brightwood-first-oath-unequip-preview- + slot |
| 技能learningPreview.ok／actionButton | brightwood-first-oath-skill-preview- + skill.id |
| 商店expectedSoldStacks>0／原sell-materials按鈕 | brightwood-first-oath-material-sale-preview |

最後一項只將原makeButton原樣取為local materialSaleButton，再原位置append；有原note才設描述。其餘均沿原local button，不新增共用helper／DOM查詢。失敗分支不設指向不存在note的引用，不延伸失敗原因。不要aria-live／role／hidden／tabindex，不改任何label／aria-label／title／data（含focus key）／disabled／數值／預覽呼叫／handler／state／signature／CSS／timer／domain／存檔。五prefix互異、skill id及slot唯一、背包只一selected detail；單面板重建不保留舊引用。

只一次指定Node24.22.1 tsc --noEmit，root審五處局部diff與成對id引用；靜態屬性不新增tests／DOM／browser，不重跑helper tests。真reader／click／focus／layout未驗，不宣稱讀屏通過。

## W02・全新Luna Max候選

root審W01後用高於beta49未用版本及新目錄。只三metadata版本、新artifacts/plan43-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp及plan/reports/plan43-candidate.md。一次指定Node24.22.1 build／固定tools1.2.0 pack／完整ZIP／Python311 audit；每步即存完整命令輸出exit，成功不重跑。Plan42 audit唯讀複製新副本，以AST／Path元件核resolvedpaths。metadata用Python，勿用預設ConvertFrom-Json讀空字串key的lock。不tests／tsc／browser／server／git寫入，有限scan與binary未掃界線如實列。

## W03・主代理收束

更新本Plan、[交接](reports/plan43-handoff.md)、status及README，一次文件引用檢查；完成再開下一個明確基礎體驗Plan。

root本批完整網讀Playroom範本、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs147–150，尾段完整無失敗）。保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0、相對資源與iframe契約。根無.codegraph，dirty／HEAD a20f4ac／真資料／profiles／舊成品保全。不commit／push／tag／Release／發布／新增排程，不例行重試0x6D。02:40已刪除，07:50保留。
