import type {
  Foothold,
  Id,
  Ladder,
  MapDef,
  MonsterSpawn,
  NpcPlacement,
  Portal,
  SpawnPoint,
} from '../../contracts/index.js';

type Platform = readonly [x1: number, y1: number, x2: number, y2: number];
type MonsterPlacement = { monsterId: Id; x: number; roamLeft: number; roamRight: number };
type MapBlueprint = {
  id: Id;
  name: string;
  width: number;
  themeKey: string;
  musicKey: string;
  safe: boolean;
  boss: boolean;
  platforms: Platform[];
  ladders: Omit<Ladder, 'id'>[];
  extraSpawns: SpawnPoint[];
  portals: Portal[];
  npcs: NpcPlacement[];
  monsters: MonsterPlacement[];
};

const blueprints: MapBlueprint[] = [
  {
    id: 'camp', name: '晨光營地', width: 1440, themeKey: 'camp', musicKey: 'theme-field', safe: false, boss: false,
    platforms: [[400, 500, 700, 500], [900, 520, 1150, 450]],
    ladders: [{ x: 550, topY: 500, bottomY: 600 }],
    extraSpawns: [{ id: 'start', x: 150, y: 600 }],
    portals: [
      { id: 'camp:east', x: 1340, y: 600, targetMapId: 'town', targetSpawnId: 'left', requiredQuestId: 'q01', minLevel: 1 },
    ],
    npcs: [{ npcId: 'guide', x: 250, y: 600 }],
    monsters: [
      { monsterId: 'snail', x: 1000, roamLeft: 950, roamRight: 1050 },
      { monsterId: 'snail', x: 1125, roamLeft: 1075, roamRight: 1175 },
      { monsterId: 'snail', x: 1250, roamLeft: 1200, roamRight: 1300 },
    ],
  },
  {
    id: 'town', name: '木葉鎮', width: 1920, themeKey: 'town', musicKey: 'theme-town', safe: true, boss: false,
    platforms: [[500, 500, 800, 500], [1250, 500, 1550, 500]],
    ladders: [{ x: 650, topY: 500, bottomY: 600 }],
    extraSpawns: [{ id: 'center', x: 960, y: 600 }],
    portals: [
      { id: 'town:west', x: 100, y: 600, targetMapId: 'camp', targetSpawnId: 'right', requiredQuestId: null, minLevel: 1 },
      { id: 'town:east', x: 1820, y: 600, targetMapId: 'forest-edge', targetSpawnId: 'left', requiredQuestId: 'q02', minLevel: 1 },
    ],
    npcs: [
      { npcId: 'mentor', x: 700, y: 600 },
      { npcId: 'merchant', x: 1000, y: 600 },
      { npcId: 'healer', x: 1300, y: 600 },
    ],
    monsters: [],
  },
  {
    id: 'forest-edge', name: '嫩芽林道', width: 1920, themeKey: 'forest', musicKey: 'theme-field', safe: false, boss: false,
    platforms: [[400, 490, 800, 490], [950, 520, 1300, 450], [1400, 420, 1700, 420]],
    ladders: [{ x: 600, topY: 490, bottomY: 600 }, { x: 1500, topY: 420, bottomY: 600 }],
    extraSpawns: [],
    portals: [
      { id: 'forest-edge:west', x: 100, y: 600, targetMapId: 'town', targetSpawnId: 'right', requiredQuestId: null, minLevel: 1 },
      { id: 'forest-edge:east', x: 1820, y: 600, targetMapId: 'mushroom-wood', targetSpawnId: 'left', requiredQuestId: 'q03', minLevel: 1 },
    ],
    npcs: [],
    monsters: [
      { monsterId: 'snail', x: 500, roamLeft: 320, roamRight: 680 },
      { monsterId: 'snail', x: 900, roamLeft: 720, roamRight: 1080 },
      { monsterId: 'slime', x: 1300, roamLeft: 1120, roamRight: 1480 },
      { monsterId: 'slime', x: 1650, roamLeft: 1470, roamRight: 1830 },
    ],
  },
  {
    id: 'mushroom-wood', name: '菌傘深林', width: 2160, themeKey: 'forest', musicKey: 'theme-field', safe: false, boss: false,
    platforms: [[300, 480, 700, 480], [950, 390, 1300, 390], [1450, 500, 1900, 430]],
    ladders: [{ x: 500, topY: 480, bottomY: 600 }, { x: 1100, topY: 390, bottomY: 600 }],
    extraSpawns: [],
    portals: [
      { id: 'mushroom-wood:west', x: 100, y: 600, targetMapId: 'forest-edge', targetSpawnId: 'right', requiredQuestId: null, minLevel: 1 },
      { id: 'mushroom-wood:east', x: 2060, y: 600, targetMapId: 'red-ridge', targetSpawnId: 'left', requiredQuestId: 'q04', minLevel: 1 },
    ],
    npcs: [],
    monsters: [
      { monsterId: 'mushroom', x: 450, roamLeft: 270, roamRight: 630 },
      { monsterId: 'mushroom', x: 850, roamLeft: 670, roamRight: 1030 },
      { monsterId: 'mushroom', x: 1250, roamLeft: 1070, roamRight: 1430 },
      { monsterId: 'slime', x: 1700, roamLeft: 1520, roamRight: 1880 },
    ],
  },
  {
    id: 'red-ridge', name: '赤岩山徑', width: 2160, themeKey: 'rock', musicKey: 'theme-field', safe: false, boss: false,
    platforms: [[300, 540, 650, 440], [800, 440, 1200, 440], [1500, 500, 1900, 500]],
    ladders: [{ x: 950, topY: 440, bottomY: 600 }, { x: 1700, topY: 500, bottomY: 600 }],
    extraSpawns: [],
    portals: [
      { id: 'red-ridge:west', x: 100, y: 600, targetMapId: 'mushroom-wood', targetSpawnId: 'right', requiredQuestId: null, minLevel: 1 },
      { id: 'red-ridge:east', x: 2060, y: 600, targetMapId: 'mine-gate', targetSpawnId: 'left', requiredQuestId: 'q06', minLevel: 1 },
    ],
    npcs: [{ npcId: 'keeper', x: 250, y: 600 }],
    monsters: [
      { monsterId: 'boar', x: 450, roamLeft: 290, roamRight: 610 },
      { monsterId: 'boar', x: 850, roamLeft: 690, roamRight: 1010 },
      { monsterId: 'boar', x: 1300, roamLeft: 1140, roamRight: 1460 },
      { monsterId: 'golem', x: 1750, roamLeft: 1590, roamRight: 1910 },
    ],
  },
  {
    id: 'mine-gate', name: '古礦入口', width: 1920, themeKey: 'rock', musicKey: 'theme-field', safe: false, boss: false,
    platforms: [[350, 470, 700, 470], [1000, 420, 1400, 420]],
    ladders: [{ x: 500, topY: 470, bottomY: 600 }, { x: 1200, topY: 420, bottomY: 600 }],
    extraSpawns: [],
    portals: [
      { id: 'mine-gate:west', x: 100, y: 600, targetMapId: 'red-ridge', targetSpawnId: 'right', requiredQuestId: null, minLevel: 1 },
      { id: 'mine-gate:east', x: 1820, y: 600, targetMapId: 'guardian-arena', targetSpawnId: 'entry', requiredQuestId: 'q07', minLevel: 1 },
    ],
    npcs: [],
    monsters: [
      { monsterId: 'golem', x: 450, roamLeft: 300, roamRight: 600 },
      { monsterId: 'golem', x: 850, roamLeft: 700, roamRight: 1000 },
      { monsterId: 'sentinel', x: 1250, roamLeft: 1100, roamRight: 1400 },
      { monsterId: 'sentinel', x: 1600, roamLeft: 1450, roamRight: 1750 },
    ],
  },
  {
    id: 'guardian-arena', name: '守衛祭壇', width: 1440, themeKey: 'rock', musicKey: 'theme-boss', safe: false, boss: true,
    platforms: [[250, 460, 480, 460], [960, 460, 1190, 460]],
    ladders: [{ x: 360, topY: 460, bottomY: 600 }, { x: 1080, topY: 460, bottomY: 600 }],
    extraSpawns: [{ id: 'entry', x: 160, y: 600 }],
    portals: [
      { id: 'guardian-arena:exit', x: 100, y: 600, targetMapId: 'mine-gate', targetSpawnId: 'right', requiredQuestId: null, minLevel: 1 },
    ],
    npcs: [],
    monsters: [{ monsterId: 'guardian', x: 1000, roamLeft: 600, roamRight: 1250 }],
  },
];

function buildMap(blueprint: MapBlueprint): MapDef {
  const ground: Foothold = {
    id: `${blueprint.id}:ground`, x1: 0, y1: 600, x2: blueprint.width, y2: 600, dropThrough: false,
  };
  const footholds: Foothold[] = [
    ground,
    ...blueprint.platforms.map(([x1, y1, x2, y2], index) => ({
      id: `${blueprint.id}:platform-${index + 1}`, x1, y1, x2, y2, dropThrough: true,
    })),
  ];
  const ladders: Ladder[] = blueprint.ladders.map((ladder, index) => ({
    id: `${blueprint.id}:ladder-${index + 1}`,
    ...ladder,
  }));
  const spawns: SpawnPoint[] = [
    { id: 'left', x: 100, y: 600 },
    { id: 'right', x: blueprint.width - 100, y: 600 },
    ...blueprint.extraSpawns,
  ];
  const monsterCounts = new Map<Id, number>();
  const monsters: MonsterSpawn[] = blueprint.monsters.map((monster) => {
    const index = (monsterCounts.get(monster.monsterId) ?? 0) + 1;
    monsterCounts.set(monster.monsterId, index);
    return {
      spawnId: `${blueprint.id}:${monster.monsterId}:${index}`,
      monsterId: monster.monsterId,
      x: monster.x,
      y: 600,
      roamLeft: monster.roamLeft,
      roamRight: monster.roamRight,
    };
  });
  return {
    id: blueprint.id,
    name: blueprint.name,
    width: blueprint.width,
    height: 720,
    themeKey: blueprint.themeKey,
    musicKey: blueprint.musicKey,
    safe: blueprint.safe,
    spawns,
    footholds,
    ladders,
    walls: [
      { x: 0, y: 0, width: 32, height: 720 },
      { x: blueprint.width - 32, y: 0, width: 32, height: 720 },
    ],
    portals: blueprint.portals,
    npcs: blueprint.npcs,
    monsters,
    boss: blueprint.boss,
  };
}

export const maps: Record<Id, MapDef> = Object.fromEntries(
  blueprints.map((blueprint) => [blueprint.id, buildMap(blueprint)]),
);
