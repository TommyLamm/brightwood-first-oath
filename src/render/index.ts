import Phaser from 'phaser';
import type { AssetAnimation, AssetImage, AssetManifest } from '../contracts/asset-manifest.js';
import type { ContentCatalog, MapDef } from '../contracts/definitions.js';
import type { HeroAnchorManifest, HeroAnchorOutfit, HeroAnchorPose } from '../contracts/hero-anchors.js';
import type { VisualEvent, WorldRenderer, WorldSnapshot } from '../contracts/ports.js';
import type { AttackInstance, Id, Vec2 } from '../contracts/types.js';
import {
  claimVisualEventPlayback,
  pickAnimationFrame,
  pickSkillEffectFrame,
  selectHeroAnimation,
  selectMonsterAnimation,
  skillAnimationDuration,
  visualEventEffectKey,
} from './animation.js';
import {
  DAMAGE_NUMBER_LIFETIME_MS,
  damageNumberGeometry,
  formatDamageNumber,
  isDamageNumberEvent,
  monsterHealthBarGeometry,
  telegraphCueGeometry,
} from './combat-primitives.js';
import {
  actorFootOffset,
  heroAnchorPosition,
  heroAnchorRotation,
  GROUND_TILE_OVERLAP,
  groundTilePositions,
  ladderSpriteGeometry,
  npcNameGeometry,
  questMarkerGeometry,
  questMarkerNpcIds,
  PLATFORM_TILE_DISPLAY_HEIGHT,
  PLATFORM_TILE_DISPLAY_WIDTH,
  platformTilePositions,
  portalFootAnchor,
  rendererViewportGeometry,
  segmentTileGeometry,
  WORLD_DEPTH,
} from './geometry.js';

type RendererAssets = {
  images: Map<string, AssetImage>;
  animations: Map<string, AssetAnimation>;
};

type MapVisual = {
  map: MapDef;
  backgrounds: Phaser.GameObjects.TileSprite[];
  environmentLayers: Phaser.GameObjects.Container[];
  environmentTextureKeys: Set<string>;
  npcSprites: Map<string, {
    imageKey: string;
    nameText: Phaser.GameObjects.Text;
    questMarker: Phaser.GameObjects.Sprite;
  }>;
};

type TextEffect = {
  object: Phaser.GameObjects.Text;
  expiresAtMs: number;
  position: Vec2;
  /** Unstacked x of the event, used to decide which numbers share a spot. */
  anchorX: number;
  startedAtMs: number;
  kind: 'damage' | 'hit' | 'levelup';
};

type SpriteEffect = {
  object: Phaser.GameObjects.Sprite;
  imageKey: string;
  animationKey: string;
  startedAtMs: number;
  expiresAtMs: number;
};

type TextureRegistration = {
  url: string;
  columns: number;
  rows: number;
};

type DrawnActor = {
  sprite: Phaser.GameObjects.Sprite;
  frame: number;
  footOffsetY: number;
};

const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;
const DAMAGE_TEXT_LIMIT = 30;
const DAMAGE_STACK_WINDOW_MS = 700;
const DAMAGE_STACK_RADIUS = 48;
const DAMAGE_STACK_STEP = 18;
const DAMAGE_STACK_DEPTH = 4;
const DROP_DRAW_LIMIT = 60;
/** Ordinary monsters show a name plate only within this horizontal distance of the hero, to avoid clutter. */
const MONSTER_NAME_RANGE_PX = 360;
const PARTICLE_LIMIT = 100;
const EVENT_LIFETIME_MS = DAMAGE_NUMBER_LIFETIME_MS;
const registeredTextures = new WeakMap<Phaser.Textures.TextureManager, Map<string, TextureRegistration>>();
const HERO_IMAGE_KEYS = ['actor:hero-cloth', 'actor:hero-leather', 'actor:hero-iron'] as const;
const HERO_ANIMATION_STATES = ['idle', 'walk', 'jump', 'climb', 'attack', 'hurt', 'dead', 'buff'] as const;
const HERO_ANCHOR_FRAME_COUNTS: Record<HeroAnchorPose, number> = {
  idle: 4,
  walk: 6,
  jump: 2,
  climb: 4,
  attack: 6,
  hurt: 2,
  dead: 4,
  buff: 4,
};
const MONSTER_ANIMATION_STATES = ['idle', 'walk', 'attack', 'hurt', 'dead'] as const;
const VFX_IMAGE_KEYS = ['vfx:heavy-strike', 'vfx:sweep', 'vfx:hit', 'vfx:levelup', 'vfx:guard'] as const;
/**
 * Maps that share a background theme get a light colour wash over the parallax layers so they
 * do not look identical: three maps use 'rock' and two use 'forest'. Terrain and actors stay
 * untouched. A rectangle overlay is used because the CANVAS renderer does not support tint.
 */
const MAP_ATMOSPHERE: Readonly<Record<string, { color: number; alpha: number }>> = {
  'mushroom-wood': { color: 0x1d3a2c, alpha: 0.22 },
  'mine-gate': { color: 0x1c2233, alpha: 0.26 },
  'guardian-arena': { color: 0x3b1222, alpha: 0.3 },
};
const BACKGROUND_LAYERS = [
  { name: 'sky', factor: 0, depth: WORLD_DEPTH.sky },
  { name: 'far', factor: 0.2, depth: WORLD_DEPTH.far },
  { name: 'mid', factor: 0.5, depth: WORLD_DEPTH.mid },
] as const;

/** A load error is safe to display and retry; the currently active map remains intact. */
export class RendererAssetError extends Error {
  readonly code = 'RENDER_ASSET_ERROR';
  constructor(message: string, readonly assetKeys: string[] = []) {
    super(message);
    this.name = 'RendererAssetError';
  }
}

function validateManifests(manifests: AssetManifest[]): RendererAssets {
  const images = new Map<string, AssetImage>();
  const animations = new Map<string, AssetAnimation>();
  const allKeys = new Set<string>();

  const addKey = (key: string, kind: string): void => {
    if (!key.trim()) throw new RendererAssetError(`空白 ${kind} key`);
    if (allKeys.has(key)) throw new RendererAssetError(`Asset key 重複：${key}`, [key]);
    allKeys.add(key);
  };

  for (const manifest of manifests) {
    if (manifest.version !== 1) throw new RendererAssetError(`不支援 ${manifest.pack} manifest version`);
    for (const image of manifest.images) {
      addKey(image.key, 'image');
      if (!Number.isInteger(image.columns) || image.columns < 1 || !Number.isInteger(image.rows) || image.rows < 1) {
        throw new RendererAssetError(`Sprite 格數無效：${image.key}`, [image.key]);
      }
      if (!Number.isFinite(image.displayWidth) || !Number.isFinite(image.displayHeight)
        || !(image.displayWidth > 0) || !(image.displayHeight > 0)) {
        throw new RendererAssetError(`顯示尺寸無效：${image.key}`, [image.key]);
      }
      if (!Number.isFinite(image.pivotX) || !Number.isFinite(image.pivotY)
        || image.pivotX < 0 || image.pivotX > 1 || image.pivotY < 0 || image.pivotY > 1) {
        throw new RendererAssetError(`Pivot 必須在 0..1：${image.key}`, [image.key]);
      }
      validateRelativeUrl(image.url, image.key);
      images.set(image.key, image);
    }
    for (const animation of manifest.animations) {
      addKey(animation.key, 'animation');
      if (animation.frames.length === 0 || animation.frames.length !== animation.frameMs.length) {
        throw new RendererAssetError(`Animation frame/time 數量不符：${animation.key}`, [animation.key]);
      }
      if (typeof animation.loop !== 'boolean') {
        throw new RendererAssetError(`Animation loop 欄位無效：${animation.key}`, [animation.key]);
      }
      if (animation.frameMs.some((frameMs) => !Number.isFinite(frameMs) || frameMs <= 0)) {
        throw new RendererAssetError(`Animation frame 時間無效：${animation.key}`, [animation.key]);
      }
      animations.set(animation.key, animation);
    }
    for (const audio of manifest.audio) {
      addKey(audio.key, 'audio');
      validateRelativeUrl(audio.url, audio.key);
    }
  }

  for (const animation of animations.values()) {
    const image = images.get(animation.imageKey);
    if (!image) throw new RendererAssetError(`Animation 引用不存在的 image：${animation.key} → ${animation.imageKey}`, [animation.imageKey]);
    const frameCount = image.columns * image.rows;
    if (animation.frames.some((frame) => !Number.isInteger(frame) || frame < 0 || frame >= frameCount)) {
      throw new RendererAssetError(`Animation frame 超出 sprite sheet：${animation.key}`, [animation.key]);
    }
  }
  return { images, animations };
}

function validateRelativeUrl(url: string, key: string): void {
  if (!url || url.trim() !== url || /^(?:[a-z][a-z\d+.-]*:|\/|\\)/i.test(url)
    || /[\\?#%\u0000-\u001f]/.test(url) || /(?:^|\/)\.\.(?:\/|$)/.test(url)) {
    throw new RendererAssetError(`Asset URL 必須是入口相對路徑：${key}`, [key]);
  }
}

function validateHeroAnchors(manifest: HeroAnchorManifest | undefined): void {
  if (!manifest) return;
  const space = manifest.coordinateSpace;
  if (!space || !manifest.heroes || manifest.version !== 1 || space.width !== 96 || space.height !== 96
    || space.origin !== 'frame-top-left' || space.facing !== 'right' || space.sourceFramePixels !== 128) {
    throw new RendererAssetError('Hero anchors 必須使用 schema v1 的 96×96 frame-top-left 座標');
  }
  for (const outfit of ['cloth', 'leather', 'iron'] as const) {
    const outfitAnchors = manifest.heroes[outfit];
    if (!outfitAnchors) throw new RendererAssetError(`Hero anchors 缺少 outfit：${outfit}`);
    for (const pose of HERO_ANIMATION_STATES) {
      const frames = outfitAnchors[pose];
      if (!Array.isArray(frames) || frames.length !== HERO_ANCHOR_FRAME_COUNTS[pose]) {
        throw new RendererAssetError(`Hero anchors frame 數量無效：${outfit}:${pose}`);
      }
      for (const frame of frames) {
        const points = [frame?.head, frame?.hand];
        if (points.some((point) => !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)
          || point.x < 0 || point.x > space.width || point.y < 0 || point.y > space.height)
          || !Number.isFinite(frame.hand.rotationDeg)) {
          throw new RendererAssetError(`Hero anchors 座標無效：${outfit}:${pose}`);
        }
      }
    }
  }
}

function frameKey(imageKey: string, frame: number): string {
  return `__render_${encodeURIComponent(imageKey)}_${frame}`;
}

function requiredImageKeys(map: MapDef, catalog: ContentCatalog): Set<string> {
  const keys = new Set<string>([
    ...BACKGROUND_LAYERS.map(({ name }) => `env:${map.themeKey}:${name}`),
    ...HERO_IMAGE_KEYS,
  ]);
  if (map.footholds.some((foothold) => !foothold.dropThrough && foothold.y1 !== foothold.y2)) keys.add('env:tile-slope');
  if (map.footholds.some((foothold) => foothold.dropThrough)) keys.add('env:tile-platform');
  if (map.footholds.some((foothold) => !foothold.dropThrough && foothold.y1 === foothold.y2)) keys.add('env:tile-ground');
  if (map.ladders.length > 0) keys.add('env:ladder');
  if (map.portals.length > 0) keys.add('env:portal');
  for (const key of VFX_IMAGE_KEYS) keys.add(key);
  for (const skill of Object.values(catalog.rules.skills)) {
    if (skill.effectKey) keys.add(skill.effectKey);
  }
  if (map.npcs.length > 0) keys.add('marker:quest');

  for (const placement of map.npcs) {
    const npc = catalog.world.npcs[placement.npcId];
    if (npc) keys.add(npc.actorKey);
  }
  for (const spawn of map.monsters) {
    const monster = catalog.rules.monsters[spawn.monsterId];
    if (monster) keys.add(monster.actorKey);
  }
  for (const item of Object.values(catalog.rules.items)) {
    if (item.kind === 'weapon' || item.kind === 'hat') {
      if (item.visualKey) keys.add(item.visualKey);
    }
    keys.add(item.iconKey);
  }
  return keys;
}

function missingRequiredAnimations(map: MapDef, catalog: ContentCatalog, assets: RendererAssets): string[] {
  const required: { imageKey: string; state: string }[] = [];
  for (const imageKey of HERO_IMAGE_KEYS) {
    for (const state of HERO_ANIMATION_STATES) required.push({ imageKey, state });
  }
  for (const placement of map.npcs) {
    const npc = catalog.world.npcs[placement.npcId];
    if (npc) required.push({ imageKey: npc.actorKey, state: `npc:${npc.id}:idle` });
  }
  for (const spawn of map.monsters) {
    const monster = catalog.rules.monsters[spawn.monsterId];
    if (monster) {
      for (const state of MONSTER_ANIMATION_STATES) required.push({ imageKey: monster.actorKey, state: `${monster.id}:${state}` });
    }
  }
  const effectKeys = new Set<string>(VFX_IMAGE_KEYS);
  for (const skill of Object.values(catalog.rules.skills)) {
    if (skill.effectKey) effectKeys.add(skill.effectKey);
  }
  for (const imageKey of effectKeys) required.push({ imageKey, state: imageKey });

  return required
    .filter(({ imageKey, state }) => {
      const animation = animationFor(assets, imageKey, state);
      return !animation || !animationConformsToUse(imageKey, state, animation);
    })
    .map(({ imageKey, state }) => `${imageKey}:${state}`);
}

function animationConformsToUse(imageKey: string, state: string, animation: AssetAnimation): boolean {
  const animationState = state.split(':').at(-1) ?? state;
  const frameCounts: Record<string, number> = imageKey.startsWith('actor:hero-')
    ? { idle: 4, walk: 6, jump: 2, climb: 4, attack: 6, hurt: 2, dead: 4, buff: 4 }
    : imageKey.startsWith('actor:') && state.startsWith('npc:')
      ? { idle: 2 }
      : imageKey.startsWith('actor:')
        ? { idle: 2, walk: 6, attack: 4, hurt: 2, dead: 4 }
        : { [animationState]: 6 };
  const expectedFrameCount = frameCounts[animationState];
  if (animation.frames.length !== expectedFrameCount) return false;

  const expectedFrameMs: Record<string, number> = imageKey.startsWith('actor:hero-')
    ? { idle: 180, walk: 100, climb: 120, hurt: 100, dead: 120, buff: 100 }
    : imageKey.startsWith('actor:') && state.startsWith('npc:')
      ? { idle: 350 }
      : imageKey.startsWith('actor:')
        ? { idle: 200, walk: 120, hurt: 100, dead: 100 }
        : { [animationState]: 60 };
  const frameMs = expectedFrameMs[animationState];
  if (frameMs !== undefined && animation.frameMs.some((value) => value !== frameMs)) return false;
  const expectedLoop = imageKey.startsWith('actor:hero-')
    ? animationState === 'idle' || animationState === 'walk' || animationState === 'climb'
      ? true
      : ['attack', 'hurt', 'dead'].includes(animationState) ? false : undefined
    : imageKey.startsWith('actor:') && state.startsWith('npc:')
      ? true
      : imageKey.startsWith('actor:')
        ? animationState === 'idle' || animationState === 'walk'
        : false;
  if (expectedLoop !== undefined && animation.loop !== expectedLoop) return false;
  return true;
}

function animationFor(
  assets: RendererAssets,
  imageKey: string,
  requestedKey: string,
): AssetAnimation | undefined {
  const direct = assets.animations.get(requestedKey);
  if (direct?.imageKey === imageKey) return direct;
  const state = requestedKey.split(':').at(-1) ?? requestedKey;
  return [...assets.animations.values()].find((candidate) =>
    candidate.imageKey === imageKey && (candidate.key === state || candidate.key.endsWith(`:${state}`)),
  );
}

function actorImageKey(bodyVisual: Id | null, catalog: ContentCatalog): string {
  const imageKey = bodyVisual ? catalog.rules.items[bodyVisual]?.visualKey : null;
  return imageKey?.startsWith('actor:hero-') ? imageKey : 'actor:hero-cloth';
}

function vectorDistanceSquared(left: Vec2, right: Vec2): number {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  return dx * dx + dy * dy;
}

/**
 * Creates a snapshot-only renderer for a Phaser Scene supplied by the app.
 * Loading is transactional: candidate textures/layers are prepared before the old map is retired.
 */
export function createWorldRenderer(
  scene: Phaser.Scene,
  assetManifests: AssetManifest[],
  catalog: ContentCatalog,
  heroAnchors?: HeroAnchorManifest,
): WorldRenderer {
  const assets = validateManifests(assetManifests);
  validateHeroAnchors(heroAnchors);
  let textureRegistrations = registeredTextures.get(scene.textures);
  if (!textureRegistrations) {
    textureRegistrations = new Map();
    registeredTextures.set(scene.textures, textureRegistrations);
  }
  const loadedImages = new Set<string>();
  const ownedTextureKeys = new Set<string>();
  const actorFootOffsets = new Map<string, number[]>();
  // Visible (non-transparent) size of each actor sheet, in display pixels, used to
  // place health bars just above the drawn body instead of above the padded frame.
  const actorContentSizes = new Map<string, { width: number; height: number }>();
  const actorSprites = new Map<string, Phaser.GameObjects.Sprite>();
  const dropSprites = new Map<string, Phaser.GameObjects.Sprite>();
  const dropLabels = new Map<string, Phaser.GameObjects.Text>();
  const eventTexts = new Map<string, TextEffect>();
  const eventSprites = new Map<string, SpriteEffect>();
  const playedVisualEventIds = new Set<string>();
  const actorAnimationClocks = new Map<string, { animationKey: string; startedAtMs: number }>();
  const gearSprites = new Map<string, Phaser.GameObjects.Sprite>();
  const attackEffectSprites = new Map<string, Phaser.GameObjects.Sprite>();
  const actorsLayer = scene.add.container(0, 0).setDepth(WORLD_DEPTH.actors);
  const hpGraphics = scene.add.graphics().setDepth(WORLD_DEPTH.health);
  /** Name plate drawn above the boss health bar so the arena fight reads as a named encounter. */
  const bossNameText = scene.add.text(0, 0, '', {
    color: '#ffe7a8', fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: 'bold',
    stroke: '#2a1d22', strokeThickness: 4,
  }).setOrigin(0.5, 1).setDepth(WORLD_DEPTH.health).setVisible(false);
  /** Small name plates for ordinary monsters near the hero, so quest targets like 赤背野豬 are recognisable. */
  const monsterNameTexts = new Map<string, Phaser.GameObjects.Text>();
  const monsterNameText = (key: string): Phaser.GameObjects.Text => {
    let text = monsterNameTexts.get(key);
    if (!text) {
      text = scene.add.text(0, 0, '', {
        color: '#fff2cf', fontFamily: 'system-ui, sans-serif', fontSize: '11px', fontStyle: 'bold',
        stroke: '#231a1d', strokeThickness: 3,
      }).setOrigin(0.5, 1).setDepth(WORLD_DEPTH.health);
      monsterNameTexts.set(key, text);
    }
    return text;
  };
  const destroyMonsterNames = (): void => {
    for (const text of monsterNameTexts.values()) text.destroy();
    monsterNameTexts.clear();
  };
  const telegraphGraphics = scene.add.graphics().setDepth(WORLD_DEPTH.telegraph);
  const attackGraphics = scene.add.graphics().setDepth(WORLD_DEPTH.attack);
  let activeVisual: MapVisual | null = null;
  let disposed = false;
  let activeLoadCancel: (() => void) | null = null;

  const requireImages = (keys: Iterable<string>): AssetImage[] => {
    const missing = [...new Set(keys)].filter((key) => !assets.images.has(key));
    if (missing.length > 0) {
      throw new RendererAssetError(`缺少資產 manifest key：${missing.join(', ')}。補齊對應資產與 manifest 後可重試。`, missing);
    }
    return [...new Set(keys)].map((key) => assets.images.get(key)!);
  };

  const resolveUrl = (url: string): string => {
    const base = typeof document === 'undefined' ? import.meta.url : document.baseURI;
    return new URL(url, base).href;
  };

  const removeTexture = (key: string): void => {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    textureRegistrations!.delete(key);
    loadedImages.delete(key);
    ownedTextureKeys.delete(key);
    actorFootOffsets.delete(key);
    actorContentSizes.delete(key);
  };

  const measureActorFootOffsets = (asset: AssetImage): void => {
    if (!asset.key.startsWith('actor:') || actorFootOffsets.has(asset.key)) return;
    if (typeof document === 'undefined') {
      actorFootOffsets.set(asset.key, Array.from({ length: asset.columns * asset.rows }, () => 0));
      return;
    }

    const source = scene.textures.get(asset.key).getSourceImage() as CanvasImageSource & { width: number; height: number };
    const frameWidth = source.width / asset.columns;
    const frameHeight = source.height / asset.rows;
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new RendererAssetError(`無法檢查角色透明腳底：${asset.key}`, [asset.key]);
    }

    try {
      context.drawImage(source, 0, 0);
      const pixels = context.getImageData(0, 0, source.width, source.height).data;
      const offsets: number[] = [];
      let contentWidth = 0;
      let contentHeight = 0;
      for (let frame = 0; frame < asset.columns * asset.rows; frame += 1) {
        const frameX = (frame % asset.columns) * frameWidth;
        const frameY = Math.floor(frame / asset.columns) * frameHeight;
        let lastOpaqueRow = -1;
        for (let y = frameHeight - 1; y >= 0 && lastOpaqueRow < 0; y -= 1) {
          for (let x = 0; x < frameWidth; x += 1) {
            const alphaIndex = ((frameY + y) * source.width + frameX + x) * 4 + 3;
            if (pixels[alphaIndex]! > 0) {
              lastOpaqueRow = y;
              break;
            }
          }
        }
        offsets.push(actorFootOffset(asset.displayHeight, asset.pivotY, frameHeight, lastOpaqueRow));
        if (lastOpaqueRow >= 0) {
          let firstOpaqueRow = 0;
          let minX = frameWidth;
          let maxX = -1;
          for (let y = 0; y <= lastOpaqueRow; y += 1) {
            for (let x = 0; x < frameWidth; x += 1) {
              if (pixels[((frameY + y) * source.width + frameX + x) * 4 + 3]! > 0) {
                if (maxX < 0) firstOpaqueRow = y;
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
              }
            }
          }
          contentHeight = Math.max(contentHeight, (lastOpaqueRow - firstOpaqueRow + 1) * asset.displayHeight / frameHeight);
          contentWidth = Math.max(contentWidth, (maxX - minX + 1) * asset.displayWidth / frameWidth);
        }
      }
      actorFootOffsets.set(asset.key, offsets);
      if (contentHeight > 0) actorContentSizes.set(asset.key, { width: contentWidth, height: contentHeight });
    } catch (error) {
      throw new RendererAssetError(
        `無法讀取角色透明腳底：${asset.key}。確認圖片同源且可讀後重試。`,
        [asset.key],
      );
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  };

  const textureDisplayScale = (image: AssetImage): { x: number; y: number } => {
    const source = scene.textures.get(image.key).getSourceImage() as { width: number; height: number };
    return {
      x: image.displayWidth / (source.width / image.columns),
      y: image.displayHeight / (source.height / image.rows),
    };
  };

  const splitLoadedImage = (asset: AssetImage): void => {
    const texture = scene.textures.get(asset.key);
    const source = texture.getSourceImage() as { width?: number; height?: number };
    const width = source.width;
    const height = source.height;
    if (!width || !height || width % asset.columns !== 0 || height % asset.rows !== 0) {
      throw new RendererAssetError(
        `實際圖片尺寸 ${width ?? '?'}×${height ?? '?'} 無法依 ${asset.columns}×${asset.rows} 切格：${asset.key}。修正圖集或格數後可重試。`,
        [asset.key],
      );
    }
    const cellWidth = width / asset.columns;
    const cellHeight = height / asset.rows;
    for (let frame = 0; frame < asset.columns * asset.rows; frame += 1) {
      const x = (frame % asset.columns) * cellWidth;
      const y = Math.floor(frame / asset.columns) * cellHeight;
      texture.add(frameKey(asset.key, frame), 0, x, y, cellWidth, cellHeight);
    }
  };

  const loadImages = async (requested: AssetImage[]): Promise<Set<string>> => {
    if (disposed) throw new RendererAssetError('Renderer 已 dispose，不能載入資產');
    const toLoad: AssetImage[] = [];
    for (const image of requested) {
      if (loadedImages.has(image.key)) continue;
      if (scene.textures.exists(image.key)) {
        const registration = textureRegistrations!.get(image.key);
        if (registration?.url === resolveUrl(image.url) && registration.columns === image.columns && registration.rows === image.rows) {
          loadedImages.add(image.key);
          ownedTextureKeys.add(image.key);
          measureActorFootOffsets(image);
          continue;
        }
        throw new RendererAssetError(`Phaser texture key 已由其他來源佔用：${image.key}`, [image.key]);
      }
      toLoad.push(image);
    }
    const newlyLoaded = new Set<string>();
    if (toLoad.length === 0) return newlyLoaded;
    if (scene.load.isLoading()) throw new RendererAssetError('Phaser Scene Loader 正在處理其他載入；可稍後重試');

    await new Promise<void>((resolve, reject) => {
      const loadErrors: string[] = [];
      const clean = (): void => {
        scene.load.off(Phaser.Loader.Events.COMPLETE, onComplete);
        scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onFileError);
        activeLoadCancel = null;
      };
      const onComplete = (): void => {
        clean();
        if (loadErrors.length > 0) reject(new RendererAssetError(`資產載入失敗：${loadErrors.join(', ')}。確認 URL 與檔案後可重試。`, loadErrors));
        else resolve();
      };
      const onFileError = (file: Phaser.Loader.File): void => {
        loadErrors.push(file.key);
      };
      activeLoadCancel = (): void => {
        clean();
        reject(new RendererAssetError('Renderer dispose 時取消載入'));
      };
      scene.load.on(Phaser.Loader.Events.COMPLETE, onComplete);
      scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onFileError);
      try {
        for (const image of toLoad) scene.load.image(image.key, resolveUrl(image.url));
        scene.load.start();
      } catch (error) {
        clean();
        reject(error instanceof Error ? error : new RendererAssetError(String(error)));
      }
    }).then(() => {
      for (const image of toLoad) {
        if (!scene.textures.exists(image.key)) throw new RendererAssetError(`載入完成但找不到 Phaser texture：${image.key}。確認 URL 與檔案後可重試。`, [image.key]);
        splitLoadedImage(image);
        measureActorFootOffsets(image);
        newlyLoaded.add(image.key);
        loadedImages.add(image.key);
        ownedTextureKeys.add(image.key);
        textureRegistrations!.set(image.key, {
          url: resolveUrl(image.url),
          columns: image.columns,
          rows: image.rows,
        });
      }
    }).catch((error: unknown) => {
      for (const image of toLoad) {
        if (scene.textures.exists(image.key)) removeTexture(image.key);
      }
      throw error;
    });
    return newlyLoaded;
  };

  const setImageFrame = (sprite: Phaser.GameObjects.Sprite, image: AssetImage, frame: number): void => {
    const maxFrame = image.columns * image.rows - 1;
    sprite.setTexture(image.key, frameKey(image.key, Math.max(0, Math.min(frame, maxFrame))));
    sprite.setDisplaySize(image.displayWidth, image.displayHeight);
    sprite.setOrigin(image.pivotX, image.pivotY);
  };

  const addStaticSprite = (
    layer: Phaser.GameObjects.Container,
    imageKey: string,
    x: number,
    y: number,
  ): Phaser.GameObjects.Sprite => {
    const image = assets.images.get(imageKey)!;
    const sprite = scene.add.sprite(x, y, imageKey, frameKey(imageKey, 0));
    sprite.setDisplaySize(image.displayWidth, image.displayHeight).setOrigin(image.pivotX, image.pivotY);
    layer.add(sprite);
    return sprite;
  };

  const destroyVisual = (visual: MapVisual): void => {
    for (const background of visual.backgrounds) background.destroy();
    for (const layer of visual.environmentLayers) layer.destroy(true);
  };

  const updateBackgroundPositions = (): void => {
    if (!activeVisual) return;
    const camera = scene.cameras.main;
    const worldWidth = camera.width / camera.zoom;
    const worldHeight = camera.height / camera.zoom;
    activeVisual.backgrounds.forEach((background, index) => {
      const factor = BACKGROUND_LAYERS[index]!.factor;
      background.setPosition(camera.scrollX * factor, camera.scrollY * factor);
      background.setSize(worldWidth, worldHeight);
    });
  };

  const isInViewport = (position: Vec2, margin = 180): boolean => {
    const camera = scene.cameras.main;
    const left = camera.scrollX - margin;
    const top = camera.scrollY - margin;
    const right = camera.scrollX + camera.width / camera.zoom + margin;
    const bottom = camera.scrollY + camera.height / camera.zoom + margin;
    return position.x >= left && position.x <= right && position.y >= top && position.y <= bottom;
  };

  const buildMapVisual = (map: MapDef): MapVisual => {
    const backgrounds: Phaser.GameObjects.TileSprite[] = [];
    const layers = [
      scene.add.container(0, 0).setDepth(WORLD_DEPTH.terrain),
      scene.add.container(0, 0).setDepth(WORLD_DEPTH.foreground),
      scene.add.container(0, 0).setDepth(WORLD_DEPTH.effect),
    ];
    const terrainLayer = layers[0]!;
    const foregroundLayer = layers[1]!;
    const effectLayer = layers[2]!;
    const environmentTextureKeys = new Set<string>();
    const npcSprites = new Map<string, {
      imageKey: string;
      nameText: Phaser.GameObjects.Text;
      questMarker: Phaser.GameObjects.Sprite;
    }>();

    try {
    for (const { name, factor, depth } of BACKGROUND_LAYERS) {
      const key = `env:${map.themeKey}:${name}`;
      const image = assets.images.get(key)!;
      const background = scene.add.tileSprite(0, 0, BASE_WIDTH, BASE_HEIGHT, key).setOrigin(0, 0).setDepth(depth);
      background.setScrollFactor(factor);
      const scale = textureDisplayScale(image);
      background.setTileScale(scale.x, scale.y);
      backgrounds.push(background);
      environmentTextureKeys.add(key);
    }
    const atmosphere = MAP_ATMOSPHERE[map.id];
    if (atmosphere) {
      const wash = scene.add.container(0, 0).setDepth(WORLD_DEPTH.mid + 0.5).setScrollFactor(0);
      wash.add(scene.add.rectangle(-BASE_WIDTH, -BASE_HEIGHT, BASE_WIDTH * 3, BASE_HEIGHT * 3, atmosphere.color, atmosphere.alpha).setOrigin(0, 0));
      layers.push(wash);
    }

    for (const foothold of map.footholds) {
      const isSlope = foothold.y1 !== foothold.y2;
      const key = foothold.dropThrough
        ? 'env:tile-platform'
        : isSlope ? 'env:tile-slope' : 'env:tile-ground';
      const image = assets.images.get(key)!;
      if (key === 'env:tile-ground') {
        if (image.displayWidth <= GROUND_TILE_OVERLAP) {
          throw new RendererAssetError(`Ground tile display width must exceed its ${GROUND_TILE_OVERLAP}px overlap`, [key]);
        }
        for (const position of groundTilePositions(foothold, image.displayWidth, GROUND_TILE_OVERLAP)) {
          const tile = scene.add.sprite(position.x, position.y, key, frameKey(key, 0));
          tile.setDisplaySize(image.displayWidth, image.displayHeight).setOrigin(0, 0);
          terrainLayer.add(tile);
        }
      } else if (key === 'env:tile-platform') {
        if (image.displayWidth !== PLATFORM_TILE_DISPLAY_WIDTH || image.displayHeight !== PLATFORM_TILE_DISPLAY_HEIGHT) {
          throw new RendererAssetError(
            `Platform tile display size must be ${PLATFORM_TILE_DISPLAY_WIDTH}x${PLATFORM_TILE_DISPLAY_HEIGHT}`,
            [key],
          );
        }
        for (const position of platformTilePositions(foothold)) {
          const tile = scene.add.sprite(position.x, position.y, key, frameKey(key, 0));
          tile.setDisplaySize(image.displayWidth, image.displayHeight).setOrigin(0, 0);
          terrainLayer.add(tile);
        }
      } else {
        const geometry = segmentTileGeometry(foothold, image.displayHeight);
        const tile = scene.add.tileSprite(
          geometry.x,
          geometry.y,
          geometry.width,
          geometry.height,
          key,
        );
        const scale = textureDisplayScale(image);
        tile.setOrigin(geometry.originX, geometry.originY)
          .setRotation(geometry.rotation)
          .setTileScale(scale.x, scale.y);
        terrainLayer.add(tile);
      }
      environmentTextureKeys.add(key);
    }
    for (const ladder of map.ladders) {
      const image = assets.images.get('env:ladder')!;
      const geometry = ladderSpriteGeometry(ladder, image.displayWidth);
      if (geometry.height <= 0) throw new RendererAssetError(`Ladder 高度必須為正：${ladder.id}`, ['env:ladder']);
      const sprite = addStaticSprite(terrainLayer, 'env:ladder', geometry.x, geometry.y);
      sprite.setOrigin(geometry.originX, geometry.originY).setDisplaySize(geometry.width, geometry.height);
      environmentTextureKeys.add('env:ladder');
    }
    for (const portal of map.portals) {
      const anchor = portalFootAnchor(portal);
      addStaticSprite(terrainLayer, 'env:portal', anchor.x, anchor.y).setOrigin(anchor.originX, anchor.originY);
      environmentTextureKeys.add('env:portal');
    }
    for (const placement of map.npcs) {
      const npc = catalog.world.npcs[placement.npcId];
      if (!npc) continue;
      const image = assets.images.get(npc.actorKey)!;
      const nameGeometry = npcNameGeometry(placement, image.displayHeight);
      const text = scene.add.text(nameGeometry.x, nameGeometry.y, npc.name, {
        color: '#fff4d4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        stroke: '#27323a',
        strokeThickness: 3,
      }).setOrigin(nameGeometry.originX, nameGeometry.originY);
      const markerImage = assets.images.get('marker:quest')!;
      const questMarker = scene.add.sprite(placement.x, placement.y, markerImage.key, frameKey(markerImage.key, 0))
        .setDisplaySize(markerImage.displayWidth, markerImage.displayHeight)
        .setOrigin(markerImage.pivotX, markerImage.pivotY)
        .setVisible(false);
      foregroundLayer.add(text);
      foregroundLayer.add(questMarker);
      npcSprites.set(placement.npcId, { imageKey: npc.actorKey, nameText: text, questMarker });
      text.setDepth(placement.y + 0.1);
      questMarker.setDepth(placement.y + 0.2);
    }
    void effectLayer;
    return { map, backgrounds, environmentLayers: layers, environmentTextureKeys, npcSprites };
    } catch (error) {
      for (const background of backgrounds) background.destroy();
      for (const layer of layers) layer.destroy(true);
      throw error;
    }
  };

  const drawActor = (
    key: string,
    imageKey: string,
    animationKey: string,
    position: Vec2,
    facing: -1 | 1,
    nowMs: number,
    startedAtMs?: number,
    totalDurationMs?: number,
    frameOverride?: number,
  ): DrawnActor => {
    const image = assets.images.get(imageKey);
    if (!image) throw new RendererAssetError(`Snapshot 引用未載入角色圖：${imageKey}`, [imageKey]);
    let sprite = actorSprites.get(key);
    if (!sprite) {
      sprite = scene.add.sprite(position.x, position.y, imageKey, frameKey(imageKey, 0));
      actorsLayer.add(sprite);
      actorSprites.set(key, sprite);
    }
    const animation = animationFor(assets, imageKey, animationKey);
    const previousClock = actorAnimationClocks.get(key);
    const animationStartedAtMs = startedAtMs ?? (previousClock?.animationKey === animationKey ? previousClock.startedAtMs : nowMs);
    actorAnimationClocks.set(key, { animationKey, startedAtMs: animationStartedAtMs });
    const frame = frameOverride ?? pickAnimationFrame(animation, nowMs, animationStartedAtMs, totalDurationMs);
    const footOffsetY = imageKey.startsWith('actor:') ? actorFootOffsets.get(imageKey)?.[frame] ?? 0 : 0;
    setImageFrame(sprite, image, frame);
    sprite.setPosition(position.x, position.y + footOffsetY).setFlipX(facing < 0).setVisible(true).setActive(true).setDepth(position.y);
    return { sprite, frame, footOffsetY };
  };

  const drawEquipment = (
    slot: 'weapon' | 'hat',
    itemId: Id | null,
    position: Vec2,
    facing: -1 | 1,
    depth: number,
    rotation = 0,
  ): void => {
    if (!itemId) return;
    const item = catalog.rules.items[itemId];
    const image = item?.visualKey ? assets.images.get(item.visualKey) : undefined;
    if (!image) return;
    let sprite = gearSprites.get(slot);
    if (!sprite) {
      sprite = scene.add.sprite(position.x, position.y, image.key, frameKey(image.key, 0));
      actorsLayer.add(sprite);
      gearSprites.set(slot, sprite);
    }
    sprite.setTexture(image.key, frameKey(image.key, 0))
      .setDisplaySize(image.displayWidth, image.displayHeight)
      // flipX mirrors the texture inside its frame but keeps the origin, so mirror the
      // pivot too; otherwise off-centre grips (swords) detach from the hand facing left.
      .setOrigin(facing < 0 ? 1 - image.pivotX : image.pivotX, image.pivotY)
      .setPosition(position.x, position.y)
      .setFlipX(facing < 0)
      .setRotation(rotation)
      .setDepth(depth + 0.05)
      .setVisible(true)
      .setActive(true);
  };

  const attackStartedAt = (snapshot: WorldSnapshot, actorId: string): AttackInstance | undefined =>
    [...snapshot.attacks].reverse().find((attack) => attack.sourceId === actorId);

  const drawSnapshot = (snapshot: WorldSnapshot): void => {
    if (!activeVisual) throw new RendererAssetError('請先成功呼叫 loadMap(map)');
    if (snapshot.mapId !== activeVisual.map.id) throw new RendererAssetError(`Snapshot mapId ${snapshot.mapId} 與已載入地圖 ${activeVisual.map.id} 不一致`);
    updateBackgroundPositions();

    for (const sprite of actorSprites.values()) sprite.setVisible(false).setActive(false);
    for (const sprite of gearSprites.values()) sprite.setVisible(false).setActive(false);
    for (const sprite of attackEffectSprites.values()) sprite.setVisible(false).setActive(false);
    for (const sprite of dropSprites.values()) sprite.setVisible(false).setActive(false);
    hpGraphics.clear();
    bossNameText.setVisible(false);
    for (const text of monsterNameTexts.values()) text.setVisible(false);
    telegraphGraphics.clear();
    attackGraphics.clear();
    for (const label of dropLabels.values()) label.setVisible(false);

    const playerKey = actorImageKey(snapshot.player.visual.body, catalog);
    const playerAttack = attackStartedAt(snapshot, snapshot.player.id);
    const playerAnimation = selectHeroAnimation(
      snapshot.player.movement,
      snapshot.player.hp,
      snapshot.nowMs,
      playerAttack !== undefined,
      snapshot.player.animationKey,
    );
    const jumpAnimation = playerAnimation === 'jump' ? animationFor(assets, playerKey, 'jump') : undefined;
    const jumpFrame = jumpAnimation?.frames.length && playerAnimation === 'jump'
      ? jumpAnimation.frames[snapshot.player.movement.velocity.y < 0 ? 0 : 1]
      : undefined;
    const playerAnimationStartedAt = playerAnimation === 'attack' ? playerAttack?.startedAtMs : undefined;
    const playerAnimationDuration = playerAnimation === 'attack' && playerAttack
      ? skillDuration(playerAttack, catalog)
      : undefined;
    const drawnPlayer = drawActor(
      'player',
      playerKey,
      playerAnimation,
      snapshot.player.movement.position,
      snapshot.player.movement.facing,
      snapshot.nowMs,
      playerAnimationStartedAt,
      playerAnimationDuration,
      jumpFrame,
    );
    const playerSprite = drawnPlayer.sprite;
    if (heroAnchors) {
      const outfit = playerKey.slice('actor:hero-'.length) as HeroAnchorOutfit;
      const heroImage = assets.images.get(playerKey)!;
      const heroAnimation = animationFor(assets, playerKey, playerAnimation);
      const animationFrame = Math.max(0, heroAnimation?.frames.indexOf(drawnPlayer.frame) ?? 0);
      const anchorFrame = heroAnchors.heroes[outfit][playerAnimation][animationFrame];
      const worldAnchor = (point: typeof anchorFrame.head | typeof anchorFrame.hand): Vec2 =>
        heroAnchorPosition(
          snapshot.player.movement.position,
          heroImage,
          point,
          heroAnchors.coordinateSpace,
          snapshot.player.movement.facing,
          drawnPlayer.footOffsetY,
        );
      const hand = worldAnchor(anchorFrame.hand);
      const head = worldAnchor(anchorFrame.head);
      drawEquipment(
        'weapon',
        snapshot.player.visual.weapon,
        hand,
        snapshot.player.movement.facing,
        playerSprite.depth,
        heroAnchorRotation(anchorFrame.hand.rotationDeg, snapshot.player.movement.facing) * Math.PI / 180,
      );
      drawEquipment('hat', snapshot.player.visual.hat, head, snapshot.player.movement.facing, playerSprite.depth);
    }
    const questNpcIds = questMarkerNpcIds(snapshot.questViews, catalog.world.quests);
    for (const placement of activeVisual.map.npcs) {
      const npc = catalog.world.npcs[placement.npcId];
      const npcVisual = activeVisual.npcSprites.get(placement.npcId);
      if (!npc || !npcVisual) continue;
      const image = assets.images.get(npcVisual.imageKey)!;
      const npcSprite = drawActor(`npc:${placement.npcId}`, npcVisual.imageKey, `npc:${npc.id}:idle`, { x: placement.x, y: placement.y }, 1, snapshot.nowMs).sprite;
      const npcInViewport = isInViewport({ x: placement.x, y: placement.y });
      if (!npcInViewport) npcSprite.setVisible(false).setActive(false);
      npcVisual.nameText.setVisible(npcInViewport);
      const nameGeometry = npcNameGeometry(placement, image.displayHeight);
      npcVisual.nameText.setPosition(nameGeometry.x, nameGeometry.y);
      const markerImage = assets.images.get('marker:quest')!;
      const markerGeometry = questMarkerGeometry(placement, image.displayHeight, markerImage.displayHeight);
      npcVisual.questMarker.setPosition(markerGeometry.x, markerGeometry.y)
        .setVisible(npcInViewport && questNpcIds.has(placement.npcId))
        .setActive(npcInViewport && questNpcIds.has(placement.npcId));
    }
    scene.cameras.main.startFollow(playerSprite, true);
    for (const monster of snapshot.monsters) {
      const definition = catalog.rules.monsters[monster.monsterId];
      if (!definition) continue;
      const attack = attackStartedAt(snapshot, monster.id);
      const animationKey = selectMonsterAnimation(monster, snapshot.nowMs, attack !== undefined);
      const dead = monster.mode === 'dead' || monster.movement.mode === 'dead';
      const monsterIsAttacking = animationKey.endsWith(':attack');
      const monsterSprite = drawActor(
        `monster:${monster.spawnId}`,
        definition.actorKey,
        animationKey,
        monster.movement.position,
        monster.movement.facing,
        snapshot.nowMs,
        dead ? monster.deadAtMs ?? snapshot.nowMs : monsterIsAttacking ? attack?.startedAtMs : undefined,
        monsterIsAttacking && attack ? skillDuration(attack, catalog) : undefined,
      ).sprite;
      if (!isInViewport(monster.movement.position)) monsterSprite.setVisible(false).setActive(false);
      if (!dead && isInViewport(monster.movement.position)) {
        const image = assets.images.get(definition.actorKey);
        const content = actorContentSizes.get(definition.actorKey);
        const bar = monsterHealthBarGeometry(
          monster.movement.position,
          monster.hp,
          definition.maxHp,
          content?.width ?? image?.displayWidth ?? Math.max(monster.width, definition.width),
          content?.height ?? image?.displayHeight ?? Math.max(monster.height, definition.height),
          activeVisual.map.boss,
        );
        hpGraphics.fillStyle(0x261f2a, 0.88).fillRect(bar.x - 1, bar.y - 1, bar.width + 2, bar.height + 2);
        hpGraphics.fillStyle(0x342e32, 0.95).fillRect(bar.x, bar.y, bar.width, bar.height);
        hpGraphics.fillStyle(bar.ratio > 0.35 ? 0x76c36d : 0xe2625c, 1)
          .fillRect(bar.fillX, bar.fillY, bar.fillWidth, bar.fillHeight);
        hpGraphics.lineStyle(activeVisual.map.boss ? 2 : 1, activeVisual.map.boss ? 0xffd884 : 0x17151b, 0.95)
          .strokeRect(bar.x, bar.y, bar.width, bar.height);
        if (activeVisual.map.boss) {
          bossNameText.setText(`${definition.name}  Lv.${definition.level}`)
            .setPosition(bar.x + bar.width / 2, bar.y - 3)
            .setVisible(true);
        } else if (Math.abs(monster.movement.position.x - snapshot.player.movement.position.x) <= MONSTER_NAME_RANGE_PX) {
          const label = `${definition.name} Lv.${definition.level}`;
          const nameText = monsterNameText(monster.spawnId);
          if (nameText.text !== label) nameText.setText(label);
          nameText.setPosition(bar.x + bar.width / 2, bar.y - 2).setVisible(true);
        }
      }
    }

    const visibleDrops = [...snapshot.drops]
      .filter((drop) => drop.expiresAtMs > snapshot.nowMs)
      .sort((a, b) => vectorDistanceSquared(a.position, snapshot.player.movement.position) - vectorDistanceSquared(b.position, snapshot.player.movement.position))
      .slice(0, DROP_DRAW_LIMIT);
    const visibleDropIds = new Set(visibleDrops.map((drop) => drop.id));
    for (const [dropId, sprite] of dropSprites) {
      if (!visibleDropIds.has(dropId)) {
        sprite.destroy();
        dropSprites.delete(dropId);
        actorSprites.delete(`drop:${dropId}`);
        actorAnimationClocks.delete(`drop:${dropId}`);
      }
    }
    for (const [dropId, label] of dropLabels) {
      if (!visibleDropIds.has(dropId)) {
        label.destroy();
        dropLabels.delete(dropId);
      }
    }
    for (const drop of visibleDrops) {
      const imageKey = drop.itemId ? catalog.rules.items[drop.itemId]?.iconKey : undefined;
      if (imageKey && assets.images.has(imageKey)) {
        const sprite = drawActor(`drop:${drop.id}`, imageKey, '', drop.position, 1, snapshot.nowMs).sprite;
        if (!isInViewport(drop.position)) sprite.setVisible(false).setActive(false);
        dropSprites.set(drop.id, sprite);
      } else if (drop.coins > 0) {
        const label = getDropText(drop.id, `${drop.coins} 金幣`, drop.position, snapshot.nowMs);
        label.setVisible(true).setPosition(drop.position.x, drop.position.y - 8);
      }
    }

    const visibleAttackIds = new Set(snapshot.attacks.map((attack) => attack.id));
    for (const [attackId, sprite] of attackEffectSprites) {
      if (!visibleAttackIds.has(attackId)) {
        sprite.destroy();
        attackEffectSprites.delete(attackId);
      }
    }
    for (const attack of snapshot.attacks) {
      drawAttackCue(attack, snapshot.nowMs, attackGraphics);
      drawSkillEffect(attack, snapshot.nowMs);
    }
    for (const telegraph of snapshot.telegraphs) {
      const source = snapshot.monsters.find((monster) => monster.id === telegraph.sourceId);
      const cue = telegraphCueGeometry(telegraph, snapshot.nowMs, source?.lastAttackAtMs, activeVisual.map.boss);
      if (!cue) continue;
      const fillColor = activeVisual.map.boss ? 0xd94442 : 0xef6459;
      const borderColor = activeVisual.map.boss ? 0xffd071 : 0xff8a73;
      telegraphGraphics.fillStyle(fillColor, cue.fillAlpha)
        .fillRect(cue.rect.x, cue.rect.y, cue.rect.width, cue.rect.height);
      telegraphGraphics.lineStyle(cue.borderWidth, borderColor, cue.borderAlpha)
        .strokeRect(cue.rect.x, cue.rect.y, cue.rect.width, cue.rect.height);
      if (cue.progressWidth !== null && cue.progressWidth > 0) {
        telegraphGraphics.fillStyle(borderColor, cue.borderAlpha)
          .fillRect(cue.rect.x, cue.rect.y, cue.progressWidth, Math.min(4, cue.rect.height));
      }
    }

    for (const event of snapshot.effects) processVisualEvent(event, snapshot.nowMs);
    pruneEvents(snapshot.nowMs);
    actorsLayer.sort('depth');
    updateCamera(snapshot, playerSprite);
  };

  const skillDuration = (attack: AttackInstance, sourceCatalog: ContentCatalog): number => {
    const skill = sourceCatalog.rules.skills[attack.skillId];
    return skillAnimationDuration(skill);
  };

  const drawAttackCue = (attack: AttackInstance, nowMs: number, graphics: Phaser.GameObjects.Graphics): void => {
    const skill = catalog.rules.skills[attack.skillId];
    const visibleMs = Math.max(skill?.activeMs ?? 0, 140);
    if (!skill || nowMs < attack.startedAtMs + skill.windupMs || nowMs >= attack.startedAtMs + skill.windupMs + visibleMs) return;
    // Skills with their own VFX strip already show the hit; drawing the hit box on top looked like a debug overlay.
    if (skill.effectKey && assets.images.has(skill.effectKey)) return;
    // Otherwise draw a short slash arc across the reach instead of a raw rectangle.
    const progress = (nowMs - attack.startedAtMs - skill.windupMs) / visibleMs;
    const radius = Math.max(18, skill.reach * 0.75);
    const centerX = attack.origin.x;
    const centerY = attack.origin.y - skill.height * 0.5;
    const sweep = Phaser.Math.DegToRad(100);
    const start = attack.facing > 0 ? -sweep / 2 : Math.PI - sweep / 2;
    const alpha = 0.85 * (1 - progress * 0.6);
    graphics.lineStyle(5, 0xfff1c2, alpha * 0.45).beginPath()
      .arc(centerX, centerY, radius, start, start + sweep, false).strokePath();
    graphics.lineStyle(2, 0xffffff, alpha).beginPath()
      .arc(centerX, centerY, radius, start, start + sweep, false).strokePath();
  };

  const drawSkillEffect = (attack: AttackInstance, nowMs: number): void => {
    const skill = catalog.rules.skills[attack.skillId];
    if (!skill?.effectKey) return;
    const image = assets.images.get(skill.effectKey);
    const animation = image ? animationFor(assets, image.key, skill.effectKey) : undefined;
    if (!image || !animation) {
      throw new RendererAssetError(`攻擊引用缺少效果資產或 animation：${skill.effectKey}`, [skill.effectKey]);
    }
    const frame = pickSkillEffectFrame(animation, nowMs, attack.startedAtMs, skill.windupMs);
    if (frame === null) return;
    let sprite = attackEffectSprites.get(attack.id);
    if (!sprite) {
      sprite = scene.add.sprite(0, 0, image.key, frameKey(image.key, 0)).setDepth(WORLD_DEPTH.effect);
      attackEffectSprites.set(attack.id, sprite);
    }
    const position = {
      x: attack.origin.x + attack.facing * skill.reach / 2,
      y: attack.origin.y - skill.height / 2,
    };
    setImageFrame(sprite, image, frame);
    sprite.setPosition(position.x, position.y).setFlipX(attack.facing < 0).setDepth(WORLD_DEPTH.effect)
      .setVisible(true).setActive(true);
  };

  const getDropText = (id: string, content: string, position: Vec2, nowMs: number): Phaser.GameObjects.Text => {
    let object = dropLabels.get(id);
    if (!object) {
      object = scene.add.text(position.x, position.y, content, {
        color: '#ffeaa5', fontFamily: 'system-ui, sans-serif', fontSize: '12px',
        stroke: '#342e32', strokeThickness: 3,
      }).setOrigin(0.5, 1);
      actorsLayer.add(object);
      dropLabels.set(id, object);
    }
    object.setText(content)
      .setPosition(position.x, position.y - 8 + Math.sin(nowMs / 180) * 2)
      .setDepth(position.y)
      .setVisible(true);
    return object;
  };

  const processVisualEvent = (event: VisualEvent, nowMs: number): void => {
    if (playedVisualEventIds.has(event.id)) return;
    const textLifetimeMs = event.kind === 'levelup' ? 1500 : EVENT_LIFETIME_MS;
    if (event.atMs + Math.max(textLifetimeMs, EVENT_LIFETIME_MS) <= nowMs) {
      claimVisualEventPlayback(event.id, playedVisualEventIds);
      return;
    }
    const effectKey = visualEventEffectKey(event, catalog.rules.skills['iron-guard']?.effectKey);
    let animation: AssetAnimation | undefined;
    if (effectKey) {
      if (!assets.images.has(effectKey)) {
        throw new RendererAssetError(`Snapshot 引用未載入視覺特效圖：${effectKey}`, [effectKey]);
      }
      animation = animationFor(assets, effectKey, effectKey);
      if (!animation) throw new RendererAssetError(`缺少視覺特效 animation：${effectKey}`, [effectKey]);
    }
    const spriteLifetimeMs = animation?.frameMs.reduce((sum, frameMs) => sum + frameMs, 0) ?? 0;
    const expiresAtMs = event.atMs + Math.max(textLifetimeMs, spriteLifetimeMs);
    if (expiresAtMs <= nowMs) {
      claimVisualEventPlayback(event.id, playedVisualEventIds);
      return;
    }
    if (playedVisualEventIds.has(event.id)) return;
    if (isDamageNumberEvent(event.kind)) {
      const oldestDamage = [...eventTexts.entries()].find(([, entry]) => isDamageNumberEvent(entry.kind));
      const damageTextCount = [...eventTexts.values()].filter((entry) => isDamageNumberEvent(entry.kind)).length;
      if (damageTextCount >= DAMAGE_TEXT_LIMIT && oldestDamage) {
        oldestDamage[1].object.destroy();
        eventTexts.delete(oldestDamage[0]);
      }
      // Hits that land on the same spot in quick succession stack upwards instead of overprinting.
      const stackIndex = [...eventTexts.values()].filter((entry) => isDamageNumberEvent(entry.kind)
        && event.atMs - entry.startedAtMs < DAMAGE_STACK_WINDOW_MS
        && Math.abs(entry.anchorX - event.position.x) < DAMAGE_STACK_RADIUS).length % DAMAGE_STACK_DEPTH;
      const position = {
        x: event.position.x + (stackIndex % 2 === 0 ? 0 : stackIndex % 4 === 1 ? 10 : -10),
        y: event.position.y - stackIndex * DAMAGE_STACK_STEP,
      };
      const object = scene.add.text(position.x, position.y - 20, formatDamageNumber(event.value), {
        color: event.kind === 'damage' ? '#ffaaa3' : '#fff0be',
        fontFamily: 'system-ui, sans-serif', fontSize: '18px', fontStyle: 'bold',
        stroke: '#502c35', strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(WORLD_DEPTH.text);
      eventTexts.set(event.id, {
        object,
        expiresAtMs: event.atMs + textLifetimeMs,
        position,
        anchorX: event.position.x,
        startedAtMs: event.atMs,
        kind: event.kind,
      });
    } else if (event.kind === 'levelup') {
      const object = scene.add.text(event.position.x, event.position.y - 55, 'LEVEL UP!', {
        color: '#fff4a8', fontFamily: 'system-ui, sans-serif', fontSize: '24px', fontStyle: 'bold',
        stroke: '#523c2b', strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(WORLD_DEPTH.text);
      eventTexts.set(event.id, {
        object,
        expiresAtMs: event.atMs + textLifetimeMs,
        position: { ...event.position },
        anchorX: event.position.x,
        startedAtMs: event.atMs,
        kind: event.kind,
      });
    }
    if (effectKey && animation && eventSprites.size < PARTICLE_LIMIT) {
      const image = assets.images.get(effectKey)!;
      const sprite = scene.add.sprite(event.position.x, event.position.y, image.key, frameKey(image.key, 0)).setDepth(WORLD_DEPTH.effect);
      sprite.setDisplaySize(image.displayWidth, image.displayHeight).setOrigin(image.pivotX, image.pivotY);
      eventSprites.set(event.id, { object: sprite, imageKey: image.key, animationKey: effectKey, startedAtMs: event.atMs, expiresAtMs: event.atMs + spriteLifetimeMs });
    }
    claimVisualEventPlayback(event.id, playedVisualEventIds);
  };

  const pruneEvents = (nowMs: number): void => {
    for (const [id, entry] of eventTexts) {
      if (entry.expiresAtMs <= nowMs) {
        entry.object.destroy();
        eventTexts.delete(id);
        continue;
      }
      if (isDamageNumberEvent(entry.kind)) {
        const geometry = damageNumberGeometry(entry.position, entry.startedAtMs, nowMs);
        if (geometry) {
          entry.object.setPosition(geometry.x, geometry.y).setAlpha(geometry.alpha).setScale(geometry.scale);
        }
      }
    }
    for (const [id, entry] of eventSprites) {
      if (entry.expiresAtMs <= nowMs) {
        entry.object.destroy();
        eventSprites.delete(id);
        continue;
      }
      const image = assets.images.get(entry.imageKey)!;
      const animation = animationFor(assets, image.key, entry.animationKey);
      setImageFrame(entry.object, image, pickAnimationFrame(animation, nowMs - entry.startedAtMs));
    }
  };

  const updateCamera = (snapshot: WorldSnapshot, playerSprite: Phaser.GameObjects.Sprite): void => {
    const camera = scene.cameras.main;
    camera.setBounds(0, 0, activeVisual!.map.width, activeVisual!.map.height, true);
    camera.setDeadzone(200, 120);
    camera.startFollow(playerSprite, true, 0.12, 0.12);
    updateBackgroundPositions();
    void snapshot;
  };

  const renderer: WorldRenderer = {
    async loadMap(map): Promise<void> {
      if (disposed) throw new RendererAssetError('Renderer 已 dispose，不能載入地圖');
      const missingCatalogRefs = [
        ...map.npcs.filter((placement) => !catalog.world.npcs[placement.npcId]).map((placement) => `npc:${placement.npcId}`),
        ...map.monsters.filter((spawn) => !catalog.rules.monsters[spawn.monsterId]).map((spawn) => `monster:${spawn.monsterId}`),
      ];
      if (missingCatalogRefs.length > 0) throw new RendererAssetError(`地圖引用未知內容：${missingCatalogRefs.join(', ')}`, missingCatalogRefs);
      const requestedKeys = requiredImageKeys(map, catalog);
      const requestedImages = requireImages(requestedKeys);
      const missingAnimations = missingRequiredAnimations(map, catalog, assets);
      if (missingAnimations.length > 0) {
        throw new RendererAssetError(`缺少或不符合規格的 animation manifest key：${missingAnimations.join(', ')}。修正動畫 metadata 後可重試。`, missingAnimations);
      }

      let newlyLoaded = new Set<string>();
      try {
        newlyLoaded = await loadImages(requestedImages);
        const candidate = buildMapVisual(map);
        const old = activeVisual;
        activeVisual = candidate;
        for (const sprite of actorSprites.values()) sprite.setVisible(false).setActive(false);
        if (old) {
          for (const [key, sprite] of actorSprites) {
            if (key !== 'player') {
              sprite.destroy();
              actorSprites.delete(key);
            actorAnimationClocks.delete(key);
            }
          }
        }
        dropSprites.clear();
        for (const label of dropLabels.values()) label.destroy();
        dropLabels.clear();
        destroyMonsterNames();
        for (const effect of eventTexts.values()) effect.object.destroy();
        eventTexts.clear();
        for (const effect of eventSprites.values()) effect.object.destroy();
        eventSprites.clear();
        for (const sprite of attackEffectSprites.values()) sprite.destroy();
        attackEffectSprites.clear();
        hpGraphics.clear();
        telegraphGraphics.clear();
        attackGraphics.clear();
        scene.cameras.main.stopFollow();
        scene.cameras.main.setBounds(0, 0, map.width, map.height, true).setDeadzone(200, 120);
        if (old) {
          destroyVisual(old);
          for (const key of old.environmentTextureKeys) {
            if (!candidate.environmentTextureKeys.has(key) && ownedTextureKeys.has(key)) removeTexture(key);
          }
        }
      } catch (error) {
        for (const key of newlyLoaded) removeTexture(key);
        if (error instanceof Error) throw error;
        throw new RendererAssetError(String(error));
      }
    },
    render(snapshot): void {
      if (disposed) return;
      drawSnapshot(snapshot);
    },
    resize(width, height): void {
      const viewport = rendererViewportGeometry(width, height, BASE_WIDTH, BASE_HEIGHT);
      if (disposed || !viewport) return;
      const camera = scene.cameras.main;
      camera.setViewport(0, 0, width, height);
      camera.setZoom(viewport.zoom);
      updateBackgroundPositions();
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      activeLoadCancel?.();
      if (activeVisual) {
        for (const key of activeVisual.environmentTextureKeys) {
          if (ownedTextureKeys.has(key)) removeTexture(key);
        }
        destroyVisual(activeVisual);
      }
      activeVisual = null;
      for (const sprite of actorSprites.values()) sprite.destroy();
      actorSprites.clear();
      actorAnimationClocks.clear();
      dropSprites.clear();
      for (const effect of eventTexts.values()) effect.object.destroy();
      eventTexts.clear();
      hpGraphics.destroy();
      bossNameText.destroy();
      destroyMonsterNames();
      telegraphGraphics.destroy();
      attackGraphics.destroy();
      scene.cameras.main.stopFollow();
      for (const label of dropLabels.values()) label.destroy();
      dropLabels.clear();
      gearSprites.clear();
      actorsLayer.destroy(true);
      for (const effect of eventSprites.values()) effect.object.destroy();
      eventSprites.clear();
      for (const sprite of attackEffectSprites.values()) sprite.destroy();
      attackEffectSprites.clear();
      playedVisualEventIds.clear();
      // Shared actor, gear and interface textures stay in the Scene for reuse.
      ownedTextureKeys.clear();
      loadedImages.clear();
    },
  };

  return renderer;
}
