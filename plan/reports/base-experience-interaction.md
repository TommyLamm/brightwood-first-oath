# B02・共用互動核心

## 範圍與來源

- 按 `AGENTS.md`、`plan/17-base-game-experience.md` §3.2、B02、§6 及 `plan/reports/base-experience-current-handoff.md` 執行。Playroom 發布規格由主代理完整閱讀並交付本包適用摘要。
- 保留既有玩法、存檔、ID、desktop、相對資源與 iframe 契約；不發布、不變更存檔格式或內容表。

## 變更

- 新增 `src/app/interaction-target.ts`，集中純互動目標選取與出入口門檻文案。
- `src/app/gameplay.ts` 的 `nearNpc` 與 `interactNearest` 改用共同 helper。Space 執行時依當前地圖與玩家位置重算目標；NPC 對 portal 的優先權、NPC／portal 各自依距離再依 ID 排序、64px 含邊界等既有規則保持不變。`nearNpc` 仍只認最近 NPC 的身份。
- `portalBlockMessage` 先檢查最低等級，再檢查任務是否已領獎，並保留舊 ready／active／available 文案；不受阻時回傳 `null`。healer 回復、merchant/shop、dialogue、portal transition 與無對象 toast 均沿用既有處理。
- 新增 `tests/interaction-target.test.ts`：範圍邊界、同類 ID tie、NPC 優先、等級優先、任務狀態文案，以及由 Space 產生 `interact` 命令後的實際 `stepGameplay` 目標與最近 NPC 任務距離案例。測試資料由 `startNewGame` 建立；ready／claimed 狀態使用既有 quest/gameplay 操作，不讀寫玩家存檔。

## B04 可用 helper

直接從 `src/app/interaction-target.js` 匯入：

```ts
export const INTERACTION_RANGE_PX: 64;
export type InteractionTarget =
  | { kind: 'npc'; placement: Readonly<MapDef['npcs'][number]> }
  | { kind: 'portal'; portal: Readonly<MapDef['portals'][number]> };
export function nearestNpcPlacement(
  map: MapDef | undefined, position: Readonly<Vec2>, radius: number,
): Readonly<MapDef['npcs'][number]> | null;
export function resolveInteractionTarget(
  map: MapDef | undefined, position: Readonly<Vec2>,
): InteractionTarget | null;
export function portalBlockMessage(
  save: SaveData, portal: Readonly<MapDef['portals'][number]>, catalog: ContentCatalog,
): string | null;
```

HUD 的基本呼叫樣本：

```ts
const target = resolveInteractionTarget(catalog.world.maps[save.location.mapId], position);
const blockedMessage = target?.kind === 'portal'
  ? portalBlockMessage(save, target.portal, catalog)
  : null;
```

NPC 的穩定 key 可用 `npc:${target.placement.npcId}`；portal 可用 `portal:${target.portal.id}`。NPC 名稱由 `catalog.world.npcs[target.placement.npcId]?.name` 取得；目的地名稱由 `catalog.world.maps[target.portal.targetMapId]?.name` 取得。

## 驗證

- Node：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --version` → `v24.22.1`。
- 實際執行：

  ```powershell
  & 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/interaction-target.test.ts --exclude '**/.worktrees/**'
  ```

- 結果：1 個測試檔、13 個測試全數通過，耗時 574ms。
- 未執行全域 typecheck、browser、service、build、content check、pack 或 release 驗證，符合 B02 範圍。

## 保留與後續

- 開工前工作樹已有大量 dirty／untracked 檔案；只增改本包 helper、gameplay 指定函式、測試與本報告，沒有 reset 既有變更。
- 未改內容、素材、版本、manifest、存檔程式、候選包、`dist`、ZIP、profile 或真玩家存檔。
- B04 可直接使用上述 exports；browser/HUD 整合由 B04 負責。若需撤回本包，移除 helper 與測試，並將 `nearNpc`／`interactNearest` 接線還原即可。
