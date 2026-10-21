import { describe, expect, it } from 'vitest';
import { createNextEntityId, createSeededRandom } from '../../src/contracts/helpers.js';
import { rulesCatalog } from '../../src/content/rules/index.js';
import { worldCatalog } from '../../src/content/world/index.js';
import { startNewGame, stepGameplay } from '../../src/app/gameplay.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };

describe('monster respawn', () => {
  it('replaces a killed monster at its spawn after respawnMs instead of removing it', () => {
    const nextEntityId = createNextEntityId('respawn');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    const victim = gameplay.monsters[0]!;
    const spawnCount = catalog.world.maps.camp!.monsters.length;
    gameplay.monsters[0] = { ...victim, hp: 0, mode: 'dead', deadAtMs: 0, deathReported: true };

    const random = createSeededRandom(7);
    const respawnMs = rulesCatalog.monsters[victim.monsterId]!.respawnMs;
    let nowMs = 0;
    while (nowMs <= respawnMs + 100) {
      nowMs += 1000 / 60;
      gameplay = stepGameplay(gameplay, {
        catalog, commands: [], input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
        dtSeconds: 1 / 60, nowMs, random, nextEntityId,
      }).gameplay!;
    }

    expect(gameplay.monsters).toHaveLength(spawnCount);
    const replacement = gameplay.monsters.find(({ spawnId }) => spawnId === victim.spawnId);
    expect(replacement).toBeDefined();
    expect(replacement!.id).not.toBe(victim.id);
    expect(replacement!.hp).toBe(rulesCatalog.monsters[victim.monsterId]!.maxHp);
  });
});
