import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const archivePath = path.resolve(repoRoot, process.argv[2] ?? 'artifacts/game.zip');
const result = spawnSync(process.execPath, [
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'tool-runner.mjs'),
  'validate',
  archivePath,
], { cwd: repoRoot, stdio: 'inherit' });
if (result.error) {
  console.error(`Playroom validate: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
