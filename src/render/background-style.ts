import type { MapDef } from '../contracts/definitions.js';

type BackgroundLayerName = 'sky' | 'far' | 'mid';

const MIDGROUND_OVERRIDES: Readonly<Record<string, string>> = {
  'mine-gate': 'env:mine:mid',
};

export const MAP_BACKGROUND_IMAGE_KEYS = Object.values(MIDGROUND_OVERRIDES);

/** Loading and rendering share the same map override without altering world/save data. */
export function backgroundImageKey(map: Pick<MapDef, 'id' | 'themeKey'>, layer: BackgroundLayerName): string {
  return (layer === 'mid' && Object.hasOwn(MIDGROUND_OVERRIDES, map.id))
    ? MIDGROUND_OVERRIDES[map.id]!
    : `env:${map.themeKey}:${layer}`;
}
