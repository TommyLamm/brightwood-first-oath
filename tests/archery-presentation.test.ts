import { describe, expect, it } from 'vitest';
import { archeryFrame, archerMuzzle } from '../src/contracts/archery.js';
import { parseHeroAnchorManifest } from '../src/app/assets.js';
import { readFileSync } from 'node:fs';

describe('archery presentation contract', () => {
  it('aligns both releases with the actual windup and second-shot schedule', () => {
    expect([0,100,179,180,239,240,299,300,360].map((t) => archeryFrame(t,180,[0,120])))
      .toEqual([0,1,1,2,2,1,1,2,3]);
    expect(archeryFrame(260,260,[0])).toBe(2);
    expect(archeryFrame(120,120,[0])).toBe(2);
  });
  it('keeps mirrored release anchors and all original sword frames', () => {
    expect(archerMuzzle({x:100,y:600},-1)).toEqual({x:76,y:568});
    const anchors=parseHeroAnchorManifest(JSON.parse(readFileSync('public/assets/actors/anchors.json','utf8')));
    for (const outfit of ['cloth','leather','iron'] as const) {
      expect(anchors.heroes[outfit].attack).toHaveLength(6);
      expect(anchors.archery?.shoot[outfit]).toHaveLength(4);
      expect(anchors.archery?.shoot[outfit][2]?.arrow).toEqual({x:72,y:52});
    }
  });
});
