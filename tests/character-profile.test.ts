import { fullCharacterProfile } from './fixtures/full-character-profile.js';
import { legacySaveData } from './fixtures/legacy-save.js';
import { describe, expect, it, vi } from 'vitest';
import type { CloudPort, CloudSaveInput, GameProfile, SaveData, SaveStatus } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { createPlayer } from '../src/domain/progression/index.js';
import { activeSaveData, createEmptyProfile, createPersistence, measureProfile, prepareProfile,
  profileFromLegacySave, SAVE_FORMAT_VERSION, updateActiveCharacter } from '../src/persistence/index.js';
import { characterFromSave } from '../src/persistence/profile.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
function save(archer = false): SaveData {
  return {
    player: createPlayer(archer ? '青翎' : '晨芽', rulesCatalog, archer ? 'archer' : 'swordsman'),
    quests: {}, visitedMaps: ['camp'], location: { mapId: 'camp', spawnId: 'start' },
    flags: { bossDefeated: false, chapterComplete: false },
    settings: { masterVolume: 0.8, musicVolume: 0.7, sfxVolume: 0.9, muted: false, bindings: {} },
  };
}
function twoCharacters(): GameProfile {
  const profile = profileFromLegacySave(save());
  profile.slots[1]!.characterId = 'archer-1';
  profile.characters['archer-1'] = characterFromSave(save(true), 'archer-1');
  return profile;
}

describe('character profiles and legacy migration', () => {
  it('migrates old data deterministically without mutation or duplicating characters on reload', () => {
    const original = legacySaveData(save());
    original.quests = { q01: { status: 'active', counters: { snail: 2 } } };
    const bytes = JSON.stringify(original);
    const migrated = prepareProfile(original, catalog, 5);
    expect(migrated.ok).toBe(true);
    if (!migrated.ok) return;
    expect(JSON.stringify(original)).toBe(bytes);
    expect(activeSaveData(migrated.value.data)).toEqual({ ...original, player: { ...original.player, int: 4, luk: 0 } });
    expect(Object.keys(migrated.value.data.characters)).toEqual(['legacy-1']);
    expect(prepareProfile(migrated.value.data, catalog, SAVE_FORMAT_VERSION)).toEqual(migrated);
    expect(prepareProfile(original, catalog, 6).ok).toBe(false);
    expect(prepareProfile(save(true), catalog, 5).ok).toBe(false);
  });

  it('accepts an empty profile and a deliberate unselected roster, with validated shared settings', () => {
    const empty = createEmptyProfile(save().settings);
    expect(prepareProfile(empty, catalog).ok).toBe(true);
    const unselected = twoCharacters();
    unselected.activeCharacterId = null;
    expect(prepareProfile(unselected, catalog).ok).toBe(true);
    expect(activeSaveData(unselected)).toBeNull();
    empty.settings.masterVolume = 2;
    expect(prepareProfile(empty, catalog).ok).toBe(false);
  });

  it('rejects duplicate, orphaned, mismatched or extra character records and cross-class progress', () => {
    const invalid: GameProfile[] = [];
    let profile = twoCharacters(); profile.slots[1]!.characterId = 'legacy-1'; invalid.push(profile);
    profile = twoCharacters(); profile.activeCharacterId = 'missing'; invalid.push(profile);
    profile = twoCharacters(); profile.characters['archer-1']!.characterId = 'wrong'; invalid.push(profile);
    profile = twoCharacters();
    for (const slotId of ['slot-5', 'slot-6', 'slot-7']) profile.slots.push({ slotId, characterId: null });
    invalid.push(profile);
    profile = twoCharacters(); profile.characters['archer-1']!.player.equipment.weapon = 'starter-sword'; invalid.push(profile);
    profile = twoCharacters(); profile.characters['archer-1']!.player.skillRanks['heavy-strike'] = 1; invalid.push(profile);
    for (const candidate of invalid) expect(prepareProfile(candidate, catalog).ok).toBe(false);
  });

  it('isolates active progress, uses archer HP/MP limits and shares settings without shared references', () => {
    const profile = twoCharacters();
    profile.activeCharacterId = 'archer-1';
    const data = activeSaveData(profile)!;
    data.player.coins += 30;
    data.player.bag.push({ itemId: 'forest-seed', quantity: 2 });
    data.settings.muted = true;
    const changed = updateActiveCharacter(profile, data);
    expect(prepareProfile(changed, catalog).ok).toBe(true);
    expect(changed.characters['legacy-1']).toEqual(profile.characters['legacy-1']);
    expect(changed.characters['archer-1']!.player.coins).toBe(150);
    expect(profile.settings.muted).toBe(false);
    changed.characters['archer-1']!.player.mp = 49;
    expect(prepareProfile(changed, catalog).ok).toBe(false);
    expect(profile.characters['archer-1']!.player.mp).toBe(48);
  });

  it('fits four high-progress characters, full bags, all quests/maps and maximum bindings below 64 KiB', () => {
    const profile = fullCharacterProfile();
    expect(prepareProfile(profile, catalog).ok).toBe(true);
    const metrics = measureProfile(profile);
    expect(metrics.error).toBeNull();
    expect(metrics.bytes).toBeLessThan(64 * 1024);
    console.info(`Four-character high-progress profile: ${metrics.bytes} UTF-8 bytes`);
    profile.characters['character-1']!.player.name = '測'.repeat(64 * 1024);
    expect(prepareProfile(profile, catalog).ok).toBe(false);
    expect(profile.characters['character-1']!.player.name).toHaveLength(64 * 1024);
  });

  it('retries the same entire profile before sending a pending character switch with the new revision', async () => {
    const calls: CloudSaveInput[] = [];
    const statuses: SaveStatus[] = [];
    const cloud: CloudPort = {
      ready: async () => ({ mode: 'authenticated', progressAvailable: true, capabilities: ['progress'] }),
      loadProgress: async () => null,
      saveProgress: vi.fn(async (input) => {
        calls.push(structuredClone(input));
        if (calls.length === 1) throw new Error('response lost');
        return { ...input, saved: true, revision: input.revision + 1, gameVersion: 'test', updatedAt: 'test' };
      }),
    };
    const persistence = createPersistence({ gameId: 'profile-test', storage: null, cloud, catalog,
      onStatus: (status) => statuses.push(status) });
    await persistence.initialize();
    const profile = twoCharacters();
    persistence.checkpointProfile!(profile);
    await vi.waitFor(() => expect(statuses).toContain('saveError'));
    profile.activeCharacterId = 'archer-1';
    persistence.checkpointProfile!(profile);
    await persistence.retry();
    await vi.waitFor(() => expect(calls).toHaveLength(3));
    expect(calls[1]).toEqual(calls[0]);
    expect(calls[2]).toMatchObject({ revision: 1, formatVersion: SAVE_FORMAT_VERSION, data: { activeCharacterId: 'archer-1' } });
    expect(Object.keys(calls[2]!.data.characters)).toHaveLength(2);
    expect(persistence.getProfile!()?.activeCharacterId).toBe('archer-1');
    persistence.dispose();
  });

  it('preserves stored bytes when another tab changes the source during backup', async () => {
    const key = 'profile-test:save:v1';
    const original = JSON.stringify({ formatVersion: 5, data: legacySaveData(save()), savedAt: 'old' });
    const changed = JSON.stringify({ formatVersion: 5, data: save(true), savedAt: 'new' });
    const entries = new Map([[key, original]]);
    const persistence = createPersistence({ gameId: 'profile-test', development: false, cloud: null, catalog,
      storage: {
        getItem: (name) => entries.get(name) ?? null,
        setItem: (name, value) => {
          entries.set(name, value);
          if (name.endsWith('-backup')) entries.set(key, changed);
        },
        removeItem: (name) => { entries.delete(name); },
      } });
    await persistence.initialize();
    persistence.confirmSaveUpgrade();
    expect(entries.get(key)).toBe(changed);
    expect(entries.get(`${key}:format5-backup`)).toBe(original);
    persistence.dispose();
  });

  it('refuses an oversized profile without writing or dropping any character from the last valid data', async () => {
    const cloud: CloudPort = {
      ready: async () => ({ mode: 'authenticated', progressAvailable: true, capabilities: ['progress'] }),
      loadProgress: async () => null,
      saveProgress: vi.fn(async (input) => ({ ...input, saved: true, revision: 1, gameVersion: 'test', updatedAt: 'test' })),
    };
    const statuses: SaveStatus[] = [];
    const persistence = createPersistence({ gameId: 'profile-test', cloud, storage: null, catalog,
      onStatus: (status) => statuses.push(status) });
    await persistence.initialize();
    const original = twoCharacters();
    persistence.checkpointProfile!(original);
    await vi.waitFor(() => expect(statuses).toContain('saved'));
    const oversized = structuredClone(original);
    oversized.characters['archer-1']!.player.name = '測'.repeat(64 * 1024);
    persistence.checkpointProfile!(oversized);
    expect(statuses.at(-1)).toBe('saveError');
    expect(cloud.saveProgress).toHaveBeenCalledTimes(1);
    expect(persistence.getProfile!()).toEqual(original);
    persistence.dispose();
  });
});
