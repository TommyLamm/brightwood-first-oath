# T15-08 gameplay source capture

## Result

Blocked: no screenshot was captured. The required source path `art-source/screenshots/gameplay-cover-source.png` was not created, and no substitute or mock image was made. T15-08 remains incomplete until a real gameplay frame can be captured.

## Required specification reads

On 2026-10-18 HKT, reread the current Playroom `main` template and all seven referenced files:

- `https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md`
- `https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md`
- `https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md`
- `https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json`
- `https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml`
- `https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js`
- `https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md`
- `https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md`

Also read `plan/09-parallel-dispatch.md`, `plan/tasks/T15-playroom-package.md`, `plan/tasks/T14-app-integration.md`, and the Playwright skill plus CLI reference. Applicable requirements: the cover must come from actual game imagery, measure 800×500 and remain under 5 MiB; the development workflow must use Playwright for the real local app; do not substitute a mockup or concept image. The task required waiting for T14-c before starting the app; the parent confirmed commit `f0bcc6c` before capture began.

## Attempt and limitation

- Confirmed port 5173 was free and `node_modules` was present.
- Started `npm.cmd run dev -- --host 127.0.0.1`; Vite reported ready at `http://127.0.0.1:5173/`.
- The Playwright skill wrapper could not start through Git Bash. Git Bash exited with `NtCreateDirectoryObject(...): 0xC0000022`.
- Tried the one direct CLI fallback: `npx.cmd --yes --package @playwright/cli playwright-cli --help`. It failed with `ENOTFOUND registry.npmjs.org` while resolving `@playwright/cli`. No global `playwright-cli` was installed.
- No page was opened and no gameplay frame was inspected or saved. The local Vite process was stopped afterward. No tests, pack, validate, or source-code edits were run.

## Follow-up

Retry only when Playwright CLI is available without installing packages or changing environment policy. Then capture one actual gameplay frame to `art-source/screenshots/gameplay-cover-source.png`, inspect readability and dimensions, and give that absolute path to the cover-art task.
