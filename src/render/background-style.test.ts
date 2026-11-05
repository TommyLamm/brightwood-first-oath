import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseAssetManifest } from '../app/assets.js';
import { maps } from '../content/world/maps.js';
import { backgroundImageKey, MAP_BACKGROUND_IMAGE_KEYS } from './background-style.js';

describe('map midground selection', () => {
  it('gives the mine its own midground while keeping shared sky/far and other maps unchanged', () => {
    const before = JSON.stringify(maps);
    for (const map of Object.values(maps)) for (const layer of ['sky', 'far', 'mid'] as const) {
      expect(backgroundImageKey(map, layer)).toBe(map.id === 'mine-gate' && layer === 'mid' ? 'env:mine:mid' : `env:${map.themeKey}:${layer}`);
    }
    for (const id of ['future-map', 'constructor', '__proto__']) {
      expect(backgroundImageKey({ id, themeKey: 'future' }, 'mid')).toBe('env:future:mid');
    }
    expect(JSON.stringify(maps)).toBe(before);
  });

  it('makes every selected background available through the production manifest at unchanged display size', () => {
    const manifest = parseAssetManifest(JSON.parse(readFileSync('public/assets/environment/manifest.json', 'utf8')), 'environment');
    const required = new Set(Object.values(maps).flatMap((map) => (['sky', 'far', 'mid'] as const).map((layer) => backgroundImageKey(map, layer))));
    for (const key of MAP_BACKGROUND_IMAGE_KEYS) expect(required.has(key)).toBe(true);
    for (const key of required) {
      const entry = manifest.images.find((image) => image.key === key)!;
      expect(entry, key).toBeDefined();
      expect(readFileSync('public/' + entry.url).subarray(1, 4).toString()).toBe('PNG');
      if (key.endsWith(':mid')) expect([entry.columns, entry.rows, entry.displayWidth, entry.displayHeight]).toEqual([1, 1, 1920, 540]);
    }
  });
});
