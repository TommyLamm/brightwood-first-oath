import { ARCHER_MUZZLE } from '../contracts/archery.js';
import type {
  CombatActor,
  CombatState,
  ContentCatalog,
  EntityId,
  GameCommand,
  Id,
  InputFrame,
  MonsterState,
  MovementState,
  PanelId,
  RandomSource,
  SaveData,
} from '../contracts/index.js';
import { createMovement } from '../domain/movement/index.js';
import { stepPlayerMovement, type PlayerJumpMemory } from '../domain/movement/player-jump.js';
import { applyMonsterHit, createMonster, stepActors } from '../domain/actors/index.js';
import { createCombatState, stepCombat, tryAttack } from '../domain/combat/index.js';
import { applyProgressAction, createPlayer, deriveStats, validatePlayerName } from '../domain/progression/index.js';
import { acceptQuest, getQuestView, recordQuestEvent } from '../domain/quests/index.js';
import { resolveQuestClaim } from '../domain/quests/claim.js';
import { questDropByQuest } from '../content/rules/index.js';
import type { DropState, VisualEvent, WorldSnapshot } from '../contracts/ports.js';
import { INTERACTION_RANGE_PX, nearestNpcPlacement, portalBlockMessage, resolveInteractionTarget } from './interaction-target.js';
import { resolveItemUse } from './item-use.js';
import { findPickupTarget } from './pickup-target.js';
import { cloneProjectile } from '../domain/combat/projectiles.js';
import { effectiveJob, resolveSkillSlot, jobs, magePassiveRank, roguePassiveRank } from '../content/rules/jobs.js';
import { advancedSkill, playerSkillRank, specializations } from '../content/rules/specializations.js';
import { gainRhythm, lungeDestination, type RogueRhythm, type SmokeZone } from '../domain/combat/rogue.js';
import { blinkDestination, MAGE_MUZZLE } from '../domain/combat/mage.js';
import { AIM_TIME_MS, bowPassiveBonus, canStartRetreat, stepRetreat, type RetreatState } from '../domain/combat/archer.js';
import { ARCHERY_TARGET_IDS, ROGUE_TRIAL_IDS, classCatalog, classItemId } from '../content/world/class-quests.js';
import { deriveActiveGuard } from './guard-status.js';

const MAX_ACTIVE_EFFECTS = 80;
const BOSS_MONSTER_IDS = new Set(['guardian', 'frost-tide-warden', 'sunwell-sentinel', 'ruins-bell-keeper']);
const BOSS_ARENA_MAP_IDS = new Set(['guardian-arena', 'frost-tide-cavern', 'sand-sunwell-altar', 'ruins-bell-sanctum']);
const INSPECT_TARGETS = {
  'ruins-stele-west': { mapId: 'ruins-echo-gallery', questId: 'q17', action: '調律石碑' },
  'ruins-stele-east': { mapId: 'ruins-echo-gallery', questId: 'q17', action: '調律石碑' },
  'frost-route-marker': { mapId: 'frost-pine-pass', questId: 'q21', action: '調查航標' },
} as const;

export type GameplayState = {
  saveData: SaveData;
  playerEntityId: EntityId;
  movement: MovementState;
  jumpAssist?: PlayerJumpMemory;
  monsters: MonsterState[];
  combat: CombatState;
  drops: DropState[];
  telegraphs: import('../contracts/index.js').Telegraph[];
  effects: VisualEvent[];
  invulnerableUntilMs: number;
  attackOrDamageAtMs: number;
  nextRegenAtMs: number;
  guardUntilMs: number;
  potionReadyAtMs: number;
  nextPickupAtMs: number;
  bossResult: boolean;
  deathAtMs: number | null;
  toast: string | null;
  /** A toast that a successful swing must not wipe (it still expires normally), e.g. "quest ready". */
  stickyToast?: string;
  /** When the current toast text first appeared; used to auto-dismiss it. */
  toastShown?: { text: string; atMs: number };
  /** A skill pressed while the previous swing was still playing; it fires as soon as the swing ends. */
  bufferedAttack?: { skillId: Id; expiresAtMs: number };
  /** When 堅韌守護 was last cast, so the hero plays the buff pose for a moment (runtime only). */
  buffCastAtMs?: number;
  interaction: { npcId: Id; dialogue: string[] } | null;
  pendingTransition: { mapId: Id; spawnId: Id; after: 'travel' | 'respawn' | 'retryBoss' } | null;
  retreat?: RetreatState;
  aimStillMs?: number;
  aimReady?: boolean;
  rogueRhythm?: RogueRhythm;
  smoke?: SmokeZone;
  rogueTrial?: { position: { x: number; y: number }; resolveAtMs: number };
  poisons?: { targetId: string; damage: number; nextTickAtMs: number; expiresAtMs: number }[];
  rallyUntilMs?: number;
};

export type GameplayStepInput = {
  catalog: ContentCatalog;
  commands: readonly GameCommand[];
  input: InputFrame;
  dtSeconds: number;
  nowMs: number;
  random: RandomSource;
  nextEntityId: () => EntityId;
};

export type GameplayStepResult = {
  gameplay: GameplayState | null;
  jumped?: boolean;
  screen: 'title' | 'create' | 'loading' | 'playing' | 'paused' | 'dead' | 'result' | 'chapter' | 'error';
  openPanel?: PanelId;
};

export function startNewGame(
  name: string,
  catalog: ContentCatalog,
  nextEntityId: () => EntityId,
  plannedJob: import('../contracts/types.js').PlayerJob = 'swordsman',
): { gameplay: GameplayState; normalizedName: string } | { error: string } {
  const checkedName = validatePlayerName(name);
  if (!checkedName.ok) return { error: checkedName.message };
  const player = createPlayer(checkedName.value, catalog.rules, plannedJob);
  const map = catalog.world.maps.camp;
  const spawn = map?.spawns.find(({ id }) => id === 'start');
  if (!map || !spawn) return { error: '起始地圖缺少 camp/start 出生點。' };

  const saveData: SaveData = {
    player,
    quests: {},
    visitedMaps: ['camp'],
    location: { mapId: 'camp', spawnId: 'start' },
    flags: { bossDefeated: false, chapterComplete: false },
    settings: {
      masterVolume: 0.8,
      musicVolume: 0.35,
      sfxVolume: 0.65,
      muted: false,
      bindings: {},
    },
  };

  return {
    normalizedName: checkedName.value,
    gameplay: {
      saveData,
      playerEntityId: nextEntityId(),
      movement: createMovement({ x: spawn.x, y: spawn.y }),
      monsters: map.monsters.map((placement) => createMonster(nextEntityId(), placement, map, catalog.rules)),
      combat: createCombatState(),
      drops: [],
      telegraphs: [],
      effects: [],
      invulnerableUntilMs: 0,
      attackOrDamageAtMs: 0,
      nextRegenAtMs: 0,
      guardUntilMs: 0,
      potionReadyAtMs: 0,
      nextPickupAtMs: 0,
      bossResult: false,
      deathAtMs: null,
      // First-run hint: the footer only lists Z / Space, so new players had no on-screen cue for movement, jump or attack.
      toast: '方向鍵移動、Alt 跳躍、Ctrl 攻擊、Space 交談；右上角「?」可查看全部操作。',
      interaction: null,
      pendingTransition: null,
    },
  };
}

/** Rebuilds runtime-only world state from a validated save without restoring enemies or drops. */
export function restoreGame(
  source: SaveData,
  catalog: ContentCatalog,
  nextEntityId: () => EntityId,
): { gameplay: GameplayState; repairedArenaLocation: boolean } {
  const repairedArenaLocation = source.location.mapId === 'guardian-arena';
  const requested = repairedArenaLocation
    ? { mapId: 'mine-gate', spawnId: 'right' }
    : source.location;
  const targetMap = catalog.world.maps[requested.mapId] ?? catalog.world.maps.camp;
  const targetSpawn = targetMap?.spawns.find(({ id }) => id === requested.spawnId)
    ?? targetMap?.spawns.find(({ id }) => id === 'start')
    ?? targetMap?.spawns[0];
  if (!targetMap || !targetSpawn) throw new Error('找不到安全出生地圖或出生點。');

  const saveData: SaveData = {
    ...source,
    location: { mapId: targetMap.id, spawnId: targetSpawn.id },
    visitedMaps: source.visitedMaps.includes(targetMap.id)
      ? [...source.visitedMaps]
      : [...source.visitedMaps, targetMap.id],
    quests: Object.fromEntries(Object.entries(source.quests).map(([id, quest]) => [id, {
      ...quest,
      counters: { ...quest.counters },
    }])),
    player: {
      ...source.player,
      bag: source.player.bag.map((stack) => ({ ...stack })),
      equipment: { ...source.player.equipment },
      skillRanks: { ...source.player.skillRanks },
    },
    flags: { ...source.flags },
    settings: { ...source.settings, bindings: { ...source.settings.bindings } },
  };
  const playerEntityId = nextEntityId();
  const dead = saveData.player.hp <= 0;
  return {
    repairedArenaLocation,
    gameplay: {
      saveData,
      playerEntityId,
      movement: {
        ...createMovement({ x: targetSpawn.x, y: targetSpawn.y }),
        ...(dead ? { mode: 'dead' as const } : {}),
      },
      monsters: targetMap.monsters.map((placement) => createMonster(nextEntityId(), placement, targetMap, catalog.rules)),
      combat: createCombatState(),
      drops: [],
      telegraphs: [],
      effects: [],
      invulnerableUntilMs: 0,
      attackOrDamageAtMs: 0,
      nextRegenAtMs: 0,
      guardUntilMs: 0,
      potionReadyAtMs: 0,
      nextPickupAtMs: 0,
      bossResult: false,
      deathAtMs: dead ? 0 : null,
      toast: repairedArenaLocation ? '首領戰進度已安全返回礦道入口。' : null,
      interaction: null,
      pendingTransition: null,
    },
  };
}

/** Runs one authoritative gameplay tick in the project-defined order. */
export function stepGameplay(
  current: GameplayState | null,
  input: GameplayStepInput,
): GameplayStepResult {
  let gameplay = current;
  let screen: GameplayStepResult['screen'] = current ? 'playing' : 'title';
  let commands = input.commands;

  if (!gameplay) {
    const createCommand = commands.find((command) => command.type === 'newGame');
    if (!createCommand || createCommand.type !== 'newGame') return { gameplay: null, screen };
    const started = startNewGame(createCommand.payload.name, input.catalog, input.nextEntityId, createCommand.payload.plannedJob);
    if ('error' in started) return { gameplay: null, screen: 'create' };
    gameplay = started.gameplay;
    screen = 'playing';
    commands = commands.filter((command) => command.seq !== createCommand.seq);
  }

  gameplay = cloneGameplay(gameplay);
  input = { ...input, catalog: classCatalog(input.catalog, gameplay.saveData.player) };
  if (gameplay.movement.mode === 'climbing' || input.nowMs < gameplay.movement.knockbackUntilMs) interruptArcherCast(gameplay, input.catalog);
  if (gameplay.saveData.player.hp <= 0) {
    const actorsToClear = new Set<EntityId>([gameplay.playerEntityId]);
    for (const actorId of clearBellKeeperCombatOnPlayerDeath(gameplay)) actorsToClear.add(actorId);
    clearCombatForActors(gameplay, actorsToClear);
  }
  if (gameplay.pendingTransition) return { gameplay, screen: 'loading' };
  let openPanel: PanelId | undefined;
  for (const command of commands) {
    if (gameplay.saveData.player.hp <= 0 && command.type !== 'respawn') continue;
    const processed = processCommand(gameplay, command, input);
    gameplay = processed.gameplay;
    if (processed.screen) screen = processed.screen;
    if (processed.openPanel) openPanel = processed.openPanel;
  }
  const buffered = gameplay.bufferedAttack;
  if (buffered) {
    if (input.nowMs > buffered.expiresAtMs || gameplay.saveData.player.hp <= 0) {
      delete gameplay.bufferedAttack;
    } else if (!commands.some((command) => command.type === 'attack')) {
      gameplay = processCommand(gameplay, { seq: -1, type: 'attack', payload: { skillId: buffered.skillId } }, input).gameplay;
    }
  }

  if (gameplay.pendingTransition || screen !== 'playing' || gameplay.saveData.player.hp <= 0) {
    return {
      gameplay,
      screen: gameplay.pendingTransition ? 'loading' : gameplay.saveData.player.hp <= 0 ? 'dead' : screen,
      ...(openPanel ? { openPanel } : {}),
    };
  }

  const catalog = input.catalog;
  const map = catalog.world.maps[gameplay.saveData.location.mapId];
  if (!map) return { gameplay, screen: 'error' };

  // AI intent and monster movement precede player movement; T06 emits attack
  // requests here but T03 resolves them only after both sides have moved.
  const playerBeforeMove = playerCombatActor(gameplay, catalog, input.nowMs);
  if (gameplay.rogueRhythm && input.nowMs >= gameplay.rogueRhythm.expiresAtMs) delete gameplay.rogueRhythm;
  if (gameplay.smoke && input.nowMs >= gameplay.smoke.expiresAtMs) delete gameplay.smoke;
  gameplay.monsters = gameplay.monsters.map((monster) => ({ ...monster,
    smokeSlowedUntilMs: gameplay.smoke && input.nowMs < gameplay.smoke.expiresAtMs
      && Math.abs(monster.movement.position.x - gameplay.smoke.position.x) <= 105
      && Math.abs(monster.movement.position.y - gameplay.smoke.position.y) <= 40
      && !BOSS_MONSTER_IDS.has(monster.monsterId) ? input.nowMs + 1 : 0 }));
  // stepActors omits monsters whose respawn is due, so keep the pre-step list
  // to resolve each respawn request back to its spawn placement.
  const monstersBeforeStep = gameplay.monsters;
  const actorStep = stepActors(
    gameplay.monsters,
    playerBeforeMove,
    map,
    catalog.rules,
    input.dtSeconds,
    input.nowMs,
  );
  gameplay.monsters = actorStep.monsters;
  gameplay.telegraphs = actorStep.telegraphs;

  const attackLocked = gameplay.combat.attacks.some((attack) => {
    if (attack.sourceId !== gameplay!.playerEntityId) return false;
    const skill = catalog.rules.skills[attack.skillId];
    return skill !== undefined
      && input.nowMs < attack.startedAtMs + skill.windupMs + skill.activeMs + skill.recoveryMs;
  });
  const mageWindup = effectiveJob(gameplay.saveData.player) === 'mage' && gameplay.combat.attacks.some((attack) =>
    attack.sourceId === gameplay!.playerEntityId && input.nowMs - Math.max(0, input.dtSeconds) * 1000 < attack.startedAtMs + (catalog.rules.skills[attack.skillId]?.windupMs ?? 0));
  const rogueLocked = effectiveJob(gameplay.saveData.player) === 'rogue' && attackLocked;
  const movementConfig = mageWindup || rogueLocked ? { ...catalog.rules.movement, speed: 0 } : attackLocked
    ? { ...catalog.rules.movement, speed: catalog.rules.movement.speed * 0.25 }
    : catalog.rules.movement;
  const originalFacing = gameplay.movement.facing;
  const retreatStep = gameplay.retreat
    ? stepRetreat(gameplay.movement, gameplay.retreat, map, catalog.rules.movement, input.dtSeconds, input.nowMs) : null;
  if (retreatStep) {
    if (retreatStep.retreat) gameplay.retreat = retreatStep.retreat;
    else delete gameplay.retreat;
    delete gameplay.jumpAssist;
  }
  const playerMovement = retreatStep ? { movement: retreatStep.movement, memory: undefined, jumped: false } : stepPlayerMovement(
    gameplay.movement,
    mageWindup || rogueLocked ? { ...input.input, moveX: 0, climbY: 0, jumpPressed: false, downHeld: false } : input.input,
    map,
    movementConfig,
    input.dtSeconds,
    input.nowMs,
    gameplay.jumpAssist,
  );
  gameplay.movement = playerMovement.movement;
  gameplay.jumpAssist = playerMovement.memory;
  if (attackLocked) gameplay.movement = { ...gameplay.movement, facing: originalFacing };
  if (gameplay.movement.mode === 'climbing') interruptArcherCast(gameplay, catalog);

  for (const attack of gameplay.combat.attacks) {
    const rogueSkill = catalog.rules.skills[attack.skillId];
    if (input.dtSeconds > 0 && attack.sourceId === gameplay.playerEntityId
      && (attack.skillId === 'rogue-shadow-lunge' || attack.skillId === 'rogue-smoke') && rogueSkill
      && !attack.actionResolved && input.nowMs >= attack.startedAtMs + rogueSkill.windupMs) {
      attack.actionResolved = true;
      if (attack.skillId === 'rogue-shadow-lunge') {
        const claimed = new Set(Object.entries(gameplay.saveData.quests).filter(([, state]) => state.status === 'claimed').map(([id]) => id));
        const destination = lungeDestination({ ...gameplay.movement, facing: attack.facing }, map, catalog.rules.movement, input.nowMs, claimed);
        if (destination) { gameplay.movement = destination; delete gameplay.jumpAssist; }
        attack.origin = { ...gameplay.movement.position };
      } else gameplay.smoke = { position: { ...attack.origin }, expiresAtMs: attack.startedAtMs + rogueSkill.windupMs + rogueSkill.durationMs + (attack.rank - 1) * 100 };
    }
    if (input.dtSeconds <= 0 || attack.sourceId !== gameplay.playerEntityId || attack.skillId !== 'mage-blink'
      || attack.hitIds.includes('blink:resolved') || input.nowMs < attack.startedAtMs + 100) continue;
    attack.hitIds.push('blink:resolved');
    const claimed = new Set(Object.entries(gameplay.saveData.quests).filter(([, state]) => state.status === 'claimed').map(([id]) => id));
    const destination = blinkDestination({ ...gameplay.movement, facing: attack.facing }, map, catalog.rules.movement, input.nowMs, claimed);
    if (destination) { gameplay.movement = destination; delete gameplay.jumpAssist; }
  }

  const combatActors = buildCombatActors(gameplay, catalog, input.nowMs);
  for (const request of actorStep.attackRequests) {
    const proposal = tryAttack(
      gameplay.combat,
      request,
      combatActors,
      catalog.rules,
      input.nowMs,
      input.nextEntityId,
    );
    if (proposal.ok) gameplay.combat = proposal.value.state;
  }

  const combatSkillsById = new Map(gameplay.combat.attacks.map((attack) => [attack.id, attack.skillId]));
  const combatStep = stepCombat(
    gameplay.combat,
    combatActors,
    catalog.rules,
    input.dtSeconds,
    input.nowMs,
    input.random,
    map,
  );
  gameplay.combat = combatStep.state;

  if (input.dtSeconds > 0 && gameplay.saveData.player.hp > 0) {
    for (const poison of gameplay.poisons ?? []) {
      const target = gameplay.monsters.find((monster) => monster.id === poison.targetId);
      if (!target || target.hp <= 0) continue;
      while (poison.nextTickAtMs <= input.nowMs && poison.nextTickAtMs <= poison.expiresAtMs) {
        if (target.mode !== 'phase-transition') combatStep.hits.push({ attackId: 'poison', sourceId: gameplay.playerEntityId, targetId: target.id,
          damage: poison.damage, critical: false, knockback: { x: 0, y: 0 } });
        poison.nextTickAtMs += 1000;
      }
    }
    gameplay.poisons = (gameplay.poisons ?? []).filter((poison) => poison.nextTickAtMs <= poison.expiresAtMs
      && gameplay.monsters.some((monster) => monster.id === poison.targetId && monster.hp > 0));
  }

  for (const hit of combatStep.hits) {
    const targetId = hit.targetId.startsWith('training:') ? hit.targetId.slice('training:'.length) : null;
    if (targetId && (hit.projectile || effectiveJob(gameplay.saveData.player) === 'rogue')) {
      if (effectiveJob(gameplay.saveData.player) === 'rogue') {
        const skillId = combatSkillsById.get(hit.attackId);
        let objective: string | null = targetId === ROGUE_TRIAL_IDS[0] && skillId === 'dagger-basic' ? targetId : null;
        const attack = combatStep.state.attacks.find(({ id }) => id === hit.attackId);
        if (targetId === ROGUE_TRIAL_IDS[1] && skillId === 'rogue-double-stab'
          && attack?.meleeHitIds?.[0]?.includes(hit.targetId) && attack.meleeHitIds[1]?.includes(hit.targetId)) {
          objective = targetId;
          if (!gameplay.rogueTrial) {
            const placement = map.npcs.find(({ npcId }) => npcId === targetId)!;
            gameplay.rogueTrial = { position: { x: placement.x, y: placement.y }, resolveAtMs: input.nowMs + 900 };
            gameplay.toast = '紅框將在900ms後判定，請走出框線！';
          }
        }
        if (objective) gameplay.saveData.quests = recordQuestEvent(gameplay.saveData.quests,
          { type: 'inspected', targetId: objective }, catalog.world, gameplay.saveData.player);
        const placement = map.npcs.find(({ npcId }) => npcId === targetId);
        if (placement) pushEffect(gameplay, { id: input.nextEntityId(), kind: 'hit', position: { x: placement.x, y: placement.y - 24 }, atMs: input.nowMs });
        continue;
      }
      const placement = map.npcs.find(({ npcId }) => npcId === targetId);
      if (placement) {
        pushEffect(gameplay, {
          id: input.nextEntityId(),
          kind: 'hit',
          position: { x: placement.x, y: placement.y - 24 },
          atMs: input.nowMs,
          projectile: true,
          ...(effectiveJob(gameplay.saveData.player) === 'mage' ? { magic: true } : {}),
        });
      }
      const before = gameplay.saveData;
      gameplay.saveData = { ...before, quests: recordQuestEvent(before.quests, { type: 'inspected', targetId }, catalog.world, before.player) };
      if (JSON.stringify(before.quests) !== JSON.stringify(gameplay.saveData.quests)) {
        gameplay.toast = '命中' + (catalog.world.npcs[targetId]?.name ?? '試煉靶') + '。三靶全中後回' + (effectiveJob(before.player) === 'mage' ? '星蘅' : '青翎') + '領獎。';
        announceReadyQuests(gameplay, before, catalog);
      }
      continue;
    }
    if (hit.targetId === gameplay.playerEntityId) {
      if (input.nowMs < gameplay.invulnerableUntilMs) continue;
      const damaged = applyProgressAction(gameplay.saveData.player, { type: 'damage', amount: hit.damage }, catalog.rules);
      if (!damaged.ok) continue;
      gameplay.saveData = { ...gameplay.saveData, player: damaged.value };
      gameplay.invulnerableUntilMs = input.nowMs + 800;
      gameplay.attackOrDamageAtMs = input.nowMs;
      interruptArcherCast(gameplay, catalog);
      gameplay.movement = {
        ...gameplay.movement,
        velocity: { x: hit.knockback.x, y: hit.knockback.y },
        mode: 'airborne',
        footholdId: null,
        ladderId: null,
        knockbackUntilMs: input.nowMs + 180,
      };
      addEffect(gameplay, hit.targetId, 'damage', hit.damage, input.nowMs, input.nextEntityId);
      if (damaged.value.hp <= 0) screen = 'dead';
    } else {
      gameplay.monsters = applyMonsterHit(gameplay.monsters, hit, input.nowMs);
      if (hit.sourceId === gameplay.playerEntityId && effectiveJob(gameplay.saveData.player) === 'rogue'
        && roguePassiveRank(gameplay.saveData.player, catalog.rules, 'rogue-combo-rhythm') > 0) {
        gameplay.rogueRhythm = gainRhythm(gameplay.rogueRhythm, input.nowMs);
      }
      const resolvedSkill = hit.skillId ?? combatSkillsById.get(hit.attackId);
      if (resolvedSkill === 'shadowblade-venom') {
        const damage = Math.max(1, Math.floor(deriveStats(gameplay.saveData.player, catalog.rules).attack * .12 + (gameplay.saveData.player.luk ?? 0) * .05));
        gameplay.poisons = [...(gameplay.poisons ?? []).filter((poison) => poison.targetId !== hit.targetId),
          { targetId: hit.targetId, damage, nextTickAtMs: input.nowMs + 1000, expiresAtMs: input.nowMs + 4000 }];
      }
      if (resolvedSkill === 'arcanist-siphon' && hit.sourceId === gameplay.playerEntityId) {
        const restored = applyProgressAction(gameplay.saveData.player, { type: 'restore', hp: 0, mp: 6 }, catalog.rules);
        if (restored.ok) gameplay.saveData.player = restored.value;
      }
      if (resolvedSkill === 'mage-frost-ring' || resolvedSkill === 'elementalist-nova') gameplay.monsters = gameplay.monsters.map((monster) =>
        monster.id === hit.targetId && !BOSS_MONSTER_IDS.has(monster.monsterId) && monster.hp > 0
          ? { ...monster, slowedUntilMs: input.nowMs + 1500, provokedUntilMs: input.nowMs + 4000 } : monster);
      gameplay.attackOrDamageAtMs = input.nowMs;
      addEffect(gameplay, hit.targetId, 'hit', hit.damage, input.nowMs, input.nextEntityId, hit.critical);
      if (hit.projectile) gameplay.effects[gameplay.effects.length - 1]!.projectile = true;
      if (effectiveJob(gameplay.saveData.player) === 'mage' && hit.sourceId === gameplay.playerEntityId) gameplay.effects[gameplay.effects.length-1]!.magic = true;
    }
  }

  if (gameplay.rogueTrial && input.dtSeconds > 0) {
    const trial = gameplay.rogueTrial;
    if (input.nowMs >= trial.resolveAtMs) {
      const escaped = Math.abs(gameplay.movement.position.x - trial.position.x) > 90 + catalog.rules.movement.width / 2
        || Math.abs(gameplay.movement.position.y - trial.position.y) > 80;
      if (escaped) {
        gameplay.saveData.quests = recordQuestEvent(gameplay.saveData.quests,
          { type: 'inspected', targetId: ROGUE_TRIAL_IDS[2] }, catalog.world, gameplay.saveData.player);
        gameplay.toast = '撤離成功！完成三項訓練後回木葉鎮找夜嵐領獎。';
      } else gameplay.toast = '仍在紅框內。再對連刺靶完成兩段連刺，即可重試撤離。';
      delete gameplay.rogueTrial;
    } else gameplay.telegraphs.push({ id: 'rogue-trial-warning', sourceId: 'training:rogue-target-double', kind: 'rect',
      rect: { x: trial.position.x - 90, y: trial.position.y - 80, width: 180, height: 80 }, resolveAtMs: trial.resolveAtMs });
  }

  // T06's deathReported bit is the once-only event gate. Reward, drop creation
  // and quest progression are committed together from that event.
  for (const deadId of actorStep.deaths) {
    const dead = gameplay.monsters.find(({ id }) => id === deadId);
    if (dead) applyDeathEvent(gameplay, dead, catalog, input.nowMs, input.random, input.nextEntityId);
  }

  const combatSourcesToClear = new Set(gameplay.monsters
    .filter(({ mode }) => mode === 'dead')
    .map(({ id }) => id));
  if (gameplay.saveData.player.hp <= 0) {
    combatSourcesToClear.add(gameplay.playerEntityId);
    for (const actorId of clearBellKeeperCombatOnPlayerDeath(gameplay)) combatSourcesToClear.add(actorId);
  }
  clearCombatForActors(gameplay, combatSourcesToClear);

  if (actorStep.respawnRequests.length > 0) {
    const replacements = actorStep.respawnRequests.map((oldId) => {
      const old = monstersBeforeStep.find(({ id }) => id === oldId);
      const spawn = old && map.monsters.find(({ spawnId }) => spawnId === old.spawnId);
      return spawn ? createMonster(input.nextEntityId(), spawn, map, catalog.rules) : null;
    }).filter((monster): monster is MonsterState => monster !== null);
    const respawnIds = new Set(actorStep.respawnRequests);
    gameplay.monsters = [...gameplay.monsters.filter(({ id }) => !respawnIds.has(id)), ...replacements];
  }

  gameplay.drops = gameplay.drops.filter(({ expiresAtMs }) => input.nowMs < expiresAtMs);
  if (screen === 'dead') gameplay.movement = { ...gameplay.movement, mode: 'dead', velocity: { x: 0, y: 0 } };
  if (screen === 'dead' && gameplay.deathAtMs === null) gameplay.deathAtMs = input.nowMs;
  if (input.dtSeconds > 0 && gameplay.saveData.player.hp > 0) recoverWhileResting(gameplay, catalog, input.nowMs);
  updateArcherAim(gameplay, input);
  expireToast(gameplay, input.nowMs);
  // Hold the result screen until every guardian item (core and 守衛之刃) is picked up or has expired;
  // its 返回城鎮 button leaves the arena and would silently discard anything still on the floor.
  if (gameplay.bossResult && screen === 'playing' && !gameplay.drops.some(({ itemId }) => itemId !== null)) {
    screen = 'result';
  }
  return { gameplay, screen, ...(playerMovement.jumped ? { jumped: true } : {}), ...(openPanel ? { openPanel } : {}) };
}

function clearCombatForActors(gameplay: GameplayState, actorIds: ReadonlySet<EntityId>): void {
  if (actorIds.size === 0) return;
  gameplay.combat = {
    attacks: gameplay.combat.attacks.filter(({ sourceId }) => !actorIds.has(sourceId)),
    ...(gameplay.combat.projectiles ? { projectiles: gameplay.combat.projectiles.filter(({ sourceId }) => !actorIds.has(sourceId)).map(cloneProjectile) } : {}),
    cooldowns: Object.fromEntries(Object.entries(gameplay.combat.cooldowns)
      .filter(([actorId]) => !actorIds.has(actorId))
      .map(([actorId, cooldowns]) => [actorId, { ...cooldowns }])),
  };
  if (actorIds.has(gameplay.playerEntityId)) { delete gameplay.retreat; delete gameplay.aimStillMs; delete gameplay.aimReady;
    delete gameplay.rogueRhythm; delete gameplay.smoke; delete gameplay.rogueTrial; delete gameplay.poisons; delete gameplay.rallyUntilMs; }
}

function interruptArcherCast(gameplay: GameplayState, _catalog: ContentCatalog): void {
  if (effectiveJob(gameplay.saveData.player) === 'swordsman' && gameplay.saveData.player.specialization !== 'berserker') return;
  gameplay.combat.attacks = gameplay.combat.attacks.filter((attack) =>
    attack.sourceId !== gameplay.playerEntityId);
  delete gameplay.retreat;
  delete gameplay.aimStillMs;
  delete gameplay.aimReady;
  delete gameplay.bufferedAttack;
  delete gameplay.rogueRhythm;
}

function updateArcherAim(gameplay: GameplayState, input: GameplayStepInput): void {
  const eligible = bowPassiveBonus(gameplay.saveData.player, input.catalog.rules, 'archer-steady-aim') > 0
    && gameplay.saveData.player.hp > 0 && gameplay.movement.mode === 'grounded'
    && Math.abs(gameplay.movement.velocity.x) < 0.01 && !gameplay.retreat
    && input.input.moveX === 0 && input.input.climbY === 0 && !input.input.jumpPressed
    && input.nowMs >= gameplay.movement.knockbackUntilMs
    && !gameplay.combat.attacks.some((attack) => attack.sourceId === gameplay.playerEntityId);
  if (!eligible) { delete gameplay.aimStillMs; delete gameplay.aimReady; return; }
  gameplay.aimStillMs = Math.min(AIM_TIME_MS, (gameplay.aimStillMs ?? 0) + Math.max(0, input.dtSeconds * 1000));
  gameplay.aimReady = gameplay.aimStillMs >= AIM_TIME_MS;
}

export function makeWorldSnapshot(
  gameplay: GameplayState,
  catalog: ContentCatalog,
  nowMs: number,
): WorldSnapshot {
  const map = catalog.world.maps[gameplay.saveData.location.mapId];
  if (!map) throw new RangeError(`Unknown map in save location: ${gameplay.saveData.location.mapId}`);
  const stats = deriveStats(gameplay.saveData.player, catalog.rules);
  const movement = gameplay.movement;
  const animationKey = movement.mode === 'climbing'
    ? 'climb'
    : movement.mode === 'airborne'
      ? movement.velocity.y < 0 ? 'jump' : 'fall'
      : Math.abs(movement.velocity.x) > 0.1
        ? 'walk'
        // The hero's buff pose was loaded but never requested, so casting 堅韌守護 showed no motion.
        : gameplay.buffCastAtMs !== undefined && nowMs >= gameplay.buffCastAtMs && nowMs - gameplay.buffCastAtMs < BUFF_POSE_MS ? 'buff' : 'idle';
  const questViews = Object.keys(catalog.world.quests)
    .map((questId) => getQuestView(gameplay.saveData, questId, catalog));
  return {
    mapId: map.id,
    nowMs,
    questViews,
    player: {
      id: gameplay.playerEntityId,
      movement,
      hp: gameplay.saveData.player.hp,
      maxHp: stats.maxHp,
      animationKey,
      visual: { ...gameplay.saveData.player.equipment },
      invulnerableUntilMs: gameplay.invulnerableUntilMs,
        aimReady: gameplay.aimReady ?? false,
      rhythmStacks: gameplay.rogueRhythm && nowMs < gameplay.rogueRhythm.expiresAtMs ? gameplay.rogueRhythm.stacks : 0,
    },
    monsters: gameplay.monsters,
    poisonedIds: (gameplay.poisons ?? []).filter((poison) => nowMs <= poison.expiresAtMs).map((poison) => poison.targetId),
    drops: gameplay.drops,
    npcs: map.npcs,
    attacks: gameplay.combat.attacks,
    projectiles: gameplay.combat.projectiles ?? [],
    ...(gameplay.smoke ? { smoke: { ...gameplay.smoke, position: { ...gameplay.smoke.position } } } : {}),
    telegraphs: gameplay.telegraphs,
    effects: gameplay.effects,
  };
}

function processCommand(
  gameplay: GameplayState,
  command: GameCommand,
  context: GameplayStepInput,
): { gameplay: GameplayState; screen?: GameplayStepResult['screen']; openPanel?: PanelId } {
  const { catalog } = context;
  const player = gameplay.saveData.player;
  switch (command.type) {
    case 'advanceJob': {
      const mentor = { swordsman: 'mentor', archer: 'archer-mentor', mage: 'mage-mentor', rogue: 'rogue-mentor' }[effectiveJob(player)];
      if (gameplay.saveData.location.mapId !== 'town' || !nearNpc(gameplay, catalog, mentor, INTERACTION_RANGE_PX)) return withToast(gameplay, '請回木葉鎮，靠近本職業導師後選擇二轉分支。');
      const result = applyProgressAction(player, { type: 'advanceJob', ...command.payload }, catalog.rules);
      return result.ok ? { gameplay: withPlayer(gameplay, result.value, '已完成' + specializations[command.payload.specialization].name + '二轉；原技能和配點保留。') } : withToast(gameplay, result.message);
    }
    case 'setAdvancedSkill': {
      if (gameplay.combat.attacks.some((attack) => attack.sourceId === gameplay.playerEntityId)) return withToast(gameplay, '請在動作結束後切換技能槽。');
      const result = applyProgressAction(player, { type: 'setAdvancedSkill', ...command.payload }, catalog.rules);
      if (result.ok) delete gameplay.bufferedAttack;
      return result.ok ? { gameplay: withPlayer(gameplay, result.value, null) } : withToast(gameplay, result.message);
    }
    case 'attack': {
      const isBasic = ['basic', 'bow-basic', 'wand-basic', 'dagger-basic'].includes(command.payload.skillId);
      const skillId = isBasic ? resolveSkillSlot(player, 0) : command.payload.skillId;
      const skill = catalog.rules.skills[skillId];
      if (!skill || (skill.kind !== 'attack' && skill.kind !== 'buff' && skill.kind !== 'movement' && skill.kind !== 'zone')) return withToast(gameplay, '找不到可施放的技能。');
      const trialStab = isRogueTrial(gameplay) && skill.id === 'rogue-double-stab';
      if (skill.requiredSpecialization && advancedSkill(player) !== skill.id) return withToast(gameplay, '尚未解鎖這個二轉分支技能。');
      if (!isBasic && !trialStab && (skill.requiredJob !== player.job || player.level < skill.requiredLevel)) {
        return withToast(gameplay, skillLockedMessage(skill, player));
      }
      if (effectiveJob(player) === 'rogue') {
        if (!catalog.rules.items[player.equipment.weapon ?? '']?.allowedJobs?.includes('rogue')) return withToast(gameplay, '裝備短刃後才能攻擊。');
        if (gameplay.movement.mode !== 'grounded' || context.nowMs < gameplay.movement.knockbackUntilMs) return withToast(gameplay, '請站穩後使用短刃。');
        if (skill.id === 'rogue-shadow-lunge') {
          const map = catalog.world.maps[gameplay.saveData.location.mapId];
          const claimed = new Set(Object.entries(gameplay.saveData.quests).filter(([, state]) => state.status === 'claimed').map(([id]) => id));
          if (!map || !lungeDestination(gameplay.movement, map, catalog.rules.movement, context.nowMs, claimed)) return withToast(gameplay, '前方沒有安全切入空間。');
        }
      }
      if (effectiveJob(player) === 'archer') {
        const weapon = player.equipment.weapon ? catalog.rules.items[player.equipment.weapon] : null;
        if (!weapon?.allowedJobs?.includes('archer')) return withToast(gameplay, '裝備弓後才能射箭。');
        if (gameplay.movement.mode === 'climbing' || context.nowMs < gameplay.movement.knockbackUntilMs) {
          return withToast(gameplay, '攀爬或受擊硬直時無法射箭。');
        }
      }
      if (effectiveJob(player) === 'mage') {
        const weapon = catalog.rules.items[player.equipment.weapon ?? ''];
        if (!weapon?.allowedJobs?.includes('mage')) return withToast(gameplay, '裝備法杖後才能施法。');
        if (gameplay.movement.mode !== 'grounded' || context.nowMs < gameplay.movement.knockbackUntilMs) {
          return withToast(gameplay, '請站穩後施法。');
        }
        if (skill.id === 'mage-blink') {
          const map = catalog.world.maps[gameplay.saveData.location.mapId];
          const claimed = new Set(Object.entries(gameplay.saveData.quests).filter(([, state]) => state.status === 'claimed').map(([id]) => id));
          if (!map || !blinkDestination(gameplay.movement, map, catalog.rules.movement, context.nowMs, claimed)) {
            return withToast(gameplay, '閃現前方沒有安全落點。');
          }
        }
      }
      if (skill.id === 'archer-retreat-shot' || skill.id === 'ranger-volley') {
        const map = catalog.world.maps[gameplay.saveData.location.mapId];
        if (!map || !canStartRetreat(gameplay.movement, map, catalog.rules.movement, context.nowMs)) {
          return withToast(gameplay, '後撤射擊需要站穩，並在身後保留空間。');
        }
      }
      if (skill.kind === 'buff') {
        const rank = playerSkillRank(player, skill.id);
        if (rank < 1 || player.job !== 'swordsman' || player.level < skill.requiredLevel) {
          return withToast(gameplay, skillLockedMessage(skill, player));
        }
        const readyAt = gameplay.combat.cooldowns[gameplay.playerEntityId]?.[skill.id] ?? 0;
        if (context.nowMs < readyAt) return withToast(gameplay, '技能還在冷卻中。');
        const mp = applyProgressAction(player, { type: 'spendMp', amount: skill.mpCost }, catalog.rules);
        if (!mp.ok) return withToast(gameplay, mpShortMessage(skill, player.mp, mp.message));
        gameplay.saveData = { ...gameplay.saveData, player: mp.value };
        gameplay.combat = {
          ...gameplay.combat,
          cooldowns: {
            ...gameplay.combat.cooldowns,
            [gameplay.playerEntityId]: {
              ...(gameplay.combat.cooldowns[gameplay.playerEntityId] ?? {}),
              [skill.id]: context.nowMs + skill.cooldownMs,
            },
          },
        };
        if (skill.id === 'guardian-rally') {
          gameplay.rallyUntilMs = context.nowMs + skill.durationMs;
          const restored = applyProgressAction(gameplay.saveData.player, { type: 'restore', hp: Math.floor(deriveStats(player, catalog.rules).maxHp * .08), mp: 0 }, catalog.rules);
          if (restored.ok) gameplay.saveData.player = restored.value;
        } else gameplay.guardUntilMs = context.nowMs + skill.durationMs;
        gameplay.attackOrDamageAtMs = context.nowMs;
        gameplay.buffCastAtMs = context.nowMs;
        if (gameplay.toast !== gameplay.stickyToast) gameplay.toast = null;
        addEffect(gameplay, gameplay.playerEntityId, 'buff', rank, context.nowMs, context.nextEntityId);
        return { gameplay };
      }
      const actors = buildCombatActors(gameplay, catalog, context.nowMs);
      const proposal = tryAttack(gameplay.combat, {
        sourceId: gameplay.playerEntityId,
        skillId: skill.id,
        ...(gameplay.aimReady ? { firstHitBonus: bowPassiveBonus(player, catalog.rules, 'archer-steady-aim') } : {}),
        ...(gameplay.rogueRhythm?.stacks === 3 && context.nowMs < gameplay.rogueRhythm.expiresAtMs
          && ['rogue-double-stab', 'rogue-shadow-lunge'].includes(skill.id)
          ? { damageBonus: 0.015 * roguePassiveRank(player, catalog.rules, 'rogue-combo-rhythm') } : {}),
      }, actors, catalog.rules, context.nowMs, context.nextEntityId);
      if (!proposal.ok) {
        // A skill pressed mid-swing is buffered briefly so it chains off the swing instead of being lost.
        if (proposal.code === 'NOT_READY' && !isBasic) {
          if (gameplay.bufferedAttack?.skillId !== skill.id) {
            gameplay.bufferedAttack = { skillId: skill.id, expiresAtMs: context.nowMs + ATTACK_BUFFER_MS };
          }
          return { gameplay };
        }
        delete gameplay.bufferedAttack;
        // Mashing keys while a swing is still playing is normal input, not an error; neither is
        // mashing the basic attack during its own cooldown. Skill cooldowns still explain themselves.
        if (proposal.code === 'NOT_READY' || (isBasic && proposal.code === 'COOLDOWN')) return { gameplay };
        if (proposal.code === 'REQUIREMENT') return withToast(gameplay, skillLockedMessage(skill, player));
        return withToast(gameplay, attackFailureMessage(proposal.code));
      }
      delete gameplay.bufferedAttack;
      const mp = skill.mpCost > 0 && !trialStab
        ? applyProgressAction(player, { type: 'spendMp', amount: skill.mpCost }, catalog.rules)
        : { ok: true as const, value: player };
      if (!mp.ok) return withToast(gameplay, mpShortMessage(skill, player.mp, mp.message));
      gameplay.combat = proposal.value.state;
      if (proposal.value.attack.damageBonus) delete gameplay.rogueRhythm;
      gameplay.saveData = { ...gameplay.saveData, player: mp.value };
      if (skill.projectile) {
        delete gameplay.aimStillMs; delete gameplay.aimReady;
        if (skill.id === 'archer-retreat-shot' || skill.id === 'ranger-volley') gameplay.retreat = {
          startedAtMs: context.nowMs, facing: gameplay.movement.facing, distance: 0, jumped: false,
        };
      }
      if (gameplay.toast !== gameplay.stickyToast) gameplay.toast = null;
      gameplay.attackOrDamageAtMs = context.nowMs;
      return { gameplay };
    }
    case 'learnSkill': {
      const result = applyProgressAction(player, { type: 'learnSkill', skillId: command.payload.skillId }, catalog.rules);
      return result.ok
        ? { gameplay: withPlayer(gameplay, result.value, null) }
        : withToast(gameplay, result.message);
    }
    case 'allocateAp': {
      const result = applyProgressAction(player, { type: 'allocateAp', ...command.payload }, catalog.rules);
      return result.ok
        ? { gameplay: withPlayer(gameplay, result.value, null) }
        : withToast(gameplay, result.message);
    }
    case 'equip': {
      const result = applyProgressAction(player, { type: 'equip', bagIndex: command.payload.bagIndex }, catalog.rules);
      return result.ok
        ? { gameplay: withPlayer(gameplay, result.value, null) }
        : withToast(gameplay, result.message);
    }
    case 'unequip': {
      const result = applyProgressAction(player, { type: 'unequip', slot: command.payload.slot }, catalog.rules);
      return result.ok
        ? { gameplay: withPlayer(gameplay, result.value, null) }
        : withToast(gameplay, result.message);
    }
    case 'sell': {
      if (gameplay.interaction?.npcId !== 'merchant'
        || !nearNpc(gameplay, catalog, 'merchant', INTERACTION_RANGE_PX)) {
        return withToast(gameplay, '請靠近木葉商人並先與他互動再出售物品。');
      }
      const result = applyProgressAction(player, { type: 'sell', bagIndex: command.payload.bagIndex, quantity: command.payload.quantity }, catalog.rules);
      return result.ok
        ? { gameplay: withPlayer(gameplay, result.value, null) }
        : withToast(gameplay, result.message);
    }
    case 'buy': {
      if (gameplay.interaction?.npcId !== 'merchant'
        || !nearNpc(gameplay, catalog, 'merchant', INTERACTION_RANGE_PX)) {
        return withToast(gameplay, '請靠近木葉商人並先與他互動再購買物品。');
      }
      const result = applyProgressAction(player, { type: 'buy', ...command.payload }, catalog.rules);
      return result.ok
        ? { gameplay: withPlayer(gameplay, result.value, null) }
        : withToast(gameplay, result.message);
    }
    case 'useItem': {
      const result = resolveItemUse({
        player,
        rules: catalog.rules,
        requestedItemId: command.payload.itemId,
        nowMs: context.nowMs,
        potionReadyAtMs: gameplay.potionReadyAtMs,
      });
      if (!result.ok) return withToast(gameplay, result.message);
      gameplay.potionReadyAtMs = context.nowMs + 1000;
      return { gameplay: withPlayer(gameplay, result.value.player, null) };
    }
    case 'setSettings':
      return {
        gameplay: {
          ...gameplay,
          saveData: {
            ...gameplay.saveData,
            settings: {
              ...command.payload.settings,
              bindings: { ...command.payload.settings.bindings },
            },
          },
          toast: null,
        },
      };
    case 'pickup':
      return pickupNearest(gameplay, context);
    case 'interact':
      return interactNearest(gameplay, context);
    case 'inspect': {
      const targetId = command.payload.targetId;
      const inspection = Object.prototype.hasOwnProperty.call(INSPECT_TARGETS, targetId)
        ? INSPECT_TARGETS[targetId as keyof typeof INSPECT_TARGETS]
        : null;
      const action = inspection?.action ?? '調查目標';
      if (gameplay.saveData.player.hp <= 0 || gameplay.movement.mode === 'dead' || gameplay.deathAtMs !== null) {
        return withToast(gameplay, `倒下時無法${action}。`);
      }
      if (gameplay.pendingTransition) return withToast(gameplay, `切換地圖時無法${action}。`);
      if (!inspection) return withToast(gameplay, '找不到可調查的對象。');
      if (gameplay.saveData.location.mapId !== inspection.mapId) {
        return withToast(gameplay, inspection.questId === 'q21'
          ? '只有在霜松隘道才能調查航標。'
          : '只有在回聲長廊才能調律這些石碑。');
      }
      const map = catalog.world.maps[inspection.mapId];
      const placement = map?.npcs.find(({ npcId }) => npcId === targetId);
      if (!placement) return withToast(gameplay, inspection.questId === 'q21'
        ? '航標不在霜松隘道。'
        : '這塊石碑不在回聲長廊。');
      if (Math.hypot(
        placement.x - gameplay.movement.position.x,
        placement.y - gameplay.movement.position.y,
      ) > INTERACTION_RANGE_PX) {
        return withToast(gameplay, inspection.questId === 'q21' ? '請靠近航標再調查。' : '請靠近石碑再調律。');
      }
      if (gameplay.interaction?.npcId !== targetId) {
        return withToast(gameplay, inspection.questId === 'q21'
          ? '請先閱讀並開啟航標記錄。'
          : '請先閱讀並開啟這塊石碑的碑文。');
      }
      const quest = catalog.world.quests[inspection.questId];
      const questState = gameplay.saveData.quests[inspection.questId];
      if (!quest || questState?.status !== 'active'
        || !quest.objectives.some((objective) => objective.type === 'inspect' && objective.targetId === targetId)) {
        return withToast(gameplay, inspection.questId === 'q21'
          ? '先在雪芽身邊接取「風雪中的航標」，再調查航標。'
          : '先在行舟身邊接取「兩段回聲」，再調律石碑。');
      }
      if ((questState.counters[targetId] ?? 0) >= 1) {
        return withToast(gameplay, inspection.questId === 'q21' ? '這座航標已經調查。' : '這塊石碑已經調律。');
      }
      const saveData = {
        ...gameplay.saveData,
        quests: recordQuestEvent(gameplay.saveData.quests, { type: 'inspected', targetId }, catalog.world),
      };
      const tunedState = {
        ...gameplay,
        saveData,
        toast: inspection.questId === 'q21' ? '航標的方向已記錄。' : '石碑的回聲已應聲。',
      };
      return { gameplay: { ...tunedState, interaction: refreshInteraction(tunedState, catalog) } };
    }
    case 'acceptQuest': {
      const quest = catalog.world.quests[command.payload.questId];
      if (!quest || !nearNpc(gameplay, catalog, quest.giverNpcId, INTERACTION_RANGE_PX)) {
        return withToast(gameplay, '請到任務委託人身邊再接取。');
      }
      const accepted = acceptQuest(gameplay.saveData, command.payload.questId, catalog);
      if (!accepted.ok) return withToast(gameplay, accepted.message);
      const alreadyReached = quest.objectives.some((objective) =>
        objective.type === 'reach' && objective.targetId === accepted.value.location.mapId);
      const saveData = alreadyReached
        ? {
            ...accepted.value,
            quests: recordQuestEvent(accepted.value.quests, { type: 'reached', mapId: accepted.value.location.mapId }, catalog.world),
          }
        : accepted.value;
      const acceptedState = { ...gameplay, saveData, toast: null };
      return { gameplay: { ...acceptedState, interaction: refreshInteraction(acceptedState, catalog) } };
    }
    case 'claimQuest': {
      const quest = catalog.world.quests[command.payload.questId];
      if (!quest || !nearNpc(gameplay, catalog, quest.turnInNpcId, INTERACTION_RANGE_PX)) {
        return withToast(gameplay, '請到任務交付對象身邊再領取獎勵。');
      }
      const claim = resolveQuestClaim(gameplay.saveData, command.payload.questId, catalog);
      if (!claim.ok) return withToast(gameplay, claim.message);
      const { player: claimedPlayer, nextQuests, reward } = claim.value;
      const isChapterComplete = command.payload.questId === 'q08';
      if (claimedPlayer.level > player.level) {
        addEffect(gameplay, gameplay.playerEntityId, 'levelup', claimedPlayer.level, context.nowMs, context.nextEntityId);
      }
      const saveData = {
        ...gameplay.saveData,
        player: claimedPlayer,
        quests: nextQuests,
        flags: isChapterComplete
          ? { ...gameplay.saveData.flags, chapterComplete: true }
          : gameplay.saveData.flags,
      };
      return {
        gameplay: {
          ...gameplay,
          saveData,
          interaction: refreshInteraction({ ...gameplay, saveData }, catalog),
          toast: isChapterComplete
            ? '已完成第一章「守衛的誓約」，可繼續自由探索木葉世界。'
            : questRewardToast(quest.name, reward, player.level, claimedPlayer.level, catalog),
        },
        // Spec: claiming q08 shows the chapter settlement (world frozen until dismissed).
        ...(isChapterComplete ? { screen: 'chapter' as const } : {}),
      };
    }
    case 'returnTown': {
      const currentMapId = gameplay.saveData.location.mapId;
      if (BOSS_ARENA_MAP_IDS.has(currentMapId) && !gameplay.bossResult) {
        return withToast(gameplay, '首領戰尚未結束，暫時不能返回安全地點。');
      }
      if (currentMapId === 'ruins-bell-sanctum' && gameplay.bossResult) {
        return requestTransition(gameplay, 'ruins-tide-camp', 'left', 'travel', catalog);
      }
      if (currentMapId === 'sand-sunwell-altar' && gameplay.bossResult) {
        return requestTransition(gameplay, 'sand-sunwell-basin', 'right', 'travel', catalog);
      }
      if (currentMapId === 'frost-tide-cavern' && gameplay.bossResult) {
        return requestTransition(gameplay, 'frost-shore', 'left', 'travel', catalog);
      }
      if (!gameplay.saveData.visitedMaps.includes('town')) {
        return withToast(gameplay, '還沒到過木葉鎮；完成森芽的委託後，從營地東側出口前往。');
      }
      return requestTransition(gameplay, 'town', 'center', 'travel', catalog);
    }
    case 'retryBoss': {
      const currentMapId = gameplay.saveData.location.mapId;
      const currentMap = catalog.world.maps[currentMapId];
      if (!currentMap?.boss || !gameplay.bossResult) {
        return withToast(gameplay, '目前沒有可重試的首領戰。');
      }
      const retrySpawn = currentMap.spawns.find(({ id }) => id === 'entry') ?? currentMap.spawns.find(({ id }) => id === 'left');
      if (!retrySpawn) return withToast(gameplay, '找不到首領戰的重試出生點。');
      return requestTransition(gameplay, currentMapId, retrySpawn.id, 'retryBoss', catalog);
    }
    case 'respawn': {
      if (player.hp > 0 || gameplay.deathAtMs === null) {
        return withToast(gameplay, '目前還不能返回安全地點。');
      }
      const destination = gameplay.saveData.visitedMaps.includes('town')
        ? { mapId: 'town', spawnId: 'center' }
        : { mapId: 'camp', spawnId: 'start' };
      return requestTransition(gameplay, destination.mapId, destination.spawnId, 'respawn', catalog);
    }
    default:
      return { gameplay };
  }
}

function withPlayer(gameplay: GameplayState, player: GameplayState['saveData']['player'], toast: string | null): GameplayState {
  return { ...gameplay, saveData: { ...gameplay.saveData, player }, toast };
}

function nearNpc(gameplay: GameplayState, catalog: ContentCatalog, npcId: string, radius: number): boolean {
  const map = catalog.world.maps[gameplay.saveData.location.mapId];
  return nearestNpcPlacement(map, gameplay.movement.position, radius)?.npcId === npcId;
}

function interactNearest(gameplay: GameplayState, context: GameplayStepInput): { gameplay: GameplayState; screen?: GameplayStepResult['screen']; openPanel?: PanelId } {
  const { catalog } = context;
  const map = catalog.world.maps[gameplay.saveData.location.mapId];
  const target = resolveInteractionTarget(map, gameplay.movement.position);
  if (target?.kind === 'npc') {
    const definition = catalog.world.npcs[target.placement.npcId];
    if (!definition) return withToast(gameplay, '找不到這位 NPC 的對話資料。');
    if (definition.role === 'healer') {
      const stats = deriveStats(gameplay.saveData.player, catalog.rules);
      gameplay.saveData = {
        ...gameplay.saveData,
        player: { ...gameplay.saveData.player, hp: stats.maxHp, mp: stats.maxMp },
      };
    }
    gameplay.interaction = { npcId: definition.id, dialogue: npcDialogue(gameplay.saveData, definition.id, catalog) };
    gameplay.toast = definition.role === 'healer' ? '體力與魔力已恢復。' : null;
    return { gameplay, ...(definition.role === 'merchant' ? { openPanel: 'shop' as const } : { openPanel: 'dialogue' as const }) };
  }

  if (target?.kind === 'portal') {
    const blockMessage = portalBlockMessage(gameplay.saveData, target.portal, catalog);
    if (blockMessage) return withToast(gameplay, blockMessage);
    return requestTransition(gameplay, target.portal.targetMapId, target.portal.targetSpawnId, 'travel', catalog);
  }
  return withToast(gameplay, '附近沒有可以互動的對象或出入口。');
}

function npcDialogue(saveData: SaveData, npcId: string, catalog: ContentCatalog): string[] {
  const definition = catalog.world.npcs[npcId];
  if (!definition) return [];
  const dialogue = (catalog.world.dialogues[definition.dialogueId] ?? []).map(({ text }) => text);
  const history = npcId === 'ruins-stele-west'
    ? '守護的是歸途，'
    : npcId === 'ruins-stele-east' ? '不是封鎖所有來路。' : null;
  if (history && (saveData.quests.q17?.counters[npcId] ?? 0) >= 1) dialogue.push(history);
  if (npcId === 'ruins-pathfinder' && saveData.quests.q17?.status === 'claimed') {
    dialogue.push('兩段回聲都記下來了。它們守護的是歸途，不是封鎖所有來路。長廊深處還傳來更悠遠的鐘響，像是下一段航程的方向。');
  }
  for (const quest of Object.values(catalog.world.quests)) {
    const view = getQuestView(saveData, quest.id, catalog);
    const relevant = (quest.giverNpcId === definition.id && view.status === 'available')
      || (quest.turnInNpcId === definition.id && (view.status === 'active' || view.status === 'ready'));
    if (relevant) {
      dialogue.push(view.status === 'ready' ? quest.completeText : view.status === 'available'
        ? quest.acceptText : quest.progressText);
    }
  }
  return dialogue;
}

/** Accepting or claiming changes which quest line the NPC should be speaking; refresh the open dialogue. */
function refreshInteraction(gameplay: GameplayState, catalog: ContentCatalog): GameplayState['interaction'] {
  const interaction = gameplay.interaction;
  if (!interaction) return interaction;
  return { ...interaction, dialogue: npcDialogue(gameplay.saveData, interaction.npcId, catalog) };
}

function pickupNearest(gameplay: GameplayState, context: GameplayStepInput): { gameplay: GameplayState } {
  if (context.nowMs < gameplay.nextPickupAtMs) return { gameplay };
  // Resolve again against the command's current player; never apply a result stored by the UI.
  const target = findPickupTarget(gameplay.drops, gameplay.movement.position, context.nowMs, gameplay.saveData.player, context.catalog.rules);
  if (!target) return withToast(gameplay, '附近沒有可以拾取的物品。');
  const { drop, result } = target;
  gameplay.nextPickupAtMs = context.nowMs + 150;
  if (!result.ok) return withToast(gameplay, result.message);
  const beforePickup = gameplay.saveData;
  gameplay.saveData = { ...gameplay.saveData, player: result.value };
  gameplay.drops = gameplay.drops.filter(({ id }) => id !== drop.id);
  // Don't let the loot line bury a "quest ready" notice that is still on screen.
  if (!gameplay.stickyToast || gameplay.toast !== gameplay.stickyToast) gameplay.toast = drop.itemId === null ? `取得 ${drop.coins} 金幣。` : `取得 ${context.catalog.rules.items[drop.itemId]?.name ?? drop.itemId} × ${drop.quantity}。`;
  announceReadyQuests(gameplay, beforePickup, context.catalog);
  addEffect(gameplay, gameplay.playerEntityId, 'pickup', drop.quantity || drop.coins, context.nowMs, context.nextEntityId);
  return { gameplay };
}

function requestTransition(
  gameplay: GameplayState,
  mapId: string,
  spawnId: string,
  after: NonNullable<GameplayState['pendingTransition']>['after'],
  catalog: ContentCatalog,
): { gameplay: GameplayState; screen: 'loading' | 'playing' } {
  const map = catalog.world.maps[mapId];
  if (!map || !map.spawns.some(({ id }) => id === spawnId)) {
    return { gameplay: { ...gameplay, toast: '目的地地圖或出生點資料不存在。' }, screen: 'playing' };
  }
  gameplay.pendingTransition = { mapId, spawnId, after };
  gameplay.combat = createCombatState();
  delete gameplay.rogueRhythm; delete gameplay.smoke; delete gameplay.rogueTrial; delete gameplay.poisons; delete gameplay.rallyUntilMs;
  delete gameplay.bufferedAttack;
  delete gameplay.retreat; delete gameplay.aimStillMs; delete gameplay.aimReady;
  gameplay.toast = '正在載入地圖…';
  return { gameplay, screen: 'loading' };
}

/** Commits location and map-owned state only after WorldRenderer.loadMap succeeds. */
export function completeMapTransition(
  current: GameplayState,
  catalog: ContentCatalog,
  nextEntityId: () => EntityId,
  nowMs: number,
): GameplayStepResult {
  const pending = current.pendingTransition;
  if (!pending) return { gameplay: current, screen: current.saveData.player.hp <= 0 ? 'dead' : current.bossResult ? 'result' : 'playing' };
  const map = catalog.world.maps[pending.mapId];
  const spawn = map?.spawns.find(({ id }) => id === pending.spawnId);
  if (!map || !spawn) return failMapTransition(current, '目的地地圖或出生點資料不存在。');

  const visitedMaps = current.saveData.visitedMaps.includes(map.id)
    ? [...current.saveData.visitedMaps]
    : [...current.saveData.visitedMaps, map.id];
  let saveData = { ...current.saveData, location: { mapId: map.id, spawnId: spawn.id }, visitedMaps };
  let screen: GameplayStepResult['screen'] = 'playing';
  if (pending.after === 'respawn') {
    const stats = deriveStats(saveData.player, catalog.rules);
    saveData = { ...saveData, player: { ...saveData.player, hp: stats.maxHp, mp: stats.maxMp } };
  }
  if (pending.after === 'retryBoss' && map.id === 'guardian-arena') {
    saveData = { ...saveData, flags: { ...saveData.flags, bossDefeated: false } };
  }
  saveData = {
    ...saveData,
    quests: recordQuestEvent(saveData.quests, { type: 'reached', mapId: map.id }, catalog.world),
  };

  const gameplay: GameplayState = {
    ...current,
    saveData,
    playerEntityId: current.playerEntityId,
    movement: createMovement({ x: spawn.x, y: spawn.y }),
    monsters: map.monsters.map((placement) => createMonster(nextEntityId(), placement, map, catalog.rules)),
    poisons: [],
    rallyUntilMs: 0,
    combat: createCombatState(),
    drops: [],
    telegraphs: [],
    effects: [],
    invulnerableUntilMs: pending.after === 'respawn' ? nowMs + 800 : current.invulnerableUntilMs,
    attackOrDamageAtMs: nowMs,
    nextRegenAtMs: 0,
    guardUntilMs: pending.after === 'respawn' ? 0 : current.guardUntilMs,
    bossResult: false,
    deathAtMs: null,
    interaction: null,
    pendingTransition: null,
    toast: null,
  };
  delete gameplay.jumpAssist;
  if (pending.after === 'retryBoss') gameplay.bossResult = false;
  if (pending.after === 'respawn') screen = 'playing';
  return { gameplay, screen };
}

/** Load failures leave saved location, progress and checkpoint eligibility untouched. */
export function failMapTransition(current: GameplayState, message: string): GameplayStepResult {
  const after = current.pendingTransition?.after;
  return {
    gameplay: { ...current, pendingTransition: null, toast: `地圖載入失敗：${message}` },
    screen: after === 'respawn' ? 'dead' : after === 'retryBoss' ? 'result' : 'playing',
  };
}

// Toasts used to stay up until some later action cleared them, so e.g. the chapter-complete
// message sat over every panel for the rest of the session.
const TOAST_DURATION_MS = 6000;
/** How long a skill pressed mid-swing waits for the swing to finish before it is dropped. */
const ATTACK_BUFFER_MS = 600;
const BUFF_POSE_MS = 400;

function expireToast(gameplay: GameplayState, nowMs: number): void {
  if (gameplay.toast !== gameplay.stickyToast) delete gameplay.stickyToast;
  if (gameplay.toast === null) {
    delete gameplay.toastShown;
  } else if (gameplay.toastShown?.text !== gameplay.toast) {
    gameplay.toastShown = { text: gameplay.toast, atMs: nowMs };
  } else if (nowMs - gameplay.toastShown.atMs >= TOAST_DURATION_MS) {
    gameplay.toast = null;
    delete gameplay.toastShown;
  }
}

function recoverWhileResting(gameplay: GameplayState, catalog: ContentCatalog, nowMs: number): void {
  const mage = effectiveJob(gameplay.saveData.player) === 'mage';
  const rank = mage ? magePassiveRank(gameplay.saveData.player, catalog.rules, 'mage-mana-affinity')
    : gameplay.saveData.player.skillRanks['rest-recovery'] ?? 0;
  const recoveryStartsAtMs = gameplay.attackOrDamageAtMs + 3000;
  if (rank < 1 || nowMs < recoveryStartsAtMs) {
    gameplay.nextRegenAtMs = 0;
    return;
  }
  if (gameplay.nextRegenAtMs === 0 || gameplay.nextRegenAtMs < recoveryStartsAtMs) {
    gameplay.nextRegenAtMs = recoveryStartsAtMs;
  }
  if (nowMs < gameplay.nextRegenAtMs) return;
  const restored = applyProgressAction(gameplay.saveData.player, { type: 'restore', hp: mage ? 0 : rank * 2, mp: mage ? rank : 0 }, catalog.rules);
  if (restored.ok) gameplay.saveData = { ...gameplay.saveData, player: restored.value };
  gameplay.nextRegenAtMs = nowMs + 2000;
}

function applyDeathEvent(
  gameplay: GameplayState,
  monster: MonsterState,
  catalog: ContentCatalog,
  nowMs: number,
  random: RandomSource,
  nextEntityId: () => EntityId,
): void {
  const definition = catalog.rules.monsters[monster.monsterId];
  if (!definition) return;
  const rewarded = applyProgressAction(gameplay.saveData.player, {
    type: 'gainReward',
    reward: { exp: definition.exp, coins: 0, items: [] },
  }, catalog.rules);
  const levelBefore = gameplay.saveData.player.level;
  const toastBeforeKill = gameplay.toast;
  if (rewarded.ok) gameplay.saveData = { ...gameplay.saveData, player: rewarded.value };
  const beforeKill = gameplay.saveData;
  gameplay.saveData = {
    ...gameplay.saveData,
    quests: recordQuestEvent(gameplay.saveData.quests, { type: 'killed', monsterId: monster.monsterId }, catalog.world),
  };
  announceReadyQuests(gameplay, beforeKill, catalog);

  const drops: { itemId: string | null; quantity: number; coins: number }[] = [
    { itemId: null, quantity: 0, coins: definition.coins },
  ];
  for (const drop of definition.drops) {
    if (random.next() >= drop.chance) continue;
    const span = drop.max - drop.min + 1;
    const quantity = drop.min + Math.floor(random.next() * span);
    drops.push({ itemId: classItemId(drop.itemId, gameplay.saveData.player), quantity, coins: 0 });
  }
  for (const [questId, conditional] of Object.entries(questDropByQuest)) {
    if (conditional.monsterId === monster.monsterId && gameplay.saveData.quests[questId]?.status === 'active') {
      const quest = catalog.world.quests[questId];
      const required = quest?.objectives
        .filter((objective) => objective.type === 'collect' && objective.targetId === conditional.itemId)
        .reduce((sum, objective) => sum + objective.count, 0) ?? 1;
      const inBag = gameplay.saveData.player.bag
        .filter((stack) => stack.itemId === conditional.itemId)
        .reduce((sum, stack) => sum + stack.quantity, 0);
      const onGround = gameplay.drops
        .filter((drop) => drop.itemId === conditional.itemId)
        .reduce((sum, drop) => sum + drop.quantity, 0);
      if (inBag + onGround < required) {
        drops.push({ itemId: conditional.itemId, quantity: 1, coins: 0 });
      }
    }
  }

  if (BOSS_MONSTER_IDS.has(monster.monsterId)) {
    const orderedDrops = [...drops].sort((a, b) => {
      const priority = (entry: typeof drops[number]) =>
        entry.itemId === null ? 0 : catalog.rules.items[entry.itemId]?.kind === 'quest' ? 1 : 2;
      return priority(a) - priority(b);
    });
    const remainingDrops: typeof drops = [];
    for (const drop of orderedDrops) {
      const collected = drop.itemId === null
        ? applyProgressAction(gameplay.saveData.player, { type: 'gainReward', reward: { exp: 0, coins: drop.coins, items: [] } }, catalog.rules)
        : applyProgressAction(gameplay.saveData.player, { type: 'addItem', stack: { itemId: drop.itemId, quantity: drop.quantity } }, catalog.rules);
      if (collected.ok) {
        gameplay.saveData = { ...gameplay.saveData, player: collected.value };
      } else {
        remainingDrops.push(drop);
      }
    }
    gameplay.drops.push(...remainingDrops.map((drop, index) => ({
      id: nextEntityId(),
      ...drop,
      position: scatterDropPosition(monster, index, remainingDrops.length, gameplay, catalog),
      expiresAtMs: nowMs + 120_000,
    })));
    if (monster.monsterId === 'guardian') {
      gameplay.saveData = {
        ...gameplay.saveData,
        flags: { ...gameplay.saveData.flags, bossDefeated: true },
      };
    }
    gameplay.bossResult = true;
    if (monster.monsterId === 'frost-tide-warden') {
      gameplay.toast = '冰潮守望獸已倒下，可返回雪痕海岸向雪芽回報。';
    } else if (monster.monsterId === 'sunwell-sentinel') {
      gameplay.toast = '日井守衛已倒下，可返回日井盆地並回琉砂完成誓約。';
    } else if (monster.monsterId === 'ruins-bell-keeper') {
      gameplay.toast = '失序司鐘者已倒下，誓鐘恢復了寧靜。';
    } else if (remainingDrops.some(({ itemId }) => itemId === 'guardian-core')) {
      gameplay.toast = '背包空間不足，請先整理背包並拾取守衛核心。';
    } else if (remainingDrops.some(({ itemId }) => itemId !== null)) {
      gameplay.toast = '背包空間不足，守衛的掉落物留在地上，整理背包後再拾取。';
    }
  } else {
    gameplay.drops.push(...drops.map((drop, index) => ({
      id: nextEntityId(),
      ...drop,
      position: scatterDropPosition(monster, index, drops.length, gameplay, catalog),
      expiresAtMs: nowMs + 120_000,
    })));
  }
  // The reward used to be emitted as 'damage', so a kill printed its EXP in the hero's hurt colour.
  if (rewarded.ok && definition.exp > 0) addEffect(gameplay, monster.id, 'exp', definition.exp, nowMs, nextEntityId);
  if (gameplay.saveData.player.level > levelBefore) {
    addEffect(gameplay, gameplay.playerEntityId, 'levelup', gameplay.saveData.player.level, nowMs, nextEntityId);
    // Say what the level bought and where to spend it, unless this kill already raised a notice
    // (quest ready, bag full) or a quest-ready notice is still showing.
    if (gameplay.toast === toastBeforeKill && (!gameplay.stickyToast || gameplay.toast !== gameplay.stickyToast)) {
      const player = gameplay.saveData.player;
      const gained = player.level - levelBefore;
      const atCap = player.level >= catalog.rules.progression.maxLevel;
      gameplay.toast = '升到 Lv.' + player.level + (atCap ? '（已達上限）' : '') + '！獲得 ' + gained * 5 + ' AP'
        + (player.job !== 'beginner' ? '、' + gained + ' SP，可在能力與技能面板分配。' : '，可在能力面板分配。');
      gameplay.stickyToast = gameplay.toast;
    }
  }
}

const DROP_SPREAD_PX = 34;

/**
 * A kill's coins and items used to land on the exact same pixel, so only the top label was
 * readable. Fan them out along the monster's foothold (following slopes, never past its ends).
 */
function scatterDropPosition(
  monster: GameplayState['monsters'][number],
  index: number,
  count: number,
  gameplay: GameplayState,
  catalog: ContentCatalog,
): { x: number; y: number } {
  const origin = monster.movement.position;
  if (count <= 1) return { ...origin };
  const foothold = catalog.world.maps[gameplay.saveData.location.mapId]?.footholds
    .find(({ id }) => id === monster.movement.footholdId);
  const wanted = origin.x + (index - (count - 1) / 2) * DROP_SPREAD_PX;
  if (!foothold) return { x: wanted, y: origin.y };
  const left = Math.min(foothold.x1, foothold.x2) + 8;
  const right = Math.max(foothold.x1, foothold.x2) - 8;
  const x = left <= right ? Math.min(right, Math.max(left, wanted)) : origin.x;
  const span = foothold.x2 - foothold.x1;
  const footY = span === 0 ? foothold.y1 : foothold.y1 + ((x - foothold.x1) / span) * (foothold.y2 - foothold.y1);
  // Keep the monster's own offset from the foothold line (its feet may sit a pixel above it).
  const originFootY = span === 0 ? foothold.y1 : foothold.y1 + ((origin.x - foothold.x1) / span) * (foothold.y2 - foothold.y1);
  return { x, y: origin.y + (footY - originFootY) };
}

function isRogueTrial(gameplay: GameplayState): boolean {
  return gameplay.saveData.player.job === 'beginner' && effectiveJob(gameplay.saveData.player) === 'rogue'
    && gameplay.saveData.location.mapId === 'town' && gameplay.saveData.quests.q02?.status === 'active';
}

function buildCombatActors(gameplay: GameplayState, catalog: ContentCatalog, nowMs: number): CombatActor[] {
  return [
    playerCombatActor(gameplay, catalog, nowMs),
    ...(['archer', 'mage', 'rogue'].includes(effectiveJob(gameplay.saveData.player))
      ? (catalog.world.maps[gameplay.saveData.location.mapId]?.npcs ?? [])
        .filter(({ npcId }) => effectiveJob(gameplay.saveData.player) === 'rogue'
          ? isRogueTrial(gameplay) && ROGUE_TRIAL_IDS.slice(0, 2).some((id) => id === npcId)
          : ARCHERY_TARGET_IDS.some((id) => id === npcId))
        .map((placement): CombatActor => ({ id: 'training:' + placement.npcId,
          position: { x: placement.x, y: placement.y }, facing: 1, hp: 1, faction: 'enemy',
          stats: { maxHp: 1, maxMp: 0, attack: 0, defense: 0, critChance: 0 }, body: { width: 30, height: 48 },
          knockbackImmune: true, skillRanks: {} })) : []),
    ...gameplay.monsters.filter(({ hp, mode }) => hp > 0 && mode !== 'dead').map((monster): CombatActor => {
      const definition = catalog.rules.monsters[monster.monsterId]!;
      return {
        id: monster.id,
        position: monster.attackOrigin ? { ...monster.attackOrigin } : { ...monster.movement.position },
        facing: monster.attackFacing ?? monster.movement.facing,
        hp: monster.hp,
        stats: { maxHp: definition.maxHp, maxMp: 0, attack: definition.attack, defense: definition.defense, critChance: 0 },
        faction: 'enemy',
        body: { width: monster.width, height: monster.height },
        ...(definition.projectileHeight ? { projectileHeight: definition.projectileHeight } : {}),
        knockbackImmune: BOSS_MONSTER_IDS.has(monster.monsterId),
        projectileImmune: monster.mode === 'phase-transition',
        skillRanks: monster.pendingSkillId ? { [monster.pendingSkillId]: 1 } : {},
      };
    }),
  ];
}

function playerCombatActor(gameplay: GameplayState, catalog: ContentCatalog, nowMs: number): CombatActor {
  const stats = deriveStats(gameplay.saveData.player, catalog.rules);
  const guardBonus = deriveActiveGuard(gameplay, catalog, nowMs)?.defenseBonus ?? 0;
  return {
    id: gameplay.playerEntityId,
    position: { ...gameplay.movement.position },
    facing: gameplay.movement.facing,
    hp: gameplay.saveData.player.hp,
    stats: { ...stats, defense: stats.defense + guardBonus },
    faction: 'player',
    body: { width: catalog.rules.movement.width, height: catalog.rules.movement.height },
    knockbackImmune: false,
    skillRanks: isRogueTrial(gameplay) ? { ...gameplay.saveData.player.skillRanks, 'rogue-double-stab': 1 } : gameplay.saveData.player.skillRanks,
    ...(gameplay.saveData.player.specialization ? { specialization: gameplay.saveData.player.specialization } : {}),
    ...(effectiveJob(gameplay.saveData.player) === 'archer' ? { projectileOffset: ARCHER_MUZZLE } : {}),
    ...(effectiveJob(gameplay.saveData.player) === 'mage' ? { projectileOffset: MAGE_MUZZLE } : {}),
    ...(effectiveJob(gameplay.saveData.player) === 'rogue' ? { projectileOffset: { x: 22, y: -38 } } : {}),
  };
}

/** The dead screen does not step actors again, so cancel this boss's pending combat in the death tick. */
function clearBellKeeperCombatOnPlayerDeath(gameplay: GameplayState): ReadonlySet<EntityId> {
  const bellKeeperIds = new Set<EntityId>();
  gameplay.monsters = gameplay.monsters.map((monster) => {
    if (monster.monsterId !== 'ruins-bell-keeper') return monster;
    bellKeeperIds.add(monster.id);
    return {
      ...monster,
      mode: monster.mode === 'dead' ? 'dead' : 'idle',
      pendingSkillId: null,
      attackOrigin: null,
      attackFacing: null,
      attackReach: null,
      ...(monster.bellCycle ? {
        bellCycle: {
          ...monster.bellCycle,
          transitionStartedAtMs: null,
          transitionEndsAtMs: null,
          transitionUsed: true,
        },
      } : {}),
    };
  });
  gameplay.telegraphs = gameplay.telegraphs.filter(({ sourceId }) => !bellKeeperIds.has(sourceId));
  return bellKeeperIds;
}

function addEffect(
  gameplay: GameplayState,
  sourceId: EntityId,
  kind: VisualEvent['kind'],
  value: number,
  atMs: number,
  nextEntityId: () => EntityId,
  critical = false,
): void {
  pushEffect(gameplay, {
    id: nextEntityId(),
    kind,
    position: gameplay.monsters.find(({ id }) => id === sourceId)?.movement.position
      ?? gameplay.movement.position,
    value,
    ...(critical ? { critical: true } : {}),
    atMs,
  });
}

/** Keeps only the newest MAX_ACTIVE_EFFECTS effects; every effect source must go through here. */
function pushEffect(gameplay: GameplayState, effect: VisualEvent): void {
  gameplay.effects.push(effect);
  if (gameplay.effects.length > MAX_ACTIVE_EFFECTS) gameplay.effects.splice(0, gameplay.effects.length - MAX_ACTIVE_EFFECTS);
}

/** Claiming used to change EXP, coins and the bag silently; spell out what the hero just received. */
function questRewardToast(
  questName: string,
  reward: { exp: number; coins: number; items: readonly { itemId: string; quantity: number }[]; job?: import('../contracts/types.js').PlayerJob },
  levelBefore: number,
  levelAfter: number,
  catalog: ContentCatalog,
): string {
  const parts = [
    ...(reward.exp > 0 ? ['EXP ' + reward.exp.toLocaleString('en-US')] : []),
    ...(reward.coins > 0 ? [reward.coins.toLocaleString('en-US') + ' 金幣'] : []),
    ...reward.items.map(({ itemId, quantity }) => (catalog.rules.items[itemId]?.name ?? itemId) + ' ×' + quantity),
  ];
  const levelUp = levelAfter > levelBefore ? '，升至 Lv.' + levelAfter : '';
  const levelCap = reward.exp > 0 && levelAfter >= catalog.rules.progression.maxLevel
    ? '，已達等級上限，EXP不再累積'
    : '';
  const job = reward.job ? '，正式成為' + jobs[reward.job].name : '';
  return '完成「' + questName + '」：獲得 ' + parts.join('、') + levelUp + levelCap + job + '。';
}

// Names the skill and the next step instead of a generic "not learned or not allowed".
function skillLockedMessage(
  skill: { name: string; requiredLevel: number; requiredJob?: string },
  player: { job: string; level: number },
): string {
  if (player.job !== skill.requiredJob) return '轉職為' + (skill.requiredJob === 'rogue' ? '盜賊' : skill.requiredJob === 'mage' ? '法師' : skill.requiredJob === 'archer' ? '弓箭手' : '劍士') + '後才能使用「' + skill.name + '」。';
  if (player.level < skill.requiredLevel) return '「' + skill.name + '」需要 Lv.' + skill.requiredLevel + ' 才能學習。';
  return '尚未學會「' + skill.name + '」，請在技能面板用 SP 學習。';
}

/** When a kill or pickup finishes a quest's objectives, say so and where to turn it in. */
function announceReadyQuests(gameplay: GameplayState, before: SaveData, catalog: ContentCatalog): void {
  for (const [questId, state] of Object.entries(gameplay.saveData.quests)) {
    if (state.status !== 'active' || before.quests[questId]?.status !== 'active') continue;
    if (getQuestView(before, questId, catalog).status === 'ready') continue;
    if (getQuestView(gameplay.saveData, questId, catalog).status !== 'ready') continue;
    const quest = catalog.world.quests[questId];
    if (!quest) continue;
    const npcName = catalog.world.npcs[quest.turnInNpcId]?.name ?? '委託人';
    const npcMap = Object.values(catalog.world.maps).find((map) => map.npcs.some((npc) => npc.npcId === quest.turnInNpcId));
    gameplay.toast = '「' + quest.name + '」的目標已完成！回到' + (npcMap ? npcMap.name : '委託人身邊') + '向' + npcName + '回報。';
    gameplay.stickyToast = gameplay.toast;
  }
}

// The progression layer only says "MP 不足。"; say how much the skill needs and what the hero has.
function mpShortMessage(skill: { name: string; mpCost: number }, mp: number, fallback: string): string {
  if (!(mp < skill.mpCost)) return fallback;
  return 'MP 不足：「' + skill.name + '」需要 ' + skill.mpCost + ' MP，目前只有 ' + Math.floor(mp) + '。';
}

function attackFailureMessage(code: string): string {
  switch (code) {
    case 'COOLDOWN': return '技能還在冷卻中。';
    case 'NOT_READY': return '上一個攻擊動作尚未結束。';
    case 'REQUIREMENT': return '尚未學會此技能或不符合施放條件。';
    case 'DEAD': return '倒下時無法攻擊。';
    default: return '目前無法施放這個技能。';
  }
}

function withToast(gameplay: GameplayState, toast: string): { gameplay: GameplayState } {
  return { gameplay: { ...gameplay, toast } };
}

function cloneGameplay(gameplay: GameplayState): GameplayState {
  return {
    ...gameplay,
    ...(gameplay.poisons ? { poisons: gameplay.poisons.map((poison) => ({ ...poison })) } : {}),
    saveData: {
      ...gameplay.saveData,
      player: {
        ...gameplay.saveData.player,
        bag: gameplay.saveData.player.bag.map((stack) => ({ ...stack })),
        equipment: { ...gameplay.saveData.player.equipment },
        skillRanks: { ...gameplay.saveData.player.skillRanks },
      },
      quests: Object.fromEntries(Object.entries(gameplay.saveData.quests).map(([id, state]) => [id, {
        ...state,
        counters: { ...state.counters },
      }])),
      visitedMaps: [...gameplay.saveData.visitedMaps],
      flags: { ...gameplay.saveData.flags },
      settings: { ...gameplay.saveData.settings, bindings: { ...gameplay.saveData.settings.bindings } },
      location: { ...gameplay.saveData.location },
    },
    movement: {
      ...gameplay.movement,
      position: { ...gameplay.movement.position },
      velocity: { ...gameplay.movement.velocity },
    },
    monsters: gameplay.monsters.map((monster) => ({
      ...monster,
      movement: {
        ...monster.movement,
        position: { ...monster.movement.position },
        velocity: { ...monster.movement.velocity },
      },
      attackOrigin: monster.attackOrigin ? { ...monster.attackOrigin } : null,
      ...(monster.bellCycle ? { bellCycle: { ...monster.bellCycle } } : {}),
    })),
    combat: {
      ...(gameplay.combat.projectiles ? { projectiles: gameplay.combat.projectiles.map(cloneProjectile) } : {}),
      attacks: gameplay.combat.attacks.map((attack) => ({ ...attack, origin: { ...attack.origin }, hitIds: [...attack.hitIds],
        ...(attack.meleeHitIds ? { meleeHitIds: Object.fromEntries(Object.entries(attack.meleeHitIds).map(([key, ids]) => [key, [...ids]])) } : {}) })),
      cooldowns: Object.fromEntries(Object.entries(gameplay.combat.cooldowns).map(([id, cooldowns]) => [id, { ...cooldowns }])),
    },
    drops: gameplay.drops.map((drop) => ({ ...drop, position: { ...drop.position } })),
    telegraphs: gameplay.telegraphs.map((telegraph) => ({ ...telegraph, rect: { ...telegraph.rect } })),
    effects: gameplay.effects.map((effect) => ({ ...effect, position: { ...effect.position } })),
  };
}
