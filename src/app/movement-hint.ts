import type { MapDef, MovementConfig, MovementState } from '../contracts/index.js';
import type { UiSnapshot } from '../contracts/ports.js';
import { findNearbyLadder } from '../domain/movement/index.js';

/** Only advertise movement that the existing attachment/drop rules actually allow. */
export function deriveMovementHint(
  state: Readonly<MovementState>,
  map: MapDef | undefined,
  config: MovementConfig,
): UiSnapshot['movementHint'] {
  if (!map || state.mode === 'dead') return null;
  if (state.mode === 'climbing') {
    const ladder = map.ladders.find((route) => route.id === state.ladderId);
    return ladder ? { targetKey: 'climb:' + ladder.id, kind: 'climb', attached: true } : null;
  }
  const ladder = findNearbyLadder(state.position, map, config);
  if (ladder) return { targetKey: 'climb:' + ladder.id, kind: 'climb', attached: false };
  const foothold = state.mode === 'grounded' ? map.footholds.find((f) => f.id === state.footholdId) : undefined;
  return foothold?.dropThrough ? { targetKey: 'drop:' + foothold.id, kind: 'drop' } : null;
}
