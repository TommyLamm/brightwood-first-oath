import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distPath = path.resolve(repoRoot, process.argv[2] ?? 'dist');
const outputPath = path.resolve(repoRoot, process.argv[3] ?? 'artifacts/game.zip');
const relativeOutput = path.relative(distPath, outputPath);
if (relativeOutput === '' || (!relativeOutput.startsWith(`..${path.sep}`)
  && relativeOutput !== '..' && !path.isAbsolute(relativeOutput))) {
  console.error('Playroom pack: output must be outside the dist source directory.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'tool-runner.mjs'),
  'pack',
  distPath,
  outputPath,
], { cwd: repoRoot, stdio: 'inherit' });
if (result.error) {
  console.error(`Playroom pack: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
