import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const lockPath = path.join(repoRoot, '.playroom', 'game-tools.lock.json');

function fail(message) {
  console.error(`Playroom tools: ${message}`);
  process.exit(1);
}

if (!existsSync(lockPath)) {
  fail('missing .playroom/game-tools.lock.json; generate and copy the official pinned tools package first.');
}

let lock;
try {
  lock = JSON.parse(readFileSync(lockPath, 'utf8'));
} catch {
  fail('cannot read .playroom/game-tools.lock.json.');
}

if (typeof lock.toolsVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(lock.toolsVersion)
  || typeof lock.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(lock.sha256)) {
  fail('the pinned tools lock has an invalid version or SHA-256.');
}

const expectedArchive = `.playroom/tools/playroom-game-tools-${lock.toolsVersion}.zip`;
if (lock.archive !== expectedArchive) fail('the pinned tools archive path does not match its version.');

const archivePath = path.join(repoRoot, expectedArchive);
if (!existsSync(archivePath)) fail(`missing pinned archive ${expectedArchive}.`);
const archiveHash = createHash('sha256').update(readFileSync(archivePath)).digest('hex');
if (archiveHash !== lock.sha256) fail('the pinned tools archive SHA-256 does not match the lock.');

const toolDirectory = path.join(repoRoot, '.playroom', 'tools', `extracted-${lock.toolsVersion}`);
const metadataPath = path.join(toolDirectory, 'metadata.json');
if (!existsSync(metadataPath)) {
  fail(`extract the verified archive into .playroom/tools/extracted-${lock.toolsVersion}/ first.`);
}

let metadata;
try {
  metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
} catch {
  fail('the extracted tools metadata is invalid JSON.');
}

if (metadata.toolsVersion !== lock.toolsVersion || !metadata.files || typeof metadata.files !== 'object') {
  fail('the extracted tools metadata does not match the pinned version.');
}

for (const [name, expectedHash] of Object.entries(metadata.files)) {
  if (!/^[a-zA-Z0-9.-]+$/.test(name) || name === '.' || name === '..'
    || typeof expectedHash !== 'string' || !/^[a-f0-9]{64}$/.test(expectedHash)) {
    fail('the extracted tools metadata contains an invalid file entry.');
  }
  const filePath = path.join(toolDirectory, name);
  if (!existsSync(filePath)
    || createHash('sha256').update(readFileSync(filePath)).digest('hex') !== expectedHash) {
    fail(`the extracted tools file failed checksum verification: ${name}.`);
  }
}

const command = process.argv[2];
const args = process.argv.slice(3);
if (command !== 'pack' && command !== 'validate') fail('usage: node tools/playroom/tool-runner.mjs <pack|validate> [arguments].');

const cliPath = path.join(toolDirectory, command === 'pack' ? 'pack-game.mjs' : 'validate-game.mjs');
if (!existsSync(cliPath)) fail(`the pinned archive does not contain ${path.basename(cliPath)}.`);

const result = spawnSync(process.execPath, [cliPath, ...args], {
  cwd: toolDirectory,
  stdio: 'inherit',
});
if (result.error) fail(`could not start ${path.basename(cliPath)}: ${result.error.message}`);
process.exit(result.status ?? 1);
