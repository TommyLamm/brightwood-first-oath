import assert from 'node:assert/strict';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

async function appendImages(file, entries) {
  const fullPath = path.join(root, file);
  const manifest = JSON.parse(await readFile(fullPath, 'utf8'));
  const before = JSON.stringify(manifest.images);
  const existing = new Set(manifest.images.map(({ key }) => key));
  for (const entry of entries) {
    assert.ok(!existing.has(entry.key), `${entry.key} already exists in ${file}`);
    await stat(path.join(root, 'public', entry.url));
    existing.add(entry.key);
    manifest.images.push(entry);
  }
  assert.equal(JSON.stringify(manifest.images.slice(0, -entries.length)), before, `${file} existing image entries changed`);
  await writeFile(fullPath, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${file}: appended ${entries.map(({ key }) => key).join(', ')}\n`);
}

await appendImages('public/assets/environment/manifest.json', [
  { key: 'env:ruins-sanctum:sky', url: 'assets/environment/env-ruins-sanctum-sky-v1.png', columns: 1, rows: 1, displayWidth: 960, displayHeight: 540, pivotX: 0, pivotY: 0 },
  { key: 'env:ruins-sanctum:far', url: 'assets/environment/env-ruins-sanctum-far-v1.png', columns: 1, rows: 1, displayWidth: 1440, displayHeight: 540, pivotX: 0, pivotY: 0 },
  { key: 'env:ruins-sanctum:mid', url: 'assets/environment/env-ruins-sanctum-mid-v1.png', columns: 1, rows: 1, displayWidth: 1920, displayHeight: 540, pivotX: 0, pivotY: 0 },
]);

await appendImages('public/assets/actors/manifest.json', [
  { key: 'equip:oathfarer-circlet', url: 'assets/actors/equip-oathfarer-circlet-v1.png', columns: 1, rows: 1, displayWidth: 48, displayHeight: 32, pivotX: 0.5, pivotY: 1 },
]);

await appendImages('public/assets/interface/manifest.json', [
  { key: 'item:oathfarer-circlet', url: 'assets/interface/item-oathfarer-circlet-v1.png', columns: 1, rows: 1, displayWidth: 32, displayHeight: 32, pivotX: 0.5, pivotY: 0.5 },
]);
