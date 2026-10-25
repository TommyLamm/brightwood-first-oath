import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function appendEntries(relativePath, additions, fields) {
  const file = path.join(root, relativePath);
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  const before = Object.fromEntries(fields.map((field) => [field, manifest[field].map((entry) => ({ ...entry }))]));
  for (const [field, rows] of Object.entries(additions)) {
    for (const row of rows ?? []) {
      const existing = manifest[field].find((entry) => entry.key === row.key);
      if (existing) {
        if (JSON.stringify(existing) !== JSON.stringify(row)) throw new Error(`Conflicting ${field} entry: ${row.key}`);
        continue;
      }
      manifest[field].push(row);
    }
  }
  for (const field of fields) {
    const oldRows = before[field];
    if (oldRows.some((row, index) => JSON.stringify(row) !== JSON.stringify(manifest[field][index]))) {
      throw new Error(`Existing ${field} entries changed order or content in ${relativePath}`);
    }
  }
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return Object.fromEntries(fields.map((field) => [field, { kept: before[field].length, added: manifest[field].length - before[field].length }]));
}

const actorChanges = appendEntries('public/assets/actors/manifest.json', {
  images: [
    { key: 'actor:ruins-pathfinder', url: 'assets/actors/npcs/ruins-pathfinder-idle-v1.png', columns: 2, rows: 1, displayWidth: 96, displayHeight: 96, pivotX: 0.5, pivotY: 1 },
    { key: 'actor:ruins-stele', url: 'assets/actors/npcs/ruins-stele-v1.png', columns: 1, rows: 1, displayWidth: 96, displayHeight: 128, pivotX: 0.5, pivotY: 1 },
  ],
  animations: [
    { key: 'npc:ruins-pathfinder:idle', imageKey: 'actor:ruins-pathfinder', frames: [0, 1], frameMs: [350, 350], loop: true },
    { key: 'npc:ruins-stele-west:idle', imageKey: 'actor:ruins-stele', frames: [0, 0], frameMs: [350, 350], loop: true },
    { key: 'npc:ruins-stele-east:idle', imageKey: 'actor:ruins-stele', frames: [0, 0], frameMs: [350, 350], loop: true },
  ],
}, ['images', 'animations']);

const environmentChanges = appendEntries('public/assets/environment/manifest.json', {
  images: [
    { key: 'env:ruins-gallery:sky', url: 'assets/environment/env-ruins-gallery-sky-v1.png', columns: 1, rows: 1, displayWidth: 960, displayHeight: 540, pivotX: 0, pivotY: 0 },
    { key: 'env:ruins-gallery:far', url: 'assets/environment/env-ruins-gallery-far-v1.png', columns: 1, rows: 1, displayWidth: 1440, displayHeight: 540, pivotX: 0, pivotY: 0 },
    { key: 'env:ruins-gallery:mid', url: 'assets/environment/env-ruins-gallery-mid-v1.png', columns: 1, rows: 1, displayWidth: 1920, displayHeight: 540, pivotX: 0, pivotY: 0 },
  ],
  animations: [],
}, ['images', 'animations']);

const interfaceChanges = appendEntries('public/assets/interface/manifest.json', {
  images: [
    { key: 'item:broken-copper-thread', url: 'assets/interface/item-broken-copper-thread-v1.png', columns: 1, rows: 1, displayWidth: 32, displayHeight: 32, pivotX: 0.5, pivotY: 0.5 },
    { key: 'item:muted-bell-fragment', url: 'assets/interface/item-muted-bell-fragment-v1.png', columns: 1, rows: 1, displayWidth: 32, displayHeight: 32, pivotX: 0.5, pivotY: 0.5 },
  ],
  animations: [],
}, ['images', 'animations']);

process.stdout.write(`${JSON.stringify({ actors: actorChanges, environment: environmentChanges, interface: interfaceChanges })}\n`);
