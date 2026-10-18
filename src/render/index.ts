import Phaser from 'phaser';
import type { AssetAnimation, AssetImage, AssetManifest } from '../contracts/asset-manifest.js';
import type { ContentCatalog, MapDef } from '../contracts/definitions.js';
import type { VisualEvent, WorldRenderer, WorldSnapshot } from '../contracts/ports.js';
import type { AttackInstance, Id, Vec2 } from '../contracts/types.js';
import { groundTilePositions, segmentTileGeometry } from './geometry.js';

type RendererAssets = {
  images: Map<string, AssetImage>;
  animations: Map<string, AssetAnimation>;
};

type MapVisual = {
  map: MapDef;
  backgrounds: Phaser.GameObjects.TileSprite[];
  environmentLayers: Phaser.GameObjects.Container[];
  environmentTextureKeys: Set<string>;
  npcSprites: Map<string, { imageKey: string; nameText: Phaser.GameObjects.Text }>;
};

type TextEffect = {
  object: Phaser.GameObjects.Text;
  expiresAtMs: number;
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

const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;
const WORLD_DEPTH = {
  sky: 0,
  far: 1,
  mid: 2,
  terrain: 10,
  actors: 30,
  foreground: 35,
  health: 31,
  attack: 39,
  telegraph: 40,
  effect: 41,
  text: 42,
} as const;
const DAMAGE_TEXT_LIMIT = 30;
const DROP_DRAW_LIMIT = 60;
const PARTICLE_LIMIT = 100;
const EVENT_LIFETIME_MS = 900;
const GROUND_TILE_OVERLAP = 16;
const registeredTextures = new WeakMap<Phaser.Textures.TextureManager, Map<string, TextureRegistration>>();
const HERO_IMAGE_KEYS = ['actor:hero-cloth', 'actor:hero-leather', 'actor:hero-iron'] as const;
const HERO_ANIMATION_STATES = ['idle', 'walk', 'jump', 'climb', 'attack', 'hurt', 'dead', 'buff'] as const;
const MONSTER_ANIMATION_STATES = ['idle', 'walk', 'attack', 'hurt', 'dead'] as const;
const VFX_IMAGE_KEYS = ['vfx:heavy-strike', 'vfx:sweep', 'vfx:hit', 'vfx:levelup', 'vfx:guard'] as const;
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

function frameKey(imageKey: string, frame: number): string {
  return `__render_${encodeURIComponent(imageKey)}_${frame}`;
}

function requiredImageKeys(map: MapDef, catalog: ContentCatalog): Set<string> {
  const keys = new Set<string>([
    ...BACKGROUND_LAYERS.map(({ name }) => `env:${map.themeKey}:${name}`),
    ...HERO_IMAGE_KEYS,
  ]);
  if (map.footholds.some((foothold) => foothold.y1 !== foothold.y2)) keys.add('env:tile-slope');
  if (map.footholds.some((foothold) => foothold.y1 === foothold.y2 && foothold.dropThrough)) keys.add('env:tile-platform');
  if (map.footholds.some((foothold) => foothold.y1 === foothold.y2 && !foothold.dropThrough)) keys.add('env:tile-ground');
  if (map.ladders.length > 0) keys.add('env:ladder');
  if (map.portals.length > 0) keys.add('env:portal');
  for (const key of VFX_IMAGE_KEYS) keys.add(key);

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
  for (const imageKey of VFX_IMAGE_KEYS) required.push({ imageKey, state: imageKey });

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

function pickFrame(animation: AssetAnimation | undefined, nowMs: number, startedAtMs?: number, totalDurationMs?: number): number {
  if (!animation) return 0;
  if (totalDurationMs !== undefined && totalDurationMs > 0 && startedAtMs !== undefined) {
    const progress = Math.max(0, Math.min(0.999999, (nowMs - startedAtMs) / totalDurationMs));
    return animation.frames[Math.min(animation.frames.length - 1, Math.floor(progress * animation.frames.length))] ?? 0;
  }
  const duration = animation.frameMs.reduce((sum, value) => sum + value, 0);
  if (animation.loop) {
    let elapsed = ((nowMs % duration) + duration) % duration;
    for (let index = 0; index < animation.frames.length; index += 1) {
      if (elapsed < animation.frameMs[index]!) return animation.frames[index]!;
      elapsed -= animation.frameMs[index]!;
    }
  } else {
    let elapsed = Math.max(0, startedAtMs === undefined ? nowMs : nowMs - startedAtMs);
    for (let index = 0; index < animation.frames.length; index += 1) {
      if (elapsed < animation.frameMs[index]!) return animation.frames[index]!;
      elapsed -= animation.frameMs[index]!;
    }
  }
  return animation.frames.at(-1) ?? 0;
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
): WorldRenderer {
  const assets = validateManifests(assetManifests);
  let textureRegistrations = registeredTextures.get(scene.textures);
  if (!textureRegistrations) {
    textureRegistrations = new Map();
    registeredTextures.set(scene.textures, textureRegistrations);
  }
  const loadedImages = new Set<string>();
  const ownedTextureKeys = new Set<string>();
  const actorSprites = new Map<string, Phaser.GameObjects.Sprite>();
  const dropSprites = new Map<string, Phaser.GameObjects.Sprite>();
  const dropLabels = new Map<string, Phaser.GameObjects.Text>();
  const eventTexts = new Map<string, TextEffect>();
  const eventSprites = new Map<string, SpriteEffect>();
  const eventVfx = new Map<string, number>();
  const actorAnimationClocks = new Map<string, { animationKey: string; startedAtMs: number }>();
  const actorsLayer = scene.add.container(0, 0).setDepth(WORLD_DEPTH.actors);
  const hpGraphics = scene.add.graphics().setDepth(WORLD_DEPTH.health);
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
    const npcSprites = new Map<string, { imageKey: string; nameText: Phaser.GameObjects.Text }>();

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

    for (const foothold of map.footholds) {
      const isSlope = foothold.y1 !== foothold.y2;
      const key = isSlope
        ? 'env:tile-slope'
        : foothold.dropThrough ? 'env:tile-platform' : 'env:tile-ground';
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
      const height = ladder.bottomY - ladder.topY;
      if (height <= 0) throw new RendererAssetError(`Ladder 高度必須為正：${ladder.id}`, ['env:ladder']);
      const image = assets.images.get('env:ladder')!;
      const sprite = addStaticSprite(terrainLayer, 'env:ladder', ladder.x, ladder.bottomY);
      sprite.setOrigin(0.5, 1).setDisplaySize(image.displayWidth, height);
      environmentTextureKeys.add('env:ladder');
    }
    for (const portal of map.portals) {
      addStaticSprite(terrainLayer, 'env:portal', portal.x, portal.y).setOrigin(0.5, 1);
      environmentTextureKeys.add('env:portal');
    }
    for (const placement of map.npcs) {
      const npc = catalog.world.npcs[placement.npcId];
      if (!npc) continue;
      const image = assets.images.get(npc.actorKey)!;
      const text = scene.add.text(placement.x, placement.y - image.displayHeight - 4, npc.name, {
        color: '#fff4d4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        stroke: '#27323a',
        strokeThickness: 3,
      }).setOrigin(0.5, 1);
      foregroundLayer.add(text);
      npcSprites.set(placement.npcId, { imageKey: npc.actorKey, nameText: text });
      text.setDepth(placement.y + 0.1);
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
  ): Phaser.GameObjects.Sprite => {
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
    setImageFrame(sprite, image, frameOverride ?? pickFrame(animation, nowMs, animationStartedAtMs, totalDurationMs));
    sprite.setPosition(position.x, position.y).setFlipX(facing < 0).setVisible(true).setActive(true).setDepth(position.y);
    return sprite;
  };

  const attackStartedAt = (snapshot: WorldSnapshot, actorId: string): AttackInstance | undefined =>
    [...snapshot.attacks].reverse().find((attack) => attack.sourceId === actorId);

  const drawSnapshot = (snapshot: WorldSnapshot): void => {
    if (!activeVisual) throw new RendererAssetError('請先成功呼叫 loadMap(map)');
    if (snapshot.mapId !== activeVisual.map.id) throw new RendererAssetError(`Snapshot mapId ${snapshot.mapId} 與已載入地圖 ${activeVisual.map.id} 不一致`);
    updateBackgroundPositions();

    for (const sprite of actorSprites.values()) sprite.setVisible(false).setActive(false);
    for (const sprite of dropSprites.values()) sprite.setVisible(false).setActive(false);
    hpGraphics.clear();
    telegraphGraphics.clear();
    attackGraphics.clear();
    for (const label of dropLabels.values()) label.setVisible(false);

    const playerKey = actorImageKey(snapshot.player.visual.body, catalog);
    const playerAttack = attackStartedAt(snapshot, snapshot.player.id);
    const playerDead = snapshot.player.movement.mode === 'dead' || snapshot.player.hp <= 0;
    const playerHurt = snapshot.player.movement.knockbackUntilMs > snapshot.nowMs;
    const playerAnimation = playerDead
      ? 'dead'
      : playerHurt ? 'hurt'
        : playerAttack ? 'attack'
          : snapshot.player.animationKey === 'fall' ? 'jump' : snapshot.player.animationKey || 'idle';
    const jumpAnimation = playerAnimation === 'jump' ? animationFor(assets, playerKey, 'jump') : undefined;
    const jumpFrame = jumpAnimation?.frames.length && playerAnimation === 'jump'
      ? jumpAnimation.frames[snapshot.player.movement.velocity.y < 0 ? 0 : 1]
      : undefined;
    const playerAnimationStartedAt = playerAnimation === 'attack' ? playerAttack?.startedAtMs : undefined;
    const playerAnimationDuration = playerAnimation === 'attack' && playerAttack
      ? skillDuration(playerAttack, catalog)
      : undefined;
    const playerSprite = drawActor(
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
    for (const placement of activeVisual.map.npcs) {
      const npc = catalog.world.npcs[placement.npcId];
      const npcVisual = activeVisual.npcSprites.get(placement.npcId);
      if (!npc || !npcVisual) continue;
      const image = assets.images.get(npcVisual.imageKey)!;
      const npcSprite = drawActor(`npc:${placement.npcId}`, npcVisual.imageKey, `npc:${npc.id}:idle`, { x: placement.x, y: placement.y }, 1, snapshot.nowMs);
      const npcInViewport = isInViewport({ x: placement.x, y: placement.y });
      if (!npcInViewport) npcSprite.setVisible(false).setActive(false);
      npcVisual.nameText.setVisible(npcInViewport);
      npcVisual.nameText.setPosition(placement.x, placement.y - image.displayHeight - 4);
    }
    scene.cameras.main.startFollow(playerSprite, true);
    for (const monster of snapshot.monsters) {
      const definition = catalog.rules.monsters[monster.monsterId];
      if (!definition) continue;
      const attack = attackStartedAt(snapshot, monster.id);
      const dead = monster.mode === 'dead';
      const hurt = monster.movement.knockbackUntilMs > snapshot.nowMs;
      const animationKey = dead
        ? `${monster.monsterId}:dead`
        : hurt ? `${monster.monsterId}:hurt`
          : attack || monster.mode === 'windup' ? `${monster.monsterId}:attack`
            : `${monster.monsterId}:${monster.mode === 'patrol' || monster.mode === 'chase' ? 'walk' : 'idle'}`;
      const monsterIsAttacking = !dead && !hurt && animationKey.endsWith(':attack');
      const monsterSprite = drawActor(
        `monster:${monster.spawnId}`,
        definition.actorKey,
        animationKey,
        monster.movement.position,
        monster.movement.facing,
        snapshot.nowMs,
        dead ? monster.deadAtMs ?? snapshot.nowMs : monsterIsAttacking ? attack?.startedAtMs : undefined,
        monsterIsAttacking && attack ? skillDuration(attack, catalog) : undefined,
      );
      if (!isInViewport(monster.movement.position)) monsterSprite.setVisible(false).setActive(false);
      if (!dead && isInViewport(monster.movement.position)) {
        const width = Math.max(28, definition.width);
        const ratio = Math.max(0, Math.min(1, monster.hp / definition.maxHp));
        hpGraphics.fillStyle(0x342e32, 0.9).fillRect(monster.movement.position.x - width / 2, monster.movement.position.y - monster.height - 10, width, 5);
        hpGraphics.fillStyle(ratio > 0.35 ? 0x76c36d : 0xe2625c, 1).fillRect(monster.movement.position.x - width / 2 + 1, monster.movement.position.y - monster.height - 9, (width - 2) * ratio, 3);
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
        const sprite = drawActor(`drop:${drop.id}`, imageKey, '', drop.position, 1, snapshot.nowMs);
        if (!isInViewport(drop.position)) sprite.setVisible(false).setActive(false);
        dropSprites.set(drop.id, sprite);
      } else if (drop.coins > 0) {
        const label = getDropText(drop.id, `${drop.coins} 楓幣`, drop.position, snapshot.nowMs);
        label.setVisible(true).setPosition(drop.position.x, drop.position.y - 8);
      }
    }

    for (const attack of snapshot.attacks) drawAttackCue(attack, snapshot.nowMs, attackGraphics);
    for (const telegraph of snapshot.telegraphs) {
      telegraphGraphics.fillStyle(0xef6459, 0.2).fillRect(telegraph.rect.x, telegraph.rect.y, telegraph.rect.width, telegraph.rect.height);
      telegraphGraphics.lineStyle(2, 0xff8a73, 0.9).strokeRect(telegraph.rect.x, telegraph.rect.y, telegraph.rect.width, telegraph.rect.height);
    }

    for (const event of snapshot.effects) processVisualEvent(event, snapshot.nowMs);
    pruneEvents(snapshot.nowMs);
    actorsLayer.sort('depth');
    updateCamera(snapshot, playerSprite);
  };

  const skillDuration = (attack: AttackInstance, sourceCatalog: ContentCatalog): number => {
    const skill = sourceCatalog.rules.skills[attack.skillId];
    return skill ? skill.windupMs + skill.activeMs + skill.recoveryMs : 1;
  };

  const drawAttackCue = (attack: AttackInstance, nowMs: number, graphics: Phaser.GameObjects.Graphics): void => {
    const skill = catalog.rules.skills[attack.skillId];
    if (!skill || nowMs < attack.startedAtMs + skill.windupMs || nowMs >= attack.startedAtMs + skill.windupMs + skill.activeMs) return;
    const x = attack.origin.x + (attack.facing > 0 ? 0 : -skill.reach);
    const y = attack.origin.y - skill.height;
    graphics.fillStyle(0xf8e6a2, 0.16).fillRect(x, y, skill.reach, skill.height);
    graphics.lineStyle(1, 0xf8e6a2, 0.7).strokeRect(x, y, skill.reach, skill.height);
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
    if (eventVfx.has(event.id)) return;
    const textLifetimeMs = event.kind === 'levelup' ? 1500 : EVENT_LIFETIME_MS;
    if (event.atMs + Math.max(textLifetimeMs, EVENT_LIFETIME_MS) <= nowMs) return;
    let animation: AssetAnimation | undefined;
    if (event.key) {
      if (!assets.images.has(event.key)) {
        throw new RendererAssetError(`Snapshot 引用未載入視覺特效圖：${event.key}`, [event.key]);
      }
      animation = animationFor(assets, event.key, event.key);
      if (!animation) throw new RendererAssetError(`缺少視覺特效 animation：${event.key}`, [event.key]);
    }
    const spriteLifetimeMs = animation?.frameMs.reduce((sum, frameMs) => sum + frameMs, 0) ?? 0;
    const expiresAtMs = event.atMs + Math.max(textLifetimeMs, spriteLifetimeMs);
    if (expiresAtMs <= nowMs) return;
    eventVfx.set(event.id, expiresAtMs);
    if (event.kind === 'damage') {
      if (eventTexts.size >= DAMAGE_TEXT_LIMIT) {
        const oldest = [...eventTexts.entries()].find(([key]) => !key.startsWith('drop-text:'));
        if (oldest) {
          oldest[1].object.destroy();
          eventTexts.delete(oldest[0]);
        }
      }
      const object = scene.add.text(event.position.x, event.position.y - 20, event.value === undefined ? '命中' : String(event.value), {
        color: '#fff0be', fontFamily: 'system-ui, sans-serif', fontSize: '18px', fontStyle: 'bold',
        stroke: '#502c35', strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(WORLD_DEPTH.text);
      eventTexts.set(event.id, { object, expiresAtMs: event.atMs + textLifetimeMs });
    } else if (event.kind === 'levelup') {
      const object = scene.add.text(event.position.x, event.position.y - 55, 'LEVEL UP!', {
        color: '#fff4a8', fontFamily: 'system-ui, sans-serif', fontSize: '24px', fontStyle: 'bold',
        stroke: '#523c2b', strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(WORLD_DEPTH.text);
      eventTexts.set(event.id, { object, expiresAtMs: event.atMs + textLifetimeMs });
    }
    if (event.key && animation && eventSprites.size < PARTICLE_LIMIT) {
      const image = assets.images.get(event.key)!;
      const sprite = scene.add.sprite(event.position.x, event.position.y, image.key, frameKey(image.key, 0)).setDepth(WORLD_DEPTH.effect);
      sprite.setDisplaySize(image.displayWidth, image.displayHeight).setOrigin(image.pivotX, image.pivotY);
      eventSprites.set(event.id, { object: sprite, imageKey: image.key, animationKey: event.key, startedAtMs: event.atMs, expiresAtMs: event.atMs + spriteLifetimeMs });
    }
  };

  const pruneEvents = (nowMs: number): void => {
    for (const [id, entry] of eventTexts) {
      if (entry.expiresAtMs <= nowMs) {
        entry.object.destroy();
        eventTexts.delete(id);
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
      setImageFrame(entry.object, image, pickFrame(animation, nowMs - entry.startedAtMs));
    }
    for (const [id, expiresAtMs] of eventVfx) {
      if (expiresAtMs <= nowMs) eventVfx.delete(id);
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
        for (const effect of eventTexts.values()) effect.object.destroy();
        eventTexts.clear();
        for (const effect of eventSprites.values()) effect.object.destroy();
        eventSprites.clear();
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
      if (disposed || width <= 0 || height <= 0) return;
      const camera = scene.cameras.main;
      camera.setViewport(0, 0, width, height);
      camera.setZoom(Math.min(width / BASE_WIDTH, height / BASE_HEIGHT));
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
      telegraphGraphics.destroy();
      attackGraphics.destroy();
      scene.cameras.main.stopFollow();
      for (const label of dropLabels.values()) label.destroy();
      dropLabels.clear();
      actorsLayer.destroy(true);
      for (const effect of eventSprites.values()) effect.object.destroy();
      eventSprites.clear();
      eventVfx.clear();
      // Shared actor, gear and interface textures stay in the Scene for reuse.
      ownedTextureKeys.clear();
      loadedImages.clear();
    },
  };

  return renderer;
}
