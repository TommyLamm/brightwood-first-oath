import { calculateDamage, calculateKnockback } from './damage.js';
import { frostRingHits } from './mage.js';
export { CRITICAL_MULTIPLIER } from './damage.js';
import { cloneProjectile, emitProjectiles, MAX_PROJECTILES, stepProjectiles } from './projectiles.js';
import type {
  AttackInstance,
  AttackRequest,
  CombatActor,
  CombatState,
  CombatStep,
  EntityId,
  Id,
  RandomSource,
  Result,
  RulesCatalog,
  SkillDef,
  Vec2,
  MapDef,
} from '../../contracts/index.js';
import { failure, success } from '../../contracts/index.js';

/** Returns a fresh, empty combat state. */
export function createCombatState(): CombatState {
  return { attacks: [], cooldowns: {} };
}

/**
 * Validates and prepares an attack without spending MP or changing its source.
 * The returned state is a proposal; callers should commit it only alongside
 * any other required transaction, such as MP spending.
 */
export function tryAttack(
  state: CombatState,
  request: AttackRequest,
  actors: readonly CombatActor[],
  rules: RulesCatalog,
  nowMs: number,
  nextId: () => EntityId,
): Result<{ state: CombatState; attack: AttackInstance }> {
  const source = actors.find((actor) => actor.id === request.sourceId);
  if (!source) return failure('NOT_FOUND', 'Attack source does not exist.');
  if (source.hp <= 0) return failure('DEAD', 'A dead actor cannot attack.');

  const skill = rules.skills[request.skillId];
  if (!skill) return failure('NOT_FOUND', 'Attack skill does not exist.');
  if (skill.kind !== 'attack' && skill.kind !== 'movement' && skill.kind !== 'zone') return failure('INVALID', 'Only combat actions can create instances.');
  const scheduledArrows = state.attacks.reduce((count, attack) => count
    + Math.max(0, (rules.skills[attack.skillId]?.projectile?.shotOffsetsMs.length ?? 0) - (attack.firedShots ?? 0)), 0);
  if (skill.projectile && (state.projectiles?.length ?? 0) + scheduledArrows + skill.projectile.shotOffsetsMs.length > MAX_PROJECTILES) {
    return failure('NOT_READY', 'Too many projectiles are active.');
  }
  if (request.reachOverride !== undefined && (!Number.isFinite(request.reachOverride) || request.reachOverride <= 0)) {
    return failure('INVALID', 'Attack reach override must be a positive finite number.');
  }
  if (request.firstHitBonus !== undefined && (!Number.isFinite(request.firstHitBonus)
    || request.firstHitBonus < 0 || request.firstHitBonus > 1)) return failure('INVALID', 'Invalid first-hit bonus.');
  if (request.damageBonus !== undefined && (!Number.isFinite(request.damageBonus)
    || request.damageBonus < 0 || request.damageBonus > 0.15)) return failure('INVALID', 'Invalid melee bonus.');

  const rank = getAttackRank(source, skill);
  if (rank === null) return failure('REQUIREMENT', 'Actor does not meet the skill faction or rank requirement.');

  const cooldownReadyAtMs = state.cooldowns[source.id]?.[skill.id] ?? 0;
  if (nowMs < cooldownReadyAtMs) return failure('COOLDOWN', 'Attack skill is on cooldown.');

  const sourceIsLocked = state.attacks.some((attack) => {
    if (attack.sourceId !== source.id) return false;
    const activeSkill = rules.skills[attack.skillId];
    if (!activeSkill || (activeSkill.kind !== 'attack' && activeSkill.kind !== 'movement' && activeSkill.kind !== 'zone')) return false;
    return nowMs < attack.startedAtMs + attackDuration(activeSkill);
  });
  if (sourceIsLocked) return failure('NOT_READY', 'Actor is still completing an attack.');

  const attack: AttackInstance = {
    id: nextId(),
    sourceId: source.id,
    skillId: skill.id,
    startedAtMs: nowMs,
    facing: source.facing,
    origin: { ...source.position },
    rank,
    hitIds: [],
    ...(skill.meleeWindows ? { meleeHitIds: {} } : {}),
    ...(request.damageBonus ? { damageBonus: request.damageBonus } : {}),
    ...(skill.projectile ? { projectileStats: { ...source.stats }, firedShots: 0 } : {}),
    ...(skill.id === 'mage-frost-ring' || skill.id === 'elementalist-nova' ? { projectileStats: { ...source.stats } } : {}),
    ...(skill.projectile && request.firstHitBonus ? { firstHitBonus: request.firstHitBonus } : {}),
    ...(request.reachOverride === undefined ? {} : { reachOverride: request.reachOverride }),
  };
  const cooldowns = cloneCooldowns(state.cooldowns);
  const sourceCooldowns = { ...(cooldowns[source.id] ?? {}) };
  sourceCooldowns[skill.id] = nowMs + Math.max(0, skill.cooldownMs - (skill.cooldownPerRank ?? 0) * (rank - 1));
  cooldowns[source.id] = sourceCooldowns;

  return success({
    state: {
      attacks: [...state.attacks.map(cloneAttack), attack],
      cooldowns,
      ...(state.projectiles?.length ? { projectiles: state.projectiles.map(cloneProjectile) } : {}),
    },
    attack,
  });
}

/**
 * Advances attack windows for one fixed-step interval and emits pure hit
 * records. HP, knockback application, MP and effects remain caller-owned.
 */
export function stepCombat(
  state: CombatState,
  actors: readonly CombatActor[],
  rules: RulesCatalog,
  dtSeconds: number,
  nowMs: number,
  rng: RandomSource,
  map?: MapDef,
): CombatStep {
  const elapsedMs = Number.isFinite(dtSeconds) && dtSeconds > 0 ? dtSeconds * 1000 : 0;
  const tickStartMs = nowMs - elapsedMs;
  const canResolveWindow = elapsedMs > 0;
  const actorById = new Map(actors.map((actor) => [actor.id, actor] as const));
  const attacks: AttackInstance[] = [];
  const hits: CombatStep['hits'] = [];
  const started: AttackInstance[] = [];
  const rejected: CombatStep['rejected'] = [];
  const projectiles = (state.projectiles ?? []).slice(0, MAX_PROJECTILES).map(cloneProjectile);

  for (const originalAttack of state.attacks) {
    const source = actorById.get(originalAttack.sourceId);
    const skill = rules.skills[originalAttack.skillId];
    if (!source || source.hp <= 0 || !skill || (skill.kind !== 'attack' && skill.kind !== 'movement' && skill.kind !== 'zone')) {
      rejected.push({
        sourceId: originalAttack.sourceId,
        code: !source ? 'NOT_FOUND' : source.hp <= 0 ? 'DEAD' : 'NOT_FOUND',
      });
      continue;
    }

    const attack = cloneAttack(originalAttack);
    const activeStartMs = attack.startedAtMs + skill.windupMs;
    const attackStartedThisStep = canResolveWindow
      && attack.startedAtMs > tickStartMs
      && attack.startedAtMs <= nowMs;
    if (attackStartedThisStep) started.push(cloneAttack(attack));
    if (canResolveWindow && skill.projectile) projectiles.push(...emitProjectiles(attack, source, skill, nowMs).slice(0, MAX_PROJECTILES - projectiles.length));

    const windows = skill.meleeWindows ?? [{ offsetMs: 0, activeMs: skill.activeMs }];
    for (const [index, window] of windows.entries()) {
    const startMs = activeStartMs + window.offsetMs;
    const endMs = startMs + window.activeMs;
    if (canResolveWindow && !skill.projectile && window.activeMs > 0
      && tickStartMs < endMs && nowMs >= startMs) {
      const windowHitIds = skill.meleeWindows ? attack.meleeHitIds![index] ??= [] : attack.hitIds;
      const strike = { ...attack, hitIds: windowHitIds,
        ...(skill.requiredJob === 'rogue' || skill.id === 'dagger-basic' ? { origin: { ...source.position } } : {}) };
      const candidates = actors
        .filter((target) => isValidTarget(source, target, strike, skill))
        .filter((target) => skill.id === 'mage-frost-ring' || skill.id === 'elementalist-nova'
          ? frostRingHits(target, attack, skill.reach, map) : overlapsAttackRange(target, strike, skill)
            && (!(skill.requiredJob === 'rogue' || skill.id === 'dagger-basic') || frostRingHits(target, strike, skill.reach + target.body.width, map)))
        .sort((left, right) => distanceSquared(attack.origin, left.position)
          - distanceSquared(attack.origin, right.position)
          || compareIds(left.id, right.id));
      const maxTargets = targetLimit(skill);
      let added = windowHitIds.length;
      for (const target of candidates) {
        if (added >= maxTargets) break;
        if (windowHitIds.includes(target.id)) continue;
        const stats = attack.projectileStats ?? source.stats;
        const backstab = source.specialization === 'shadowblade' && (source.position.x - target.position.x) * target.facing < 0 ? .25 : 0;
        const { damage, critical } = calculateDamage({ ...source, stats: { ...stats, attack: stats.attack * (1 + (attack.damageBonus ?? 0) + backstab) } }, target, skill, attack.rank, rng);
        hits.push({
          ...(skill.requiredSpecialization ? { skillId: skill.id } : {}),
          attackId: attack.id,
          sourceId: source.id,
          targetId: target.id,
          damage,
          critical,
          knockback: skill.meleeWindows && index < windows.length - 1 ? { x: 0, y: 0 } : calculateKnockback(strike, target),
        });
        windowHitIds.push(target.id);
        if (!attack.hitIds.includes(target.id)) attack.hitIds.push(target.id);
        added += 1;
      }
    }
    }

    if (nowMs < attack.startedAtMs + attackDuration(skill)) attacks.push(attack);
  }

  const arrows = stepProjectiles(projectiles, actors, rules, dtSeconds, nowMs, rng, map);
  return {
    state: { attacks, cooldowns: cloneCooldowns(state.cooldowns), ...(arrows.projectiles.length ? { projectiles: arrows.projectiles } : {}) },
    hits: [...hits, ...arrows.hits],
    started,
    rejected,
  };
}

function getAttackRank(source: CombatActor, skill: SkillDef): number | null {
  const isEnemySkill = skill.requiredJob === 'enemy';
  if ((source.faction === 'enemy') !== isEnemySkill) return null;
  if (skill.requiredSpecialization) return source.specialization === skill.requiredSpecialization ? 1 : null;
  if (isEnemySkill || skill.requiredJob === 'any') return 1;

  const rank = source.skillRanks[skill.id];
  if (!Number.isInteger(rank) || rank < 1) return null;
  return Math.min(rank, skill.maxRank);
}

function attackDuration(skill: SkillDef): number {
  return skill.windupMs + skill.activeMs + skill.recoveryMs;
}

function isValidTarget(
  source: CombatActor,
  target: CombatActor,
  attack: AttackInstance,
  skill: SkillDef,
): boolean {
  if (target.id === source.id || target.id === attack.sourceId || target.hp <= 0) return false;
  if (target.faction === source.faction || attack.hitIds.includes(target.id)) return false;
  if (source.faction === 'player' && target.faction !== 'enemy') return false;
  return source.faction === 'enemy' && target.faction === 'player'
    || source.faction === 'player' && target.faction === 'enemy'
    ? target.body.width > 0 && target.body.height > 0 && skill.targets > 0
    : false;
}

function overlapsAttackRange(target: CombatActor, attack: AttackInstance, skill: SkillDef): boolean {
  const reach = attack.reachOverride ?? skill.reach;
  const attackLeft = attack.facing === 1 ? attack.origin.x : attack.origin.x - reach;
  const attackRight = attack.facing === 1 ? attack.origin.x + reach : attack.origin.x;
  const attackTop = attack.origin.y - skill.height;
  const targetLeft = target.position.x - target.body.width / 2;
  const targetRight = target.position.x + target.body.width / 2;
  const targetTop = target.position.y - target.body.height;
  return attackLeft < targetRight
    && attackRight > targetLeft
    && attackTop < target.position.y
    && attack.origin.y > targetTop;
}

function targetLimit(skill: SkillDef): number {
  if (skill.id === 'basic') return Math.min(1, Math.max(0, skill.targets));
  if (skill.id === 'sweep') return Math.min(3, Math.max(0, skill.targets));
  return Math.max(0, Math.floor(skill.targets));
}


function distanceSquared(origin: Vec2, position: Vec2): number {
  const dx = position.x - origin.x;
  const dy = position.y - origin.y;
  return dx * dx + dy * dy;
}

function compareIds(left: Id, right: Id): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function cloneAttack(attack: AttackInstance): AttackInstance {
  return { ...attack, origin: { ...attack.origin }, hitIds: [...attack.hitIds],
    ...(attack.meleeHitIds ? { meleeHitIds: Object.fromEntries(Object.entries(attack.meleeHitIds).map(([key, ids]) => [key, [...ids]])) } : {}),
    ...(attack.projectileStats ? { projectileStats: { ...attack.projectileStats } } : {}) };
}

function cloneCooldowns(
  cooldowns: CombatState['cooldowns'],
): CombatState['cooldowns'] {
  return Object.fromEntries(Object.entries(cooldowns).map(([actorId, entries]) => [
    actorId,
    { ...entries },
  ]));
}
