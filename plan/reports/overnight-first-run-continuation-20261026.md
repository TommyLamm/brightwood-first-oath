# Overnight first-run continuation handoff — 2026-10-26

## Scope and build boundary

- Normal UI continuation only; no source, product metadata, game save numbers outside normal play, quest flags, clock, or balance were edited. No build, tests, package, release, commit, push, or tag was run.
- SUT: artifacts/overnight-20261026/portal-labels/dist, game ID brightwood-first-oath, version 1.0.0-beta.18. Main bundle assets/index-BPLc23-E.js SHA256 1c26346100c38d09beee5b7cc331210e29274ba1dc757c67021d9b3c302e6cab; complete dist manifest SHA256 8c965c1835e938e1ff54d79c377f2088d08be564077c3be64c766086f4f62857.
- This is a segmented continuation, not a seamless beta18-from-zero run. The exact beta17 q03 raw save was validated once against the current catalog and seeded only into this run’s dedicated ephemeral game origin; q01–q03 were not replayed.
- Source checkpoint: artifacts/overnight-20261026/first-run/checkpoint-21-q03-claimed.json, 884 bytes, SHA256 5b13a38c4edc917910d0d3e4031ddaa96f7d45917d27a2678022125fb650cd07.

## q04 — completed and claimed

- Accepted 菌林調查 through 岩嶺教官’s normal Town dialogue. Used the existing points and inventory through UI: 10 AP to STR, 2 SP to heavy strike rank 3 and rest recovery rank 1, equipped the light leather vest; on reaching Lv14, assigned the earned 5 AP to STR and learned toughness guard rank 1.
- Completed 6/6 mushroom kills and collected 4/4 spore samples in 菌傘深林. Returned with the visible Return to Town control and claimed the reward manually from the mentor.
- Reward shown by UI: 1,000 EXP, 350 coins, leather cap; level reached Lv17. q04 checkpoint HUD: HP420/420, MP72/72, EXP0/1111, coins1162.
- Raw canonical checkpoint: artifacts/overnight-20261026/first-run-continuation/checkpoint-q04-claimed.json, 1062 bytes, SHA256 9e01f29e7ebb86fffcffcf4b719e686efdfa7b0e7eee7fae45bef084ad1ff5ba. Adjacent metadata records that q05 was only the next-step HUD prompt at that checkpoint; it was not accepted yet.

## q05 — active, partial

- Followed the normal route Town → 嫩芽林道 → 菌傘深林 → 赤岩山徑. At the keeper, manually accepted 穿越赤岩; the UI showed its 0/8 red boar objective, confirming acceptance.
- Reached 6/8 boar kills through normal movement, facing, attacks, and ordinary Q/W consumables. A single 1280×720 JPEG quality-70 scene capture used to correct facing is at artifacts/overnight-20261026/first-run-continuation/evidence/q05-current.jpg.
- Stopped paused in 赤岩山徑 after root requested closeout. Current HUD at the raw checkpoint: Lv17, HP107/420, MP30/72, q05 6/8. No product blocker confirmed.
- Raw canonical checkpoint: artifacts/overnight-20261026/first-run-continuation/checkpoint-q05-6of8-partial.json, 1091 bytes, SHA256 59b3e50375a304e7de020e47861f0bd854c2ce0fde6f485ee9d7abe0df1472e4. Adjacent metadata includes the configuration and restore boundary.
- q05 has not been completed or claimed. q06–q08 were not started or verified.

## Owned session cleanup

- Named Playwright session morning-first-run-continuation closed with its session-scoped close command; its browser PID 26260 is gone and the CLI reports no remaining browser sessions.
- Harness PID 32636 was verified to run this folder’s server.mjs and exclusively own ports 58244, 58245, and 58246. It was stopped; a follow-up check found no listeners on those ports.
- Original service ownership/start records are preserved. New closure records: artifacts/overnight-20261026/first-run-continuation/session-stopped.json and service-stopped.json.

## Next step

At the next authorized continuation, restore the exact q05 partial raw in a fresh owned browser/origin. HP is low (107/420): use the normal potion or Return to Town/healer flow before resuming combat. Finish the remaining two boar kills and manually claim q05 at the keeper, then continue q06–q08 within that continuation's scope; do not replay q01–q04. Root stopped this batch at 08:13 HKT because the current usage window had reached 90%, preserving capacity for complete save/report/service cleanup rather than risking another quota interruption. This is a resource stop, not a product blocker or an extra user-approval requirement for each quest.
