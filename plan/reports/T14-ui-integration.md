# T14 UI integration follow-up

## Status

The T08 UI is connected to the app, and the `returnTown` UI/lifecycle gate now exposes ordinary outdoor return while keeping an active arena encounter disabled. T08's shared contracts are sufficient; no shared contract or UI package changes were needed.

## Specifications read

On 2026-10-18, used live web to fully read the current `templates/game-agent-template.md` and its seven listed references:

- `docs/game-development.md`
- `docs/command-contracts.md`
- `templates/game.schema.json`
- `templates/game-release.yml`
- `examples/starter/playroom-sdk.js`
- `docs/sdk-versioning.md`
- `docs/save-compatibility.md`

Also read `AGENTS.md`, `plan/09-parallel-dispatch.md`, `plan/tasks/README.md`, `plan/tasks/T14-app-integration.md`, `plan/01-game-design.md`, `plan/07-shared-contracts.md`, `plan/08-content-spec.md`, `plan/tasks/T08-ui.md`, `plan/reports/T08.md`, and `plan/reports/T14.md`.

Applicable requirements for this app integration: pass `UiSnapshot` as the UI's authoritative view; pass unsequenced `CommandDraft` through the app, which owns command sequencing; keep DOM handlers away from domain writes and persistence; preserve scene-owned load-before-transition behavior. No Playroom SDK, save protocol, manifest, packaging, or release code was changed.

## Changes

- `src/main.ts` now imports `createUi` from `src/ui/index.ts` and uses it with `(command) => app.dispatch(command)`. The existing root status surface, single Phaser game, scene setup, keyboard attach, persistence adapter, and dispose lifecycle remain in place. The UI entry imports its own `styles.css`.
- `src/app/state.ts` now sets `canReturnTown` for a live outdoor `playing` state and for an eligible `result` state. It is false in town, non-playing lifecycle screens, and a guardian arena whose result has not completed. T08 uses the same snapshot's map ID and boolean to display the arena disabled reason; `UiSnapshot` has no separate reason field, and this integration did not need one.
- `src/app/app.ts` routes `returnTown` from `playing` and `result` through the existing zero-delta lifecycle path. The gameplay arena guard still rejects the command during the encounter; valid field returns create the existing pending map transition, which the scene loads before `completeMapTransition` swaps the saved location.
- `plan/tasks/T14-app-integration.md` clarifies the T14-16 field and arena gate behavior.

Public UI entry point remains:

```ts
createUi(root: HTMLElement, dispatch: (command: CommandDraft) => void): UiController
```

`UiSnapshot` and `CommandDraft` were checked against `src/contracts/ports.ts` and `src/contracts/commands.ts`; their signatures match T08's handoff. `GameApp.dispatch` remains the only command sequence source. Keyboard text-entry and UI-focus exclusion remains in the existing app `KeyboardControls`.

## Focused checks

- `npm.cmd test -- tests/integration/app-foundation.test.ts tests/integration/app-persistence.test.ts` — passed, 2 files and 12 tests. Added coverage verifies the outdoor snapshot gate, arena lock, post-result gate, actual field-to-town app lifecycle transition, and arena rejection.
- Scoped strict TypeScript check — passed:

  ```powershell
  npm.cmd exec -- tsc --ignoreConfig --noEmit --strict --skipLibCheck --noUnusedLocals --noUnusedParameters --noFallthroughCasesInSwitch --target ES2022 --module ESNext --moduleResolution bundler --types node,vite/client --allowImportingTsExtensions src/app/index.ts src/main.ts tests/integration/app-foundation.test.ts tests/integration/app-persistence.test.ts
  ```

No full test suite, production build, browser/rendering pass, route playthrough, asset/audio validation, Playroom package validation, release, or publication was run. T14-22 asset/audio completion and T14-25 full-route acceptance remain open as recorded in the main T14 report.

## Death combat cleanup follow-up

Commit `0532f9f` changes the death path to preserve the combat ownership boundary: when HP reaches zero, player-owned attacks and cooldowns are cleared in that gameplay step while enemy-owned attacks and cooldowns remain in the dead state. While dead, only the `respawn` command is accepted, preventing a queued player action from recreating combat state. A successful respawn/map transition rebuilds combat state and clears old map-owned combat; respawn also clears the guard buff. The commit adds a focused integration test for this sequence, but the test was not executed after the change; the implementation and test are committed, not verified by a post-change functional run.

The available earlier results are a supplied focused run reported as 2 passed / 9 skipped plus a scoped strict TypeScript pass; neither was rerun after `0532f9f`. A supplied full `app-gameplay` run was reported as 10 passed / 1 failed: `rest-recovery` expected 72 HP but received 70. The cause and timing relationship to the death-cleanup change are unverified; do not label the failure pre-existing or attribute it to the change. No functional verification was run after this follow-up; the original follow-up report only planned a scoped diff/whitespace check. T14-22 asset/audio completion and T14-25 full-route acceptance remain open.
