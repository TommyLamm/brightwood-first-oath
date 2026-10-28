# Plan 15 D0 namespace handoff

## Completed

- The runtime entry and default `GameApp` identity now use `brightwood-first-oath`, matching `public/game.json`. Development and build keys remain isolated by the existing `:dev` suffix.
- When the canonical key is absent, only local standalone/guest flows inspect the same-mode `maplewood-swordsman` key. Existing canonical data always wins; malformed, unsupported, or catalog-invalid legacy data is reported as incompatible and is never treated as an empty save.
- The title UI and `createAppUi` fallback offer **匯入舊版進度** and **暫不匯入**. Deferring only hides the prompt for the current app session; it does not write or remove either key.
- Import rechecks the cloud mode, progress availability, and capabilities, then verifies that the source is unchanged and the canonical target is still absent. It copies the exact original string, verifies the copy and retained source by reading them back, and stops on conflicts or storage errors. Cloud authenticated/preview flows never offer local legacy import.
- Imported format 1–3 data remains in its original format until the next normal save; the existing format-4 write path keeps a canonical `:formatN-backup`. Legacy originals and their historical backups are left in place. No cross-tab transaction guarantee is claimed.

## Files changed

- `src/main.ts`, `src/app/app.ts`, `src/app/state.ts`, `src/app/root-ui.ts`, `src/ui/index.ts`
- `src/contracts/commands.ts`, `src/contracts/ports.ts`
- `src/persistence/index.ts`
- `tests/persistence-namespace.test.ts`, `tests/integration/app-persistence.test.ts`

No package, manifest, version, gameplay, boss, or asset files were changed for D0. Other shared workspace changes were left intact.

## Verification

Passed with Node 24.22.1:

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/persistence-namespace.test.ts tests/integration/app-persistence.test.ts --exclude '**/.worktrees/**'
```

Result: 2 test files passed, 23 tests passed. Coverage includes the manifest/default ID boundary, development/build separation, formats 1–4, source and backup retention, canonical priority, invalid current-catalog data, explicit deferral, cloud mode/progress/capability changes, generation invalidation, collisions, and exact read-back.

Not run: full typecheck, build, browser/iframe checks, unrelated regression tests, and release workflows. Cloud readiness exposes mode/progress/capabilities but no account identifier or session token; an authenticated-to-authenticated identity change is therefore not observable through the current port. Authenticated mode is categorically excluded from import, and the import action rechecks the available readiness fields immediately before copying.

No commit, push, or release was made.
