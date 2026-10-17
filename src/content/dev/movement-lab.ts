import type { MapDef } from '../../contracts/index.js';

/** Developer-only collision fixture; it is intentionally absent from worldCatalog. */
export const movementLab: MapDef = {
  id: 'movement-lab',
  name: '移動測試場',
  width: 960,
  height: 720,
  themeKey: 'dev:movement-lab',
  musicKey: 'dev:silence',
  safe: true,
  spawns: [
    { id: 'left', x: 80, y: 600 },
    { id: 'right', x: 880, y: 600 },
  ],
  footholds: [
    { id: 'movement-lab:ground', x1: 0, y1: 600, x2: 960, y2: 600, dropThrough: false },
    { id: 'movement-lab:platform-1', x1: 150, y1: 500, x2: 300, y2: 500, dropThrough: true },
    { id: 'movement-lab:slope-1', x1: 350, y1: 580, x2: 600, y2: 500, dropThrough: true },
    { id: 'movement-lab:platform-2', x1: 700, y1: 450, x2: 850, y2: 450, dropThrough: true },
  ],
  ladders: [
    { id: 'movement-lab:ladder-1', x: 225, topY: 500, bottomY: 600 },
    { id: 'movement-lab:ladder-2', x: 760, topY: 450, bottomY: 600 },
  ],
  walls: [
    { x: 640, y: 390, width: 20, height: 210 },
    { x: 390, y: 430, width: 120, height: 12 },
  ],
  portals: [],
  npcs: [],
  monsters: [],
  boss: false,
};
