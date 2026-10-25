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
import { createMovement, stepMovement } from '../domain/movement/index.js';
import { applyMonsterHit, createMonster, stepActors } from '../domain/actors/index.js';
import { createCombatState, stepCombat, tryAttack } from '../domain/combat/index.js';
import { applyProgressAction, createPlayer, deriveStats, validatePlayerName } from '../domain/progression/index.js';
import { acceptQuest, getQuestView, planQuestClaim, recordQuestEvent } from '../domain/quests/index.js';
import { questDropByQuest } from '../content/rules/index.js';
import type { DropState, VisualEvent, WorldSnapshot } from '../contracts/ports.js';

const INTERACTION_RANGE_PX = 64;

export type GameplayState = {
  saveData: SaveData;
  playerEntityId: EntityId;
  movement: MovementState;
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
  screen: 'title' | 'create' | 'loading' | 'playing' | 'paused' | 'dead' | 'result' | 'chapter' | 'error';
  openPanel?: PanelId;
};

export function startNewGame(
  name: string,
  catalog: ContentCatalog,
  nextEntityId: () => EntityId,
): { gameplay: GameplayState; normalizedName: string } | { error: string } {
  const checkedName = validatePlayerName(name);
  if (!checkedName.ok) return { error: checkedName.message };
  const player = createPlayer(checkedName.value, catalog.rules);
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
    const started = startNewGame(createCommand.payload.name, input.catalog, input.nextEntityId);
    if ('error' in started) return { gameplay: null, screen: 'create' };
    gameplay = started.gameplay;
    screen = 'playing';
    commands = commands.filter((command) => command.seq !== createCommand.seq);
  }

  gameplay = cloneGameplay(gameplay);
  if (gameplay.saveData.player.hp <= 0) {
    clearCombatForActors(gameplay, new Set([gameplay.playerEntityId]));
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
  const movementConfig = attackLocked
    ? { ...catalog.rules.movement, speed: catalog.rules.movement.speed * 0.25 }
    : catalog.rules.movement;
  const originalFacing = gameplay.movement.facing;
  gameplay.movement = stepMovement(
    gameplay.movement,
    input.input,
    map,
    movementConfig,
    input.dtSeconds,
    input.nowMs,
  );
  if (attackLocked) gameplay.movement = { ...gameplay.movement, facing: originalFacing };

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

  const combatStep = stepCombat(
    gameplay.combat,
    combatActors,
    catalog.rules,
    input.dtSeconds,
    input.nowMs,
    input.random,
  );
  gameplay.combat = combatStep.state;

  for (const hit of combatStep.hits) {
    if (hit.targetId === gameplay.playerEntityId) {
      if (input.nowMs < gameplay.invulnerableUntilMs) continue;
      const damaged = applyProgressAction(gameplay.saveData.player, { type: 'damage', amount: hit.damage }, catalog.rules);
      if (!damaged.ok) continue;
      gameplay.saveData = { ...gameplay.saveData, player: damaged.value };
      gameplay.invulnerableUntilMs = input.nowMs + 800;
      gameplay.attackOrDamageAtMs = input.nowMs;
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
      gameplay.attackOrDamageAtMs = input.nowMs;
      addEffect(gameplay, hit.targetId, 'hit', hit.damage, input.nowMs, input.nextEntityId, hit.critical);
    }
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
  if (gameplay.saveData.player.hp <= 0) combatSourcesToClear.add(gameplay.playerEntityId);
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
  if (gameplay.saveData.player.hp > 0) recoverWhileResting(gameplay, catalog, input.nowMs);
  expireToast(gameplay, input.nowMs);
  // Hold the result screen until every guardian item (core and 守衛之刃) is picked up or has expired;
  // its 返回城鎮 button leaves the arena and would silently discard anything still on the floor.
  if (gameplay.bossResult && screen === 'playing' && !gameplay.drops.some(({ itemId }) => itemId !== null)) {
    screen = 'result';
  }
  return { gameplay, screen, ...(openPanel ? { openPanel } : {}) };
}

function clearCombatForActors(gameplay: GameplayState, actorIds: ReadonlySet<EntityId>): void {
  if (actorIds.size === 0) return;
  gameplay.combat = {
    attacks: gameplay.combat.attacks.filter(({ sourceId }) => !actorIds.has(sourceId)),
    cooldowns: Object.fromEntries(Object.entries(gameplay.combat.cooldowns)
      .filter(([actorId]) => !actorIds.has(actorId))
      .map(([actorId, cooldowns]) => [actorId, { ...cooldowns }])),
  };
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
    },
    monsters: gameplay.monsters,
    drops: gameplay.drops,
    npcs: map.npcs,
    attacks: gameplay.combat.attacks,
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
    case 'attack': {
      const skill = catalog.rules.skills[command.payload.skillId];
      if (!skill || (skill.kind !== 'attack' && skill.kind !== 'buff')) return withToast(gameplay, '找不到可施放的技能。');
      if (skill.kind === 'buff') {
        const rank = player.skillRanks[skill.id] ?? 0;
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
        gameplay.guardUntilMs = context.nowMs + skill.durationMs;
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
      }, actors, catalog.rules, context.nowMs, context.nextEntityId);
      if (!proposal.ok) {
        // A skill pressed mid-swing is buffered briefly so it chains off the swing instead of being lost.
        if (proposal.code === 'NOT_READY' && skill.id !== 'basic') {
          if (gameplay.bufferedAttack?.skillId !== skill.id) {
            gameplay.bufferedAttack = { skillId: skill.id, expiresAtMs: context.nowMs + ATTACK_BUFFER_MS };
          }
          return { gameplay };
        }
        delete gameplay.bufferedAttack;
        // Mashing keys while a swing is still playing is normal input, not an error; neither is
        // mashing the basic attack during its own cooldown. Skill cooldowns still explain themselves.
        if (proposal.code === 'NOT_READY' || (skill.id === 'basic' && proposal.code === 'COOLDOWN')) return { gameplay };
        if (proposal.code === 'REQUIREMENT') return withToast(gameplay, skillLockedMessage(skill, player));
        return withToast(gameplay, attackFailureMessage(proposal.code));
      }
      delete gameplay.bufferedAttack;
      const mp = skill.mpCost > 0
        ? applyProgressAction(player, { type: 'spendMp', amount: skill.mpCost }, catalog.rules)
        : { ok: true as const, value: player };
      if (!mp.ok) return withToast(gameplay, mpShortMessage(skill, player.mp, mp.message));
      gameplay.combat = proposal.value.state;
      gameplay.saveData = { ...gameplay.saveData, player: mp.value };
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
      if (context.nowMs < gameplay.potionReadyAtMs) return withToast(gameplay, '藥水還在冷卻中。');
      let itemId = command.payload.itemId;
      if (itemId === 'small-red' && !player.bag.some((stack) => stack.itemId === 'small-red' && stack.quantity > 0)
        && player.bag.some((stack) => stack.itemId === 'large-red' && stack.quantity > 0)) {
        itemId = 'large-red';
      } else if (itemId === 'small-blue' && !player.bag.some((stack) => stack.itemId === 'small-blue' && stack.quantity > 0)
        && player.bag.some((stack) => stack.itemId === 'large-blue' && stack.quantity > 0)) {
        itemId = 'large-blue';
      }
      const item = catalog.rules.items[itemId];
      if (item?.kind === 'consumable' && !player.bag.some((stack) => stack.itemId === itemId && stack.quantity > 0)) {
        // The domain's generic 「數量不足」 read like a bookkeeping error mid-fight; say what to do instead.
        return withToast(gameplay, `${item.name}已經用完了，可向木葉鎮的木葉商人補貨。`);
      }
      const result = applyProgressAction(player, { type: 'useItem', itemId }, catalog.rules);
      if (!result.ok) return withToast(gameplay, result.message);
      gameplay.potionReadyAtMs = context.nowMs + 1000;
      return { gameplay: withPlayer(gameplay, result.value, null) };
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
      if (gameplay.saveData.player.hp <= 0 || gameplay.movement.mode === 'dead' || gameplay.deathAtMs !== null) {
        return withToast(gameplay, '倒下時無法調律石碑。');
      }
      if (gameplay.pendingTransition) return withToast(gameplay, '切換地圖時無法調律石碑。');
      if (gameplay.saveData.location.mapId !== 'ruins-echo-gallery') {
        return withToast(gameplay, '只有在回聲長廊才能調律這些石碑。');
      }
      const targetId = command.payload.targetId;
      if (targetId !== 'ruins-stele-west' && targetId !== 'ruins-stele-east') {
        return withToast(gameplay, '找不到可調律的石碑。');
      }
      const map = catalog.world.maps['ruins-echo-gallery'];
      const placement = map?.npcs.find(({ npcId }) => npcId === targetId);
      if (!placement) return withToast(gameplay, '這塊石碑不在回聲長廊。');
      if (Math.hypot(
        placement.x - gameplay.movement.position.x,
        placement.y - gameplay.movement.position.y,
      ) > INTERACTION_RANGE_PX) {
        return withToast(gameplay, '請靠近石碑再調律。');
      }
      if (gameplay.interaction?.npcId !== targetId) {
        return withToast(gameplay, '請先閱讀並開啟這塊石碑的碑文。');
      }
      const quest = catalog.world.quests.q17;
      const questState = gameplay.saveData.quests.q17;
      if (!quest || questState?.status !== 'active'
        || !quest.objectives.some((objective) => objective.type === 'inspect' && objective.targetId === targetId)) {
        return withToast(gameplay, '先在行舟身邊接取「兩段回聲」，再調律石碑。');
      }
      if ((questState.counters[targetId] ?? 0) >= 1) {
        return withToast(gameplay, '這塊石碑已經調律。');
      }
      const saveData = {
        ...gameplay.saveData,
        quests: recordQuestEvent(gameplay.saveData.quests, { type: 'inspected', targetId }, catalog.world),
      };
      const tunedState = { ...gameplay, saveData, toast: '石碑的回聲已應聲。' };
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
      const claim = planQuestClaim(gameplay.saveData, command.payload.questId, catalog);
      if (!claim.ok) return withToast(gameplay, claim.message);
      let updated = applyProgressAction(player, { type: 'removeItems', items: claim.value.removeItems }, catalog.rules);
      if (!updated.ok) return withToast(gameplay, updated.message);
      let claimedPlayer = updated.value;
      if (claim.value.reward.minLevel !== undefined) {
        updated = applyProgressAction(claimedPlayer, { type: 'setLevelFloor', level: claim.value.reward.minLevel }, catalog.rules);
        if (!updated.ok) return withToast(gameplay, updated.message);
        claimedPlayer = updated.value;
      }
      if (claim.value.reward.job === 'swordsman') {
        updated = applyProgressAction(claimedPlayer, { type: 'changeJob' }, catalog.rules);
        if (!updated.ok) return withToast(gameplay, updated.message);
        claimedPlayer = updated.value;
      }
      updated = applyProgressAction(claimedPlayer, { type: 'gainReward', reward: { ...claim.value.reward, minLevel: undefined, job: undefined } }, catalog.rules);
      if (!updated.ok) return withToast(gameplay, updated.message);
      const isChapterComplete = command.payload.questId === 'q08';
      if (updated.value.level > player.level) {
        addEffect(gameplay, gameplay.playerEntityId, 'levelup', updated.value.level, context.nowMs, context.nextEntityId);
      }
      const saveData = {
        ...gameplay.saveData,
        player: updated.value,
        quests: claim.value.nextQuests,
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
            : questRewardToast(quest.name, claim.value.reward, player.level, updated.value.level, catalog),
        },
        // Spec: claiming q08 shows the chapter settlement (world frozen until dismissed).
        ...(isChapterComplete ? { screen: 'chapter' as const } : {}),
      };
    }
    case 'returnTown': {
      const currentMapId = gameplay.saveData.location.mapId;
      if ((currentMapId === 'guardian-arena' || currentMapId === 'frost-tide-cavern' || currentMapId === 'sand-sunwell-altar') && !gameplay.bossResult) {
        return withToast(gameplay, '首領戰尚未結束，暫時不能返回安全地點。');
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

function nearestNpc(gameplay: GameplayState, catalog: ContentCatalog, radius: number): { npcId: string; x: number; y: number } | null {
  const map = catalog.world.maps[gameplay.saveData.location.mapId];
  if (!map) return null;
  const candidates = map.npcs.map((placement) => ({ ...placement, distance: Math.hypot(
    placement.x - gameplay.movement.position.x,
    placement.y - gameplay.movement.position.y,
  ) })).filter(({ distance }) => distance <= radius)
    .sort((a, b) => a.distance - b.distance || a.npcId.localeCompare(b.npcId));
  return candidates[0] ?? null;
}

function nearNpc(gameplay: GameplayState, catalog: ContentCatalog, npcId: string, radius: number): boolean {
  return nearestNpc(gameplay, catalog, radius)?.npcId === npcId;
}

function interactNearest(gameplay: GameplayState, context: GameplayStepInput): { gameplay: GameplayState; screen?: GameplayStepResult['screen']; openPanel?: PanelId } {
  const { catalog } = context;
  const npc = nearestNpc(gameplay, catalog, INTERACTION_RANGE_PX);
  if (npc) {
    const definition = catalog.world.npcs[npc.npcId];
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

  const map = catalog.world.maps[gameplay.saveData.location.mapId];
  const portal = map?.portals.map((candidate) => ({ candidate, distance: Math.hypot(
    candidate.x - gameplay.movement.position.x,
    candidate.y - gameplay.movement.position.y,
  ) })).filter(({ distance }) => distance <= INTERACTION_RANGE_PX)
    .sort((a, b) => a.distance - b.distance || a.candidate.id.localeCompare(b.candidate.id))[0]?.candidate;
  if (portal) {
    if (gameplay.saveData.player.level < portal.minLevel) return withToast(gameplay, `需要等級 ${portal.minLevel} 才能通過。`);
    if (portal.requiredQuestId && gameplay.saveData.quests[portal.requiredQuestId]?.status !== 'claimed') {
      return withToast(gameplay, lockedPortalMessage(gameplay.saveData, portal.requiredQuestId, portal.targetMapId, catalog));
    }
    return requestTransition(gameplay, portal.targetMapId, portal.targetSpawnId, 'travel', catalog);
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
  const drop = gameplay.drops.map((candidate) => ({ candidate, distance: Math.hypot(
    candidate.position.x - gameplay.movement.position.x,
    candidate.position.y - gameplay.movement.position.y,
  ) })).filter(({ distance }) => distance <= 90)
    .sort((a, b) => a.distance - b.distance || a.candidate.id.localeCompare(b.candidate.id))[0]?.candidate;
  if (!drop) return withToast(gameplay, '附近沒有可以拾取的物品。');
  const result = drop.itemId === null
    ? applyProgressAction(gameplay.saveData.player, { type: 'gainReward', reward: { exp: 0, coins: drop.coins, items: [] } }, context.catalog.rules)
    : applyProgressAction(gameplay.saveData.player, { type: 'addItem', stack: { itemId: drop.itemId, quantity: drop.quantity } }, context.catalog.rules);
  if (!result.ok) return withToast(gameplay, result.message);
  const beforePickup = gameplay.saveData;
  gameplay.saveData = { ...gameplay.saveData, player: result.value };
  gameplay.drops = gameplay.drops.filter(({ id }) => id !== drop.id);
  gameplay.nextPickupAtMs = context.nowMs + 150;
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
  const rank = gameplay.saveData.player.skillRanks['rest-recovery'] ?? 0;
  const recoveryStartsAtMs = gameplay.attackOrDamageAtMs + 3000;
  if (rank < 1 || nowMs < recoveryStartsAtMs) {
    gameplay.nextRegenAtMs = 0;
    return;
  }
  if (gameplay.nextRegenAtMs === 0 || gameplay.nextRegenAtMs < recoveryStartsAtMs) {
    gameplay.nextRegenAtMs = recoveryStartsAtMs;
  }
  if (nowMs < gameplay.nextRegenAtMs) return;
  const restored = applyProgressAction(gameplay.saveData.player, { type: 'restore', hp: rank * 2, mp: 0 }, catalog.rules);
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
    drops.push({ itemId: drop.itemId, quantity, coins: 0 });
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

  if (monster.monsterId === 'guardian' || monster.monsterId === 'frost-tide-warden' || monster.monsterId === 'sunwell-sentinel') {
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
        + (player.job === 'swordsman' ? '、' + gained + ' SP，可在能力與技能面板分配。' : '，可在能力面板分配。');
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

function buildCombatActors(gameplay: GameplayState, catalog: ContentCatalog, nowMs: number): CombatActor[] {
  return [
    playerCombatActor(gameplay, catalog, nowMs),
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
        knockbackImmune: monster.monsterId === 'guardian' || monster.monsterId === 'frost-tide-warden' || monster.monsterId === 'sunwell-sentinel',
        skillRanks: monster.pendingSkillId ? { [monster.pendingSkillId]: 1 } : {},
      };
    }),
  ];
}

function playerCombatActor(gameplay: GameplayState, catalog: ContentCatalog, nowMs: number): CombatActor {
  const stats = deriveStats(gameplay.saveData.player, catalog.rules);
  const guardRank = gameplay.guardUntilMs > nowMs
    ? gameplay.saveData.player.skillRanks['iron-guard'] ?? 0
    : 0;
  return {
    id: gameplay.playerEntityId,
    position: { ...gameplay.movement.position },
    facing: gameplay.movement.facing,
    hp: gameplay.saveData.player.hp,
    stats: { ...stats, defense: stats.defense + guardRank * (catalog.rules.skills['iron-guard']?.defensePerRank ?? 0) },
    faction: 'player',
    body: { width: catalog.rules.movement.width, height: catalog.rules.movement.height },
    knockbackImmune: false,
    skillRanks: gameplay.saveData.player.skillRanks,
  };
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
  gameplay.effects.push({
    id: nextEntityId(),
    kind,
    position: gameplay.monsters.find(({ id }) => id === sourceId)?.movement.position
      ?? gameplay.movement.position,
    value,
    ...(critical ? { critical: true } : {}),
    atMs,
  });
  if (gameplay.effects.length > 80) gameplay.effects.splice(0, gameplay.effects.length - 80);
}

/** Claiming used to change EXP, coins and the bag silently; spell out what the hero just received. */
function questRewardToast(
  questName: string,
  reward: { exp: number; coins: number; items: readonly { itemId: string; quantity: number }[]; job?: string },
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
  const job = reward.job === 'swordsman' ? '，正式成為劍士' : '';
  return '完成「' + questName + '」：獲得 ' + parts.join('、') + levelUp + job + '。';
}

// Names the skill and the next step instead of a generic "not learned or not allowed".
function skillLockedMessage(
  skill: { name: string; requiredLevel: number },
  player: { job: string; level: number },
): string {
  if (player.job !== 'swordsman') return '轉職為劍士後才能使用「' + skill.name + '」。';
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

// Names the quest that opens the road, the destination, and the next step for its current state.
function lockedPortalMessage(saveData: SaveData, questId: string, targetMapId: string, catalog: ContentCatalog): string {
  const quest = catalog.world.quests[questId];
  const place = catalog.world.maps[targetMapId]?.name ?? '前方';
  if (!quest) return '尚未完成通往' + place + '的任務。';
  const npcName = (id: string) => catalog.world.npcs[id]?.name ?? '委託人';
  const status = getQuestView(saveData, questId, catalog).status;
  if (status === 'ready') return '向' + npcName(quest.turnInNpcId) + '回報「' + quest.name + '」後才能前往' + place + '。';
  if (status === 'active') return '完成任務「' + quest.name + '」後才能前往' + place + '。';
  return '向' + npcName(quest.giverNpcId) + '接取並完成「' + quest.name + '」後才能前往' + place + '。';
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
    })),
    combat: {
      attacks: gameplay.combat.attacks.map((attack) => ({ ...attack, origin: { ...attack.origin }, hitIds: [...attack.hitIds] })),
      cooldowns: Object.fromEntries(Object.entries(gameplay.combat.cooldowns).map(([id, cooldowns]) => [id, { ...cooldowns }])),
    },
    drops: gameplay.drops.map((drop) => ({ ...drop, position: { ...drop.position } })),
    telegraphs: gameplay.telegraphs.map((telegraph) => ({ ...telegraph, rect: { ...telegraph.rect } })),
    effects: gameplay.effects.map((effect) => ({ ...effect, position: { ...effect.position } })),
  };
}
