import type { Telegraph, Vec2 } from '../contracts/types.js';
import type { VisualEvent } from '../contracts/ports.js';

export const DAMAGE_NUMBER_LIFETIME_MS = 900;

export type HealthBarGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  fillX: number;
  fillY: number;
  fillWidth: number;
  fillHeight: number;
  ratio: number;
};

export type TelegraphCueGeometry = {
  rect: Telegraph['rect'];
  remainingMs: number;
  progress: number | null;
  progressWidth: number | null;
  fillAlpha: number;
  borderAlpha: number;
  borderWidth: number;
};

export type DamageNumberGeometry = {
  x: number;
  y: number;
  alpha: number;
  scale: number;
};

/** Places a procedural HP bar above an actor using its live snapshot HP and display size. */
export function monsterHealthBarGeometry(
  position: Vec2,
  hp: number,
  maxHp: number,
  actorWidth: number,
  actorHeight: number,
  isBoss: boolean,
): HealthBarGeometry {
  const minimumWidth = isBoss ? 140 : 40;
  const width = Math.max(minimumWidth, finitePositive(actorWidth));
  const height = isBoss ? 8 : 6;
  const ratio = Number.isFinite(hp) && Number.isFinite(maxHp) && maxHp > 0
    ? clamp(hp / maxHp)
    : 0;
  const x = position.x - width / 2;
  const y = position.y - finitePositive(actorHeight) - (isBoss ? 14 : 10);

  return {
    x,
    y,
    width,
    height,
    fillX: x + 1,
    fillY: y + 1,
    fillWidth: (width - 2) * ratio,
    fillHeight: height - 2,
    ratio,
  };
}

/** Uses the AI windup timestamp, when available, to advance a telegraph's warning meter. */
export function telegraphCueGeometry(
  telegraph: Telegraph,
  nowMs: number,
  windupStartedAtMs: number | undefined,
  isBoss: boolean,
): TelegraphCueGeometry | null {
  const remainingMs = telegraph.resolveAtMs - nowMs;
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return null;

  const validStartTime = typeof windupStartedAtMs === 'number' && Number.isFinite(windupStartedAtMs);
  const windupDurationMs = validStartTime
    ? telegraph.resolveAtMs - windupStartedAtMs
    : 0;
  const progress = Number.isFinite(windupDurationMs) && windupDurationMs > 0
    && validStartTime
    ? clamp((nowMs - windupStartedAtMs) / windupDurationMs)
    : null;

  return {
    rect: telegraph.rect,
    remainingMs,
    progress,
    progressWidth: progress === null ? null : Math.max(0, telegraph.rect.width) * progress,
    fillAlpha: (isBoss ? 0.2 : 0.14) + (isBoss ? 0.14 : 0.08) * (progress ?? 0),
    borderAlpha: 0.78 + 0.22 * (progress ?? 0),
    borderWidth: isBoss ? 3 : 2,
  };
}

/** Computes a damage label's world position and fade from the snapshot clock. */
export function damageNumberGeometry(
  position: Vec2,
  atMs: number,
  nowMs: number,
): DamageNumberGeometry | null {
  const ageMs = nowMs - atMs;
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs >= DAMAGE_NUMBER_LIFETIME_MS) return null;

  const progress = ageMs / DAMAGE_NUMBER_LIFETIME_MS;
  const fadeStart = 0.65;
  const alpha = progress <= fadeStart ? 1 : clamp((1 - progress) / (1 - fadeStart));
  const popProgress = Math.min(1, progress / 0.12);

  return {
    x: position.x,
    y: position.y - 20 - progress * 36,
    alpha,
    scale: 1 + (1 - popProgress) * 0.18,
  };
}

export function isDamageNumberEvent(kind: VisualEvent['kind']): kind is 'damage' | 'hit' {
  return kind === 'damage' || kind === 'hit';
}

export function formatDamageNumber(value: number | undefined): string {
  return value !== undefined && Number.isFinite(value) ? String(Math.round(value)) : '命中';
}

function finitePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
