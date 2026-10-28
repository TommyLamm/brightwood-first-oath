# World Completion Regions Browser QA — B4 (partial)

Date: 2026-10-27 (Asia/Hong_Kong)

## Candidate and scope

- Tested only the frozen `artifacts/world-completion-beta19/dist` candidate, bundle `index-DJXQwIzk.js`; candidate ZIP SHA-256: `68644dc701fb51fa8f11d69a0698819b4cb01203c8a258d9085c37c5aca6b53b`.
- Used a separate two-origin, sandboxed parent/game harness with relative assets. No source, tests, metadata, or `dist` files were changed. No tests, build, or package were rerun.
- The Playroom template, its listed online specifications, import-recovery notes, Plan16 W03/W04, the requested region-content/UI-journal/candidate/live-handoff sections, and the Playwright skill were read before the UI run.

## Legal Frost fixture and save evidence

- Created a format-5 Frost fixture in the B4 output folder using the current quest catalog and save validator. This was a precomposed legal fixture, not a zero-to-completion run: q01–q10 claimed, q11 active, q21 absent, Frost Shore start, Lv30 Swordsman.
- Fixture: `output/playwright/world-regions-beta19-b4/frost-fixture-format5.json`, 1,311 bytes, SHA-256 `22c79aceb53082f1a160ad3b1ede2dd3345344878d59bbfbdca60c6e20fbf92b`.
- The save key was seeded only in the isolated B4 browser origin. The raw localStorage readback matched the fixture byte-for-byte by SHA, and a reload displayed the expected Frost QA Lv30 save before normal Continue.
- A separately validated Sand fixture was prepared but never loaded or played: `sand-fixture-format5.json`, SHA-256 `fc0d0cbf921a8673562fe92d741ce456584d1bebe24d3bff94dee6a384d290c1`.

## Frost UI progress and stop point

- At approximately 2026-10-26 17:41 UTC, the title screen showed “Frost QA・Lv.30 劍士・雪痕海岸”; normal Continue entered the game.
- At 17:44:50 UTC, the saved Playwright page snapshot `output/playwright/world-regions-beta19-b4/.playwright-cli/page-2026-10-26T17-44-50-443Z.yml` recorded Snowbud’s quest dialog: q11’s Frost Tide Keeper objective was 0/1 and q21’s Frost Pine Beacon objective was 0/1. The normal UI flow accepted q21; q21 was absent before this interaction. This did not complete or claim either quest.
- The player traversed the normal portal to Frost Pine Pass and was attacked during approach to the existing ladder/marker route. At approximately 17:55 UTC, the live browser snapshot showed the normal “角色倒下了” dialog, HP 0/712, MP 92/98, with “返回木葉鎮” and “返回標題”. No death-dialog action was taken. The marker, Frost boss, q11 hand-in, and Frost-to-Sand transition were not reached.
- After that pause, the named browser `world-regions-beta19-b4-host` was no longer open (`playwright-cli list` contained only another QA session, which was not touched). B4 CLI config contained headless/viewport settings only and no `--persistent` or `--profile` configuration; there is no B4 persistent user-data directory to resume. The post-q21 raw save was not captured before context loss. Therefore q21/HP/location after the death cannot be claimed or reconstructed. The original fixture/readback were preserved; the fixture was not re-seeded to erase the death.
- No Sand UI scenario was started. No visual-review JPEG for the Frost marker or Sunwell warning was produced; existing CLI PNGs/raw logs remain local under the B4 output folder. No visual PASS is claimed.

## Console notes

The captured console logs show Phaser initialization and a parent-page warning that the `allow` attribute takes precedence over `allowfullscreen`. No game-origin console error was observed in the captured logs. This parent warning is separate from game errors.

## Harness ownership and cleanup

- The B4 host harness ran as PID 12964 using the B4 `serve-candidate.mjs` and only the frozen beta19 dist. Immediately before stopping it, its command line was verified and loopback ports 62244 and 62245 were both confirmed owned by PID 12964. After stopping, the PID and both listeners were absent.
- Start/stop evidence is retained in `output/playwright/world-regions-beta19-b4/harness-ownership-12964.json`. The B4 browser context is already closed; no other browser session was closed.
- The isolated B4 fixture, raw readback, console logs, page snapshots, and local PNGs are retained in `output/playwright/world-regions-beta19-b4/`.

## Result

Partial only. Verified legal fixture validation/readback/reload, normal Continue, q21 availability and UI acceptance, and entry into Frost Pine Pass. The death interrupted the remaining Frost flow; no post-death raw save is available. All targeted Frost completion/hand-in/region transition and Sand q22/Sunwell/q14/q15 behavior remain unverified. Do not interpret the death itself as a balance defect or as evidence about the unvisited objectives.
