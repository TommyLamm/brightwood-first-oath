# Ruins D browser branches retry report

Date: 2026-10-26 (Asia/Hong_Kong)
Scope: owned browser branch `session ruins-d-branches-retry`; frozen beta.15 package only. This is UI acceptance work. No source, dist, ZIP, build, test suite, or package changes were made. Existing q17/q20 evidence was retained and not rerun.

## Inputs and constraints

- Followed the already-reviewed Playroom game-agent specification and referenced requirements handed over by the primary agent; this branch did not publish or modify game code.
- Read `plan/15-ruins-acceptance-and-package.md` §§5–6, `plan/reports/ruins-d-browser-prep.md`, the D browser retry dispatch, the relevant C combat/world values, and the Playwright skill plus CLI/workflow references.
- Used the branch-owned local beta.15 harness and normal UI/keyboard controls. Fixture seeding was limited to this branch’s isolated browser origin and the supplied schema-v4 fixtures.

## R4: full-bag claim and crown

**Pass.** At 32/32 slots, the normal claim action showed the full-bag message; coins stayed 2,500 and q18 stayed ready. Selling the spare 布帽 through the town merchant raised coins to 2,507 and freed one slot. Returning by the in-scene portal and claiming at Zhiheng added exactly 1,600 coins (2,507→4,107), added one 守誓旅冠, and offered q19. The crown equipped normally at 32/32 slots and raised maximum HP 712→732. Its visible overlay was captured in idle, walk, attack, and jump facing both directions. After selling one spare sword and normally unequipping the crown, q19 remained ready, the crown remained in the full bag, and the head slot was empty.

Evidence: `q18-full-bag-ui-32-of-32.png`, `q18-full-bag-claim-blocked.png`, `q18-claim-success-q19-offered.png`, `crown-poses-wide-review.jpg`, the eight `crown-{idle,walk,attack,jump}-{left,right}*.png` pose captures, and `q19-ready-after-crown-unequipped.png`.

## R3: 1 HP death and free return

**Pass.** The `boss-death-1hp` fixture entered normal play at 1/712 with q18 0/1 and 2,500 coins. A boss telegraph/hit produced the normal death UI. The free return restored 712/712, retained 2,500 coins, and retained q18 at 0/1.

Evidence: `boss-death-1hp-before.png`, `boss-death-approach.png`, `boss-death-free-return.png`, and `boss-death-after-return.png`.

## R3: boss retry and valid kill

**Behavioral flow pass, with observation limits below.** The `boss-retry-ready` fixture began with q18 already complete at 1/1. Bounded continuous movement samples recorded 712/712 for about 5.9–6.4 seconds before entering attack range. A separate close sample recorded 712→653 by 270 ms, then held at 653 through the remaining ~1.3 seconds before immediate pause. Later ordinary combat samples showed 653→447 over 11.2 seconds; this is consistent with multiple normal hits, not the earlier apparent 1.4-second burst.

The earlier “died within 1.4 seconds” interpretation is **withdrawn**: it conflated the final short movement command with the idle wall time between browser calls. The fresh bounded sample does not reproduce a burst death. No HP, clock, enemy, or game state was edited through internal APIs.

Ordinary melee combat eventually defeated the boss. The result UI said the bell was quiet and offered return/retry; the player remained at 437/712 and q18 still said it was ready to report. I then clicked the normal “再次挑戰司鐘者” button. After a measured approach, the new boss appeared with a full green health bar; q18 remained ready to report. The frame showed no prior telegraph. The visible `61` damage number was from a hit during this new approach, not from the preceding win.

Evidence: `boss-retry-approach-hp-samples.tsv`, `boss-retry-engage-hp-samples.tsv`, `boss-retry-close-hp-samples.tsv`, `boss-retry-combat-hp-samples.tsv`, `boss-retry-finish-hp-samples.tsv`, `boss-retry-second-approach-hp-samples.tsv`, `boss-retry-finish-attempt.png`, and `boss-retry-second-live-state.png`.

**Not directly verified:** the UI does not expose an explicit “phase 1” label, so only the fresh full green bar was visually confirmed. The captured frame showed no stale warning, but this does not prove sub-frame cleanup timing. Audio freshness/silence was not verified by listening in this browser session.

## Alternate frost-tide allocation

**Pass.** The schema-v4 fixture rendered level 30, STR 94, DEX 67, AP 0, SP 7, heavy strike 6, sweep 6, vitality 1, rest recovery 1. The normal equipment panel showed 冰潮長鋒 equipped (Lv.30 requirement, attack +50), not an oathblade. The ability panel showed attack 304 and no available AP. A normal approach and Ctrl attack displayed `282` damage on the boss; q18 remained 0/1 and the player was 659/712.

Evidence: `alternate-frost-tide-ability-panel.png`, `alternate-frost-tide-approach-hp-samples.tsv`, and `alternate-frost-tide-hit-live.png`.

## Existing branch evidence retained

The earlier q17/q20 independent-ready fixture results and q20 3/3 UI evidence were not repeated: `q17-q20-independent.png`, `q20-individual-ui.png`.

## Session and service shutdown

- Playwright session `ruins-d-branches-retry` was closed with the CLI.
- The owned harness was verified as PID 16332 running `serve-static-harness.mjs`; ports 52771 and 52772 accepted loopback connections before shutdown.
- After signaling only PID 16332, the process was absent and both exact loopback ports returned `ConnectionRefused`. The initial `harness-ownership-16332.json` was preserved; `harness-ownership-16332-stopped-20261026.json` records the stop observations.
- Only this session and harness were stopped. No other browser session, process, or port was inspected or touched.

No automated regression suite or build was run, per task scope.
