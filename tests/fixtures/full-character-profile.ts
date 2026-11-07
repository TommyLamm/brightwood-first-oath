import type { GameProfile, SaveData } from '../../src/contracts/index.js';
import { rulesCatalog } from '../../src/content/rules/index.js';
import { worldCatalog } from '../../src/content/world/index.js';
import { createPlayer, deriveStats } from '../../src/domain/progression/index.js';
import { createEmptyProfile, characterFromSave } from '../../src/persistence/profile.js';
import { questForPlayer } from '../../src/content/world/class-quests.js';

function save(archer = false): SaveData {
  return {
    player: createPlayer(archer ? '青翎' : '晨芽', rulesCatalog, archer ? 'archer' : 'swordsman'),
    quests: {}, visitedMaps: ['camp'], location: { mapId: 'camp', spawnId: 'start' },
    flags: { bossDefeated: false, chapterComplete: false },
    settings: { masterVolume: 0.8, musicVolume: 0.7, sfxVolume: 0.9, muted: false, bindings: {} },
  };
}

export function fullCharacterProfile(): GameProfile {
    const profile = createEmptyProfile(save().settings);
    profile.settings.bindings = Object.fromEntries(Array.from({ length: 64 }, (_, index) =>
      [`${String(index).padStart(2, '0')}${'鍵'.repeat(62)}`, '鍵'.repeat(64)]));
    for (let index = 0; index < 4; index += 1) {
      const data = save(index % 2 === 1);
      data.player.name = '測'.repeat(24);
      data.player.job = index % 2 === 1 ? 'archer' : 'swordsman';
      data.player.level = 30; data.player.ap = 145; data.player.sp = 0; data.player.coins = 9_999_999;
      const skills = data.player.job === 'archer'
        ? ['archer-double-shot', 'archer-piercing-shot', 'archer-retreat-shot', 'archer-bow-mastery', 'archer-steady-aim']
        : ['heavy-strike', 'sweep', 'iron-guard', 'vitality', 'rest-recovery'];
      data.player.skillRanks = Object.fromEntries(skills.map((id, rank) => [id, [10, 8, 1, 1, 1][rank]!]));
      const item = Object.values(rulesCatalog.items).sort((a, b) => b.id.length - a.id.length)[0]!;
      data.player.bag = Array.from({ length: 32 }, () => ({ itemId: item.id, quantity: item.stackLimit }));
      data.visitedMaps = Object.keys(worldCatalog.maps);
      data.quests = Object.fromEntries(Object.values(worldCatalog.quests).map((base) => {
        const quest = questForPlayer(base, data.player);
        return [quest.id, {
        status: 'claimed', counters: Object.fromEntries(quest.objectives.flatMap((objective) =>
          objective.type === 'kill' || objective.type === 'reach' || objective.type === 'inspect'
            ? [[objective.targetId, objective.count]] : [])),
      }]; }));
      const stats = deriveStats(data.player, rulesCatalog);
      data.player.hp = stats.maxHp; data.player.mp = stats.maxMp;
      const id = `character-${index + 1}`;
      profile.slots[index]!.characterId = id;
      profile.characters[id] = characterFromSave(data, id);
    }
    profile.activeCharacterId = 'character-1';
  return profile;
}
