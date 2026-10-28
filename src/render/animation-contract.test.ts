import { describe, expect, it } from 'vitest';
import type { AssetAnimation } from '../contracts/asset-manifest.js';
import { animationConformsToUse } from './animation-contract.js';
import { pickAnimationFrame } from './animation.js';

function animation(
  key: string,
  imageKey: string,
  frames: number[],
  frameMs: number[],
  loop = false,
): AssetAnimation {
  return { key, imageKey, frames, frameMs, loop };
}

describe('ruins animation metadata contract', () => {
  it('allows only the explicit static two-frame stele idle metadata', () => {
    const staticIdle = animation('npc:ruins-stele-west:idle', 'actor:ruins-stele', [0, 0], [350, 350], true);
    expect(animationConformsToUse('actor:ruins-stele', 'npc:ruins-stele-west:idle', staticIdle)).toBe(true);
    expect(animationConformsToUse('actor:ruins-stele', 'npc:ruins-stele-east:idle', {
      ...staticIdle,
      key: 'npc:ruins-stele-east:idle',
    })).toBe(true);
    expect(animationConformsToUse('actor:ruins-stele', 'npc:ruins-stele-west:idle', {
      ...staticIdle,
      frames: [0, 1],
    })).toBe(false);
    expect(animationConformsToUse('actor:ruins-stele', 'npc:ruins-stele-west:idle', {
      ...staticIdle,
      loop: false,
    })).toBe(false);

    expect(animationConformsToUse('actor:ruins-pathfinder', 'npc:ruins-pathfinder:idle',
      animation('npc:ruins-pathfinder:idle', 'actor:ruins-pathfinder', [0, 1], [350, 350], true))).toBe(true);
    expect(animationConformsToUse('actor:ruins-pathfinder', 'npc:ruins-pathfinder:idle',
      animation('npc:ruins-pathfinder:idle', 'actor:ruins-pathfinder', [0], [350], true))).toBe(false);
  });

  it('requires the authored four-frame attack cadence for both new monsters', () => {
    const puppetAttack = animation('ruins-string-puppet:attack', 'actor:ruins-string-puppet', [12, 13, 14, 15], [500, 500, 100, 900]);
    const prowlerAttack = animation('ruins-bell-prowler:attack', 'actor:ruins-bell-prowler', [12, 13, 14, 15], [550, 550, 100, 900]);

    expect(animationConformsToUse('actor:ruins-string-puppet', 'ruins-string-puppet:attack', puppetAttack)).toBe(true);
    expect(animationConformsToUse('actor:ruins-bell-prowler', 'ruins-bell-prowler:attack', prowlerAttack)).toBe(true);
    expect(animationConformsToUse('actor:ruins-string-puppet', 'ruins-string-puppet:attack', {
      ...puppetAttack,
      frameMs: [500, 500, 500, 500],
    })).toBe(false);
    expect(pickAnimationFrame(puppetAttack, 1000, 0)).toBe(14);
    expect(pickAnimationFrame(puppetAttack, 1100, 0)).toBe(15);
    expect(pickAnimationFrame(prowlerAttack, 1100, 0)).toBe(14);
    expect(pickAnimationFrame(prowlerAttack, 1200, 0)).toBe(15);
  });

  it('requires the Bell Keeper six-animation contract and keeps both attack cadences authored', () => {
    const states = [
      animation('ruins-bell-keeper:idle', 'actor:ruins-bell-keeper', [0, 1], [200, 200], true),
      animation('ruins-bell-keeper:attack-sweep', 'actor:ruins-bell-keeper', [2, 3, 4, 5], [600, 600, 100, 1000]),
      animation('ruins-bell-keeper:walk', 'actor:ruins-bell-keeper', [6, 7, 8, 9, 10, 11], [120, 120, 120, 120, 120, 120], true),
      animation('ruins-bell-keeper:attack', 'actor:ruins-bell-keeper', [12, 13, 14, 15], [450, 450, 100, 1000]),
      animation('ruins-bell-keeper:hurt', 'actor:ruins-bell-keeper', [18, 19], [100, 100]),
      animation('ruins-bell-keeper:dead', 'actor:ruins-bell-keeper', [24, 25, 26, 27], [100, 100, 100, 100]),
    ];
    for (const entry of states) {
      expect(animationConformsToUse('actor:ruins-bell-keeper', entry.key, entry)).toBe(true);
    }

    const sweep = states[1]!;
    const slam = states[3]!;
    expect(animationConformsToUse('actor:ruins-bell-keeper', sweep.key, { ...sweep, frameMs: [425, 425, 100, 1000] })).toBe(false);
    expect(pickAnimationFrame(sweep, 1200, 0)).toBe(4);
    expect(pickAnimationFrame(slam, 900, 0)).toBe(14);
  });
});
