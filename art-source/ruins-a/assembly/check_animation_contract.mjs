import fs from 'node:fs';
import { animationConformsToUse } from '../../../src/render/animation-contract.ts';

const manifestPath = process.argv[2];
if (!manifestPath) throw new Error('Pass a candidate actors manifest path.');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.pack !== 'actors' || !Array.isArray(manifest.images) || !Array.isArray(manifest.animations)) {
  throw new Error('Expected an actors manifest with image and animation arrays.');
}

for (const [kind, entries] of [['image', manifest.images], ['animation', manifest.animations]]) {
  const keys = entries.map((entry) => entry?.key);
  if (keys.some((key) => typeof key !== 'string' || key.length === 0)) {
    throw new Error(`Every ${kind} entry must have a non-empty key.`);
  }
  if (new Set(keys).size !== keys.length) throw new Error(`Duplicate ${kind} key in actors manifest.`);
}
const everyKey = [...manifest.images, ...manifest.animations].map((entry) => entry.key);
if (new Set(everyKey).size !== everyKey.length) throw new Error('Duplicate key across actors manifest entries.');

const imageKey = 'actor:ruins-moss-carapace';
const imageEntries = manifest.images.filter((entry) => entry.key === imageKey);
if (imageEntries.length !== 1) throw new Error('Expected exactly one moss-carapace image.');
const image = imageEntries[0];
const expectedImage = {
  key: imageKey,
  url: 'assets/actors/monster-ruins-moss-carapace.png',
  columns: 6,
  rows: 5,
  displayWidth: 96,
  displayHeight: 96,
  pivotX: 0.5,
  pivotY: 1,
};
for (const [field, expected] of Object.entries(expectedImage)) {
  if (image[field] !== expected) throw new Error(`Image ${field} must be ${JSON.stringify(expected)}.`);
}

const expectedAnimations = [
  { key: 'ruins-moss-carapace:idle', frames: [0, 1], frameMs: [200, 200], loop: true },
  { key: 'ruins-moss-carapace:walk', frames: [6, 7, 8, 9, 10, 11], frameMs: [120, 120, 120, 120, 120, 120], loop: true },
  { key: 'ruins-moss-carapace:attack', frames: [12, 13, 14, 15], frameMs: [275, 275, 80, 770], loop: false },
  { key: 'ruins-moss-carapace:hurt', frames: [18, 19], frameMs: [100, 100], loop: false },
  { key: 'ruins-moss-carapace:dead', frames: [24, 25, 26, 27], frameMs: [100, 100, 100, 100], loop: false },
].map((animation) => ({ ...animation, imageKey }));
const animations = manifest.animations.filter((entry) => entry.imageKey === imageKey);
if (animations.length !== expectedAnimations.length) throw new Error('Expected five moss-carapace animations.');
for (const expected of expectedAnimations) {
  const matches = animations.filter((entry) => entry.key === expected.key);
  if (matches.length !== 1) throw new Error(`Expected exactly one ${expected.key} animation.`);
  const animation = matches[0];
  if (JSON.stringify(animation.frames) !== JSON.stringify(expected.frames)) {
    throw new Error(`${expected.key} has incorrect frames.`);
  }
  if (JSON.stringify(animation.frameMs) !== JSON.stringify(expected.frameMs)) {
    throw new Error(`${expected.key} has incorrect frame durations.`);
  }
  if (animation.loop !== expected.loop) throw new Error(`${expected.key} has incorrect loop setting.`);
  if (!animationConformsToUse(image.key, animation.key, animation)) {
    throw new Error(`Animation contract rejected ${animation.key}.`);
  }
}
console.log(`Manifest shape and animation-contract.ts accepted ${animations.map((animation) => animation.key).join(', ')}.`);
