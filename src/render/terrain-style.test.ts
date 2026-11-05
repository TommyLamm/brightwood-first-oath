import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseAssetManifest } from '../app/assets.js';
import { maps } from '../content/world/maps.js';
import {
  terrainStyle,
  requiredTerrainImageKeys,
  terrainDecorationKey,
  terrainDecorationPieces,
  TERRAIN_DECORATION_IMAGE_KEYS,
  themedClimbPieces,
  themedPlatformPieces,
  THEMED_TERRAIN_IMAGE_KEYS,
  THEMED_GROUND_IMAGE_KEYS,
  THEMED_PLATFORM_SURFACE_INSET,
} from './terrain-style.js';

describe('map terrain materials', () => {
  it('adds background supports only to the two sample maps, reaching ground without bridging jump gaps', () => {
    const before = JSON.stringify(maps);
    for (const map of Object.values(maps)) {
      const pieces = terrainDecorationPieces(map);
      if (!['forest-edge', 'mine-gate'].includes(map.id)) {
        expect(terrainDecorationKey(map)).toBeUndefined();
        expect(pieces).toEqual([]);
        continue;
      }
      const platforms = map.footholds.filter((f) => f.dropThrough);
      const tops = pieces.filter((p) => p.frame === 0);
      expect(tops).toHaveLength(platforms.length * 2);
      for (const top of tops) {
        const platform = platforms.find((f) => f.y1 + 14 === top.y && top.x >= f.x1 && top.x + 64 <= f.x2)!;
        expect(platform).toBeDefined();
        const column = pieces.filter((p) => p.frame !== 3 && p.x === top.x && p.y >= top.y);
        let bottom = top.y;
        for (const piece of column) {
          expect(piece.y).toBe(bottom);
          expect(piece.height).toBeGreaterThan(0);
          expect(piece.height).toBeLessThanOrEqual(32);
          bottom += piece.height;
        }
        expect(bottom).toBe(600);
      }
      const ties = pieces.filter((p) => p.frame === 3);
      expect(ties).toHaveLength(map.ladders.length);
      for (const tie of ties) expect(map.ladders.some((l) => l.x === tie.x + 32 && l.topY + 8 === tie.y)).toBe(true);
      expect(terrainDecorationPieces(map)).toEqual(pieces);
    }
    expect(JSON.stringify(maps)).toBe(before);
    const manifest = parseAssetManifest(JSON.parse(readFileSync('public/assets/environment/manifest.json', 'utf8')), 'environment');
    for (const key of TERRAIN_DECORATION_IMAGE_KEYS) {
      const entry = manifest.images.find((i) => i.key === key)!;
      expect([entry.columns, entry.rows, entry.displayWidth, entry.displayHeight]).toEqual([4, 1, 64, 64]);
      const png = readFileSync('public/' + entry.url);
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([512, 128]);
    }
  });

  it('selects forest and ridge themes, with a mine override on the shared rock background', () => {
    for (const id of ['forest-edge', 'mushroom-wood']) {
      expect(terrainStyle(maps[id]).climbKey).toBe('env:forest:vine');
    }
    for (const id of ['red-ridge', 'guardian-arena']) {
      expect(terrainStyle(maps[id]).climbKey).toBe('env:ridge:rope');
    }
    expect(maps['mine-gate'].themeKey).toBe('rock');
    expect(terrainStyle(maps['mine-gate']).climbKey).toBe('env:mine:ladder');
    expect(terrainStyle({ id: 'future-map', themeKey: 'future-theme' }))
      .toEqual({ groundKey: 'env:tile-ground', platformKey: 'env:tile-platform', climbKey: 'env:ladder', segmented: false });
    for (const map of Object.values(maps)) expect(terrainStyle(map).segmented, map.id).toBe(true);
  });

  it('loads distinct outdoor snow and cave ice routes only on their winter maps, with all selected files available', () => {
    const manifest = parseAssetManifest(JSON.parse(readFileSync('public/assets/environment/manifest.json', 'utf8')), 'environment');
    const before = JSON.stringify(maps);
    for (const map of Object.values(maps)) {
      const keys = requiredTerrainImageKeys(map);
      const expected = ['frost-shore', 'frost-pine-pass'].includes(map.id)
        ? ['env:frost:ground', 'env:frost:platform', 'env:frost:rope']
        : map.id === 'frost-tide-cavern'
          ? ['env:frost-cave:ground', 'env:frost-cave:platform', 'env:frost-cave:chain'] : undefined;
      if (expected) {
        expect(keys).toEqual(expect.arrayContaining(expected));
        expect(keys.filter((key) => /^env:frost(?:-cave)?:/.test(key))).toHaveLength(3);
        expect(keys).not.toContain('env:tile-ground');
        expect(keys).not.toContain('env:tile-platform');
        expect(keys).not.toContain('env:ladder');
      } else {
        expect(keys.some((key) => /^env:frost(?:-cave)?:/.test(key))).toBe(false);
      }
      for (const key of keys) {
        const image = manifest.images.find((entry) => entry.key === key)!;
        expect(image, map.id + ':' + key).toBeDefined();
        expect(readFileSync('public/' + image.url).subarray(1, 4).toString()).toBe('PNG');
      }
    }
    for (const key of THEMED_GROUND_IMAGE_KEYS) {
      const image = manifest.images.find((entry) => entry.key === key)!;
      const png = readFileSync('public/' + image.url);
      expect([image.columns, image.rows, image.displayWidth, image.displayHeight]).toEqual([1, 1, 128, 128]);
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([512, 512]);
    }
    expect(JSON.stringify(maps)).toBe(before);
  });

  it('replaces the remaining common routes and grass outside the forest without loading unused platforms', () => {
    const regions = [
      { ids: ['camp', 'town'], prefix: 'village', climb: 'ladder' },
      { ids: ['sand-glass-shore', 'sand-dune-pass'], prefix: 'sand', climb: 'rope' },
      { ids: ['sand-sunwell-basin', 'sand-sunwell-altar'], prefix: 'sunwell', climb: 'chain' },
      { ids: ['ruins-tide-camp', 'ruins-root-causeway', 'ruins-echo-gallery', 'ruins-bell-sanctum'], prefix: 'ruins', climb: 'chain' },
      { ids: ['red-ridge', 'guardian-arena'], prefix: 'ridge', climb: 'rope' },
      { ids: ['mine-gate'], prefix: 'mine', climb: 'ladder' },
    ];
    for (const { ids, prefix, climb } of regions) for (const id of ids) {
      const map = maps[id]!;
      const keys = requiredTerrainImageKeys(map);
      expect(terrainStyle(map)).toEqual({ groundKey: `env:${prefix}:ground`, platformKey: `env:${prefix}:platform`, climbKey: `env:${prefix}:${climb}`, segmented: true });
      expect(keys).toContain(`env:${prefix}:ground`);
      expect(keys.includes(`env:${prefix}:platform`)).toBe(map.footholds.some((f) => f.dropThrough));
      expect(keys.includes(`env:${prefix}:${climb}`)).toBe(map.ladders.length > 0);
      for (const common of ['env:tile-ground', 'env:tile-platform', 'env:ladder']) expect(keys).not.toContain(common);
    }
    for (const id of ['forest-edge', 'mushroom-wood']) expect(terrainStyle(maps[id]!).groundKey).toBe('env:tile-ground');
  });

  it('fits every themed platform exactly to its original foothold with stable varied bodies', () => {
    const before = JSON.stringify(maps);
    for (const map of Object.values(maps).filter((map) => terrainStyle(map).segmented)) {
      for (const foothold of map.footholds.filter(({ dropThrough }) => dropThrough)) {
        const pieces = themedPlatformPieces(foothold);
        expect(pieces[0].frame).toBe(0);
        expect(pieces.at(-1)!.frame).toBe(4);
        let x = foothold.x1;
        for (const piece of pieces) {
          expect(piece.x).toBe(x);
          expect(piece.y + THEMED_PLATFORM_SURFACE_INSET).toBe(foothold.y1);
          expect(piece.width).toBeGreaterThan(0);
          expect(piece.width + piece.cropX).toBeLessThanOrEqual(64);
          x += piece.width;
        }
        expect(x).toBe(foothold.x2);
        expect(themedPlatformPieces(foothold)).toEqual(pieces);
      }
    }
    expect(JSON.stringify(maps)).toBe(before);
    const long = themedPlatformPieces({ id: 'long', x1: 0, x2: 512, y1: 100, y2: 100, dropThrough: true });
    expect(new Set(long.slice(1, -1).map(({ frame }) => frame)).size).toBe(3);
  });

  it('fits every themed climb route without scaling the middle or changing its x/range', () => {
    for (const map of Object.values(maps).filter((map) => terrainStyle(map).segmented)) {
      for (const ladder of map.ladders) {
        const pieces = themedClimbPieces(ladder);
        expect(pieces[0].frame).toBe(0);
        expect(pieces.at(-1)!.frame).toBe(2);
        let y = ladder.topY;
        for (const piece of pieces) {
          expect(piece.x + piece.width / 2).toBe(ladder.x);
          expect(piece.y).toBe(y);
          expect(piece.height).toBeGreaterThan(0);
          expect(piece.height + piece.cropY).toBeLessThanOrEqual(32);
          y += piece.height;
        }
        expect(y).toBe(ladder.bottomY);
      }
    }
  });

  it('crops caps for short routes and handles empty or invalid lengths without overdraw', () => {
    const foothold = { id: 'short', x1: 20, x2: 45, y1: 100, y2: 100, dropThrough: true };
    const platform = themedPlatformPieces(foothold);
    expect(platform.map(({ width }) => width)).toEqual([12.5, 12.5]);
    expect(platform.at(-1)!.cropX).toBe(51.5);
    const ladder = { id: 'short', x: 50, topY: 10, bottomY: 35 };
    expect(themedClimbPieces(ladder).map(({ height }) => height)).toEqual([12.5, 12.5]);
    for (const length of [0, -1, NaN, Infinity]) {
      expect(themedPlatformPieces({ ...foothold, x2: foothold.x1 + length })).toEqual([]);
      expect(themedClimbPieces({ ...ladder, bottomY: ladder.topY + length })).toEqual([]);
    }
  });

  it('provides every selected image as a valid 2x atlas through the production manifest parser', () => {
    const manifest = parseAssetManifest(JSON.parse(readFileSync('public/assets/environment/manifest.json', 'utf8')), 'environment');
    for (const key of THEMED_TERRAIN_IMAGE_KEYS) {
      const image = manifest.images.find((image) => image.key === key)!;
      expect(image, key).toBeDefined();
      const png = readFileSync('public/'+image.url);
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect(image.columns).toBe(key.endsWith(':platform') ? 5 : 3);
      expect(image.rows).toBe(1);
      expect(png.readUInt32BE(16) / image.columns).toBe(image.displayWidth * 2);
      expect(png.readUInt32BE(20)).toBe(image.displayHeight * 2);
    }
  });
});
