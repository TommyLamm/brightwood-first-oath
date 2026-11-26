import type { MapDef, MovementConfig, MovementState } from '../contracts/index.js';
import type { MovementGuide, UiSnapshot } from '../contracts/ports.js';
import { findNearbyLadder } from '../domain/movement/index.js';

export function canShowContextHints(view: Pick<UiSnapshot, 'screen' | 'mapVisualLoad' | 'focusResumeRequired' | 'panels'>): boolean {
  return view.screen === 'playing' && !view.mapVisualLoad && !view.focusResumeRequired && view.panels.length === 0;
}

/** Only advertise movement that the existing attachment/drop rules actually allow. */
export function deriveMovementHint(
  state: Readonly<MovementState>,
  map: MapDef | undefined,
  config: MovementConfig,
): MovementGuide | null {
  if (!map || state.mode === 'dead') return null;
  const attached = state.mode === 'climbing';
  const ladder = attached ? map.ladders.find((route) => route.id === state.ladderId) : findNearbyLadder(state.position, map, config);
  if (ladder) return { targetKey: 'climb:' + ladder.id, kind: 'climb', attached, ladder };
  const foothold = state.mode === 'grounded' ? map.footholds.find((f) => f.id === state.footholdId) : undefined;
  return foothold?.dropThrough ? { targetKey: 'drop:' + foothold.id, kind: 'drop', position: state.position } : null;
}
