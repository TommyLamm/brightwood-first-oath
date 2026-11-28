import type { Telegraph, Vec2 } from '../../contracts/types.js';

export function activeTelegraphRemainingMs({ resolveAtMs }: Telegraph, nowMs: number): number | null {
  const remainingMs = resolveAtMs - nowMs;
  return Number.isFinite(remainingMs) && remainingMs > 0 ? remainingMs : null;
}

/** The actor's position is at its feet, with the rest of the body above it. */
export function bodyOverlapsTelegraph(
  feet: Readonly<Vec2>,
  body: Readonly<{ width: number; height: number }>,
  rect: Telegraph['rect'],
): boolean {
  const halfWidth = body.width / 2;
  return feet.x + halfWidth > rect.x && feet.x - halfWidth < rect.x + rect.width
    && feet.y > rect.y && feet.y - body.height < rect.y + rect.height;
}
