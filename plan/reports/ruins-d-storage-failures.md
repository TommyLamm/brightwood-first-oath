# Plan 15 D storage failure coverage

## Completed

- Added a storage double that throws when the canonical save key is written during explicit legacy import. The test confirms import returns `loadError`, the canonical target remains absent, and the original legacy raw value remains intact.
- Added format 1–3 coverage for an imported save whose first format-4 checkpoint encounters a different existing canonical backup. Each case confirms the canonical raw save, legacy source, and existing backup are preserved and no format-4 write occurs.
- No persistence source changes were needed; the existing failure and backup-conflict handling satisfies these cases.

## Files changed

- `tests/persistence-namespace.test.ts`

## Verification

Passed with Node 24.22.1:

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/persistence-namespace.test.ts --exclude '**/.worktrees/**'
```

Result: 1 test file passed, 21 tests passed.

Not run: app-persistence tests, typecheck, build, browser checks, and unrelated suites. No commit or push was made.
