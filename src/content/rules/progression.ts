import type { MovementConfig } from '../../contracts/index.js';

export const maxLevel = 30;

export const expToNext = Array.from({ length: maxLevel + 1 }, (_, level) =>
  level === 0 || level === maxLevel ? 0 : 40 + 12 * level + 3 * level * level,
);

export const movement: MovementConfig = {
  speed: 140,
  climbSpeed: 90,
  gravity: 1600,
  jumpVelocity: -520,
  terminalVelocity: 900,
  width: 24,
  height: 44,
};
