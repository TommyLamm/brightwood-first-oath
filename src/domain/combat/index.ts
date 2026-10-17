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
  if (skill.kind !== 'attack') return failure('INVALID', 'Only attack skills can create attack instances.');

  const rank = getAttackRank(source, skill);
  if (rank === null) return failure('REQUIREMENT', 'Actor does not meet the skill faction or rank requirement.');

  const cooldownReadyAtMs = state.cooldowns[source.id]?.[skill.id] ?? 0;
  if (nowMs < cooldownReadyAtMs) return failure('COOLDOWN', 'Attack skill is on cooldown.');

  const sourceIsLocked = state.attacks.some((attack) => {
    if (attack.sourceId !== source.id) return false;
    const activeSkill = rules.skills[attack.skillId];
    if (!activeSkill || activeSkill.kind !== 'attack') return false;
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
  };
  const cooldowns = cloneCooldowns(state.cooldowns);
  const sourceCooldowns = { ...(cooldowns[source.id] ?? {}) };
  sourceCooldowns[skill.id] = nowMs + skill.cooldownMs;
  cooldowns[source.id] = sourceCooldowns;

  return success({
    state: {
      attacks: [...state.attacks.map(cloneAttack), attack],
      cooldowns,
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
): CombatStep {
  const elapsedMs = Number.isFinite(dtSeconds) && dtSeconds > 0 ? dtSeconds * 1000 : 0;
  const tickStartMs = nowMs - elapsedMs;
  const canResolveWindow = elapsedMs > 0;
  const actorById = new Map(actors.map((actor) => [actor.id, actor] as const));
  const attacks: AttackInstance[] = [];
  const hits: CombatStep['hits'] = [];
  const started: AttackInstance[] = [];
  const rejected: CombatStep['rejected'] = [];

  for (const originalAttack of state.attacks) {
    const source = actorById.get(originalAttack.sourceId);
    const skill = rules.skills[originalAttack.skillId];
    if (!source || source.hp <= 0 || !skill || skill.kind !== 'attack') {
      rejected.push({
        sourceId: originalAttack.sourceId,
        code: !source ? 'NOT_FOUND' : source.hp <= 0 ? 'DEAD' : 'NOT_FOUND',
      });
      continue;
    }

    const attack = cloneAttack(originalAttack);
    const activeStartMs = attack.startedAtMs + skill.windupMs;
    const activeEndMs = activeStartMs + skill.activeMs;
    const attackStartedThisStep = canResolveWindow
      && attack.startedAtMs > tickStartMs
      && attack.startedAtMs <= nowMs;
    if (attackStartedThisStep) started.push(cloneAttack(attack));

    if (canResolveWindow && skill.activeMs > 0
      && tickStartMs < activeEndMs && nowMs >= activeStartMs) {
      const candidates = actors
        .filter((target) => isValidTarget(source, target, attack, skill))
        .filter((target) => overlapsAttackRange(target, attack, skill))
        .sort((left, right) => distanceSquared(attack.origin, left.position)
          - distanceSquared(attack.origin, right.position)
          || compareIds(left.id, right.id));
      const maxTargets = targetLimit(skill);
      let added = 0;
      for (const target of candidates) {
        if (added >= maxTargets) break;
        if (attack.hitIds.includes(target.id)) continue;
        hits.push({
          attackId: attack.id,
          sourceId: source.id,
          targetId: target.id,
          damage: calculateDamage(source, target, skill, attack.rank, rng),
          knockback: calculateKnockback(attack, target),
        });
        attack.hitIds.push(target.id);
        added += 1;
      }
    }

    if (nowMs < attack.startedAtMs + attackDuration(skill)) attacks.push(attack);
  }

  return {
    state: { attacks, cooldowns: cloneCooldowns(state.cooldowns) },
    hits,
    started,
    rejected,
  };
}

function getAttackRank(source: CombatActor, skill: SkillDef): number | null {
  const isEnemySkill = skill.requiredJob === 'enemy';
  if ((source.faction === 'enemy') !== isEnemySkill) return null;
  if (isEnemySkill || skill.id === 'basic') return 1;

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
  const attackLeft = attack.facing === 1 ? attack.origin.x : attack.origin.x - skill.reach;
  const attackRight = attack.facing === 1 ? attack.origin.x + skill.reach : attack.origin.x;
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

function calculateDamage(
  source: CombatActor,
  target: CombatActor,
  skill: SkillDef,
  rank: number,
  rng: RandomSource,
): number {
  const multiplier = skill.multiplierBase + skill.multiplierPerRank * (rank - 1);
  const variance = 0.95 + 0.1 * rng.next();
  return Math.max(1, Math.floor((source.stats.attack * multiplier - target.stats.defense * 0.5) * variance));
}

function calculateKnockback(attack: AttackInstance, target: CombatActor): Vec2 {
  if (target.knockbackImmune) return { x: 0, y: 0 };
  const horizontalDirection = target.position.x === attack.origin.x
    ? attack.facing
    : target.position.x > attack.origin.x ? 1 : -1;
  return target.faction === 'player'
    ? { x: horizontalDirection * 140, y: -120 }
    : { x: horizontalDirection * 120, y: -80 };
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
  return { ...attack, origin: { ...attack.origin }, hitIds: [...attack.hitIds] };
}

function cloneCooldowns(
  cooldowns: CombatState['cooldowns'],
): CombatState['cooldowns'] {
  return Object.fromEntries(Object.entries(cooldowns).map(([actorId, entries]) => [
    actorId,
    { ...entries },
  ]));
}
