# Playroom packaging tools

The local entrypoints use only the versioned tools archive recorded in
`.playroom/game-tools.lock.json`. After extracting that verified archive into
`.playroom/tools/extracted-<toolsVersion>/`, run:

```powershell
node tools/playroom/pack.mjs
node tools/playroom/validate.mjs
```

Packing reads `dist/` and writes `artifacts/game.zip`, outside the game output.
The entrypoints verify the archive SHA-256 and every extracted file against the
lock and embedded metadata before invoking the official CLI. They do not create
or substitute validation tools.
