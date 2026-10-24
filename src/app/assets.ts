import type {
  AssetAnimation,
  AssetAudio,
  AssetImage,
  AssetManifest,
  AssetPack,
} from '../contracts/asset-manifest.js';
import type {
  HeroAnchorFrame,
  HeroAnchorManifest,
  HeroAnchorOutfit,
  HeroAnchorPose,
} from '../contracts/hero-anchors.js';

export const REQUIRED_ASSET_PACKS: readonly AssetPack[] = [
  'actors',
  'environment',
  'interface',
  'audio',
];

export type AssetManifestIssue = {
  pack: AssetPack;
  stage: 'fetch' | 'http' | 'json' | 'manifest' | 'duplicate';
  message: string;
};

export class AssetManifestLoadError extends Error {
  readonly issues: readonly AssetManifestIssue[];

  constructor(issues: readonly AssetManifestIssue[]) {
    super(issues.map(({ pack, message }) => `${pack}: ${message}`).join('\n'));
    this.name = 'AssetManifestLoadError';
    this.issues = issues;
  }
}

type ManifestResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

export type ManifestFetcher = (url: string) => Promise<ManifestResponse>;

type PackManifestResult =
  | { pack: AssetPack; manifest: AssetManifest }
  | { pack: AssetPack; issue: AssetManifestIssue };

const expectedImageKeys: Record<Exclude<AssetPack, 'audio'>, readonly string[]> = {
  actors: [
    'actor:hero-cloth', 'actor:hero-leather', 'actor:hero-iron',
    'equip:starter-sword', 'equip:iron-sword', 'equip:steel-sword', 'equip:guardian-sword', 'equip:frost-tide-sword',
    'equip:cloth-cap', 'equip:leather-cap', 'equip:iron-helm',
    'actor:snail', 'actor:slime', 'actor:mushroom', 'actor:boar', 'actor:golem', 'actor:sentinel', 'actor:guardian', 'actor:frost-wolf', 'actor:frost-crab', 'actor:frost-tide-warden', 'actor:sand-scorpion',
    'actor:guide', 'actor:mentor', 'actor:merchant', 'actor:healer', 'actor:keeper', 'actor:frost-guide', 'actor:sands-guide',
  ],
  environment: [
    ...(['camp', 'town', 'forest', 'rock', 'frost', 'frost-pine', 'frost-cave', 'sand', 'sand-dune'] as const).flatMap((theme) =>
      (['sky', 'far', 'mid'] as const).map((layer) => `env:${theme}:${layer}`)),
    'env:tile-ground', 'env:tile-platform', 'env:tile-slope', 'env:ladder',
    'env:portal', 'env:town-sign', 'env:mine-door', 'env:altar',
  ],
  interface: [
    ...[
      'starter-sword', 'iron-sword', 'steel-sword', 'guardian-sword', 'frost-tide-sword',
      'cloth-shirt', 'leather-vest', 'iron-mail', 'cloth-cap', 'leather-cap', 'iron-helm',
      'small-red', 'large-red', 'small-blue', 'large-blue', 'snail-shell', 'slime-gel',
      'mushroom-cap', 'boar-tusk', 'stone-chip', 'metal-shard', 'frost-fang', 'ice-shell', 'amber-scale', 'forest-seed',
      'spore-sample', 'ridge-emblem', 'guardian-core',
    ].map((id) => `item:${id}`),
    ...['heavy-strike', 'sweep', 'iron-guard', 'vitality', 'rest-recovery'].map((id) => `skill:${id}`),
    'marker:quest', 'marker:portal', 'marker:shop', 'marker:player',
    'panel:frame', 'button:normal', 'button:hover', 'button:pressed',
    'bar:hp', 'bar:mp', 'bar:exp', 'slot:normal', 'slot:selected',
    'vfx:heavy-strike', 'vfx:sweep', 'vfx:hit', 'vfx:levelup', 'vfx:guard',
  ],
};

const expectedAudioKeys = [
  'theme-town', 'theme-field', 'theme-boss',
  'ui-click', 'jump', 'attack', 'hit', 'hurt', 'pickup', 'potion', 'equip',
  'quest', 'levelup', 'portal', 'death', 'boss-win',
] as const;

const heroAnchorFrameCounts: Record<HeroAnchorPose, number> = {
  idle: 4,
  walk: 6,
  jump: 2,
  climb: 4,
  attack: 6,
  hurt: 2,
  dead: 4,
  buff: 4,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function requiredString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label}.${key} must be a non-empty string`);
  }
  return value;
}

function requiredInteger(record: Record<string, unknown>, key: string, label: string, minimum: number): number {
  const value = record[key];
  if (!Number.isInteger(value) || typeof value !== 'number' || value < minimum) {
    throw new Error(`${label}.${key} must be an integer >= ${minimum}`);
  }
  return value;
}

function validateRelativeAssetUrl(url: string): void {
  if (
    url.startsWith('/') ||
    url.startsWith('\\') ||
    /^[a-z][a-z\d+.-]*:/i.test(url) ||
    url.includes('\\') ||
    url.includes('?') ||
    url.includes('#') ||
    url.includes('%') ||
    url.split('/').some((part) => part === '..')
  ) {
    throw new Error(`asset URL must be a safe entry-relative path: ${url}`);
  }
}

function parseImage(value: unknown, index: number): AssetImage {
  const label = `images[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  const key = requiredString(value, 'key', label);
  const url = requiredString(value, 'url', label);
  validateRelativeAssetUrl(url);
  const columns = requiredInteger(value, 'columns', label, 1);
  const rows = requiredInteger(value, 'rows', label, 1);
  const displayWidth = value.displayWidth;
  const displayHeight = value.displayHeight;
  const pivotX = value.pivotX;
  const pivotY = value.pivotY;
  if (!isFiniteNumber(displayWidth) || displayWidth <= 0 || !isFiniteNumber(displayHeight) || displayHeight <= 0) {
    throw new Error(`${label} display dimensions must be finite positive numbers`);
  }
  if (!isFiniteNumber(pivotX) || pivotX < 0 || pivotX > 1 || !isFiniteNumber(pivotY) || pivotY < 0 || pivotY > 1) {
    throw new Error(`${label} pivot must be within 0..1`);
  }
  return { key, url, columns, rows, displayWidth, displayHeight, pivotX, pivotY };
}

function parseAnimation(value: unknown, index: number): AssetAnimation {
  const label = `animations[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  const key = requiredString(value, 'key', label);
  const imageKey = requiredString(value, 'imageKey', label);
  const rawFrames = value.frames;
  const rawFrameMs = value.frameMs;
  if (!Array.isArray(rawFrames) || rawFrames.length === 0 || !Array.isArray(rawFrameMs) || rawFrameMs.length !== rawFrames.length) {
    throw new Error(`${label} requires matching non-empty frames and frameMs arrays`);
  }
  const frames: number[] = [];
  const frameMs: number[] = [];
  for (let frameIndex = 0; frameIndex < rawFrames.length; frameIndex += 1) {
    const frame = rawFrames[frameIndex];
    const duration = rawFrameMs[frameIndex];
    if (!Number.isInteger(frame) || typeof frame !== 'number' || frame < 0) {
      throw new Error(`${label}.frames[${frameIndex}] must be a non-negative integer`);
    }
    if (!isFiniteNumber(duration) || duration <= 0) {
      throw new Error(`${label}.frameMs[${frameIndex}] must be a positive finite number`);
    }
    frames.push(frame);
    frameMs.push(duration);
  }
  if (typeof value.loop !== 'boolean') throw new Error(`${label}.loop must be boolean`);
  return { key, imageKey, frames, frameMs, loop: value.loop };
}

function parseAudio(value: unknown, index: number): AssetAudio {
  const label = `audio[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  const key = requiredString(value, 'key', label);
  const url = requiredString(value, 'url', label);
  validateRelativeAssetUrl(url);
  if (value.kind !== 'music' && value.kind !== 'sfx') throw new Error(`${label}.kind must be music or sfx`);
  if (typeof value.loop !== 'boolean') throw new Error(`${label}.loop must be boolean`);
  if (value.fallbackUrl === undefined) return { key, url, kind: value.kind, loop: value.loop };
  const fallbackUrl = requiredString(value, 'fallbackUrl', label);
  validateRelativeAssetUrl(fallbackUrl);
  return { key, url, fallbackUrl, kind: value.kind, loop: value.loop };
}

/** Validates the runtime manifest shape and its pack's required v1 content keys. */
export function parseAssetManifest(value: unknown, expectedPack: AssetPack): AssetManifest {
  if (!isRecord(value)) throw new Error('manifest must be an object');
  if (value.version !== 1) throw new Error('manifest version must be 1');
  if (value.pack !== expectedPack) throw new Error(`manifest pack must be ${expectedPack}`);
  if (!Array.isArray(value.images) || !Array.isArray(value.animations) || !Array.isArray(value.audio)) {
    throw new Error('manifest must define images, animations, and audio arrays');
  }

  const images = value.images.map(parseImage);
  const animations = value.animations.map(parseAnimation);
  const audio = value.audio.map(parseAudio);
  if (images.length === 0 && audio.length === 0) throw new Error('manifest contains no runtime assets');
  if (expectedPack !== 'audio' && images.length === 0) throw new Error('image pack contains no images');
  if (expectedPack === 'audio' && audio.length === 0) throw new Error('audio pack contains no audio entries');

  const keys = new Set<string>();
  for (const entry of [...images, ...animations, ...audio]) {
    if (keys.has(entry.key)) throw new Error(`duplicate asset key: ${entry.key}`);
    keys.add(entry.key);
  }
  const imageByKey = new Map(images.map((image) => [image.key, image]));
  for (const animation of animations) {
    const image = imageByKey.get(animation.imageKey);
    if (!image) throw new Error(`animation ${animation.key} references missing image ${animation.imageKey}`);
    const frameCount = image.columns * image.rows;
    if (animation.frames.some((frame) => frame >= frameCount)) {
      throw new Error(`animation ${animation.key} frame is outside its sprite sheet`);
    }
  }

  const imageKeys = new Set(images.map(({ key }) => key));
  const audioKeys = new Set(audio.map(({ key }) => key));
  const requiredImages = expectedPack === 'audio' ? [] : expectedImageKeys[expectedPack];
  const missingImages = requiredImages.filter((key) => !imageKeys.has(key));
  const missingAudio = expectedPack === 'audio' ? expectedAudioKeys.filter((key) => !audioKeys.has(key)) : [];
  const missing = [...missingImages, ...missingAudio];
  if (missing.length > 0) throw new Error(`required keys missing: ${missing.join(', ')}`);

  return { version: 1, pack: expectedPack, images, animations, audio };
}

function parseHeroAnchorFrame(value: unknown, label: string): HeroAnchorFrame {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  const hand = value.hand;
  const head = value.head;
  if (!isRecord(hand) || !isRecord(head)) throw new Error(`${label} requires hand and head anchors`);
  const handX = hand.x;
  const handY = hand.y;
  const handRotation = hand.rotationDeg;
  const headX = head.x;
  const headY = head.y;
  if (!isFiniteNumber(handX) || !isFiniteNumber(handY) || !isFiniteNumber(handRotation)
    || !isFiniteNumber(headX) || !isFiniteNumber(headY)) {
    throw new Error(`${label} coordinates and rotation must be finite numbers`);
  }
  return {
    hand: { x: handX, y: handY, rotationDeg: handRotation },
    head: { x: headX, y: headY },
  };
}

function parseHeroAnchorPose(value: unknown, outfit: HeroAnchorOutfit, pose: HeroAnchorPose): HeroAnchorFrame[] {
  const label = `heroes.${outfit}.${pose}`;
  if (!Array.isArray(value) || value.length !== heroAnchorFrameCounts[pose]) {
    throw new Error(`${label} must contain ${heroAnchorFrameCounts[pose]} valid frames`);
  }
  return value.map((frame, index) => parseHeroAnchorFrame(frame, `${label}[${index}]`));
}

function parseHeroAnchorOutfit(value: unknown, outfit: HeroAnchorOutfit): Record<HeroAnchorPose, HeroAnchorFrame[]> {
  if (!isRecord(value)) throw new Error(`heroes.${outfit} must be an object`);
  return {
    idle: parseHeroAnchorPose(value.idle, outfit, 'idle'),
    walk: parseHeroAnchorPose(value.walk, outfit, 'walk'),
    jump: parseHeroAnchorPose(value.jump, outfit, 'jump'),
    climb: parseHeroAnchorPose(value.climb, outfit, 'climb'),
    attack: parseHeroAnchorPose(value.attack, outfit, 'attack'),
    hurt: parseHeroAnchorPose(value.hurt, outfit, 'hurt'),
    dead: parseHeroAnchorPose(value.dead, outfit, 'dead'),
    buff: parseHeroAnchorPose(value.buff, outfit, 'buff'),
  };
}

/** Validates the separate hero-hand/head anchor file required by the formal actor sheets. */
export function parseHeroAnchorManifest(value: unknown): HeroAnchorManifest {
  if (!isRecord(value) || value.version !== 1) throw new Error('hero anchors version must be 1');
  const coordinateSpace = value.coordinateSpace;
  if (!isRecord(coordinateSpace)
    || coordinateSpace.width !== 96
    || coordinateSpace.height !== 96
    || coordinateSpace.origin !== 'frame-top-left'
    || coordinateSpace.facing !== 'right'
    || coordinateSpace.sourceFramePixels !== 128) {
    throw new Error('hero anchors coordinateSpace must use 96x96 top-left frames sourced from 128px cells facing right');
  }
  const heroes = value.heroes;
  if (!isRecord(heroes)) throw new Error('hero anchors must define heroes');
  return {
    version: 1,
    coordinateSpace: {
      width: 96,
      height: 96,
      origin: 'frame-top-left',
      facing: 'right',
      sourceFramePixels: 128,
    },
    heroes: {
      cloth: parseHeroAnchorOutfit(heroes.cloth, 'cloth'),
      leather: parseHeroAnchorOutfit(heroes.leather, 'leather'),
      iron: parseHeroAnchorOutfit(heroes.iron, 'iron'),
    },
  };
}

/** Loads the canonical anchors beside the actor manifest, using the same entry-relative base URL. */
export async function loadRequiredHeroAnchors(
  baseUrl: string,
  fetcher: ManifestFetcher,
): Promise<HeroAnchorManifest> {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const url = `${base}assets/actors/anchors.json`;
  let response: ManifestResponse;
  try {
    response = await fetcher(url);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`GET ${url} failed: ${reason}`);
  }
  if (!response.ok) throw new Error(`GET ${url} returned HTTP ${response.status}`);
  let raw: unknown;
  try {
    raw = await response.json();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`cannot parse ${url}: ${reason}`);
  }
  try {
    return parseHeroAnchorManifest(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`invalid hero anchors at ${url}: ${reason}`);
  }
}

/** Loads all four manifests or fails with a per-pack diagnostic; no empty pack fallback exists. */
export async function loadRequiredAssetManifests(
  baseUrl: string,
  fetcher: ManifestFetcher,
): Promise<AssetManifest[]> {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const loaded: PackManifestResult[] = await Promise.all(REQUIRED_ASSET_PACKS.map(async (pack): Promise<PackManifestResult> => {
    const url = `${base}assets/${pack}/manifest.json`;
    try {
      const response = await fetcher(url);
      if (!response.ok) {
        return {
          pack,
          issue: { pack, stage: 'http' as const, message: `GET ${url} returned HTTP ${response.status}` },
        };
      }
      let raw: unknown;
      try {
        raw = await response.json();
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { pack, issue: { pack, stage: 'json' as const, message: `cannot parse ${url}: ${reason}` } };
      }
      try {
        return { pack, manifest: parseAssetManifest(raw, pack) };
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { pack, issue: { pack, stage: 'manifest' as const, message: reason } };
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return { pack, issue: { pack, stage: 'fetch' as const, message: `GET ${url} failed: ${reason}` } };
    }
  }));

  const issues: AssetManifestIssue[] = [];
  const manifests: AssetManifest[] = [];
  for (const entry of loaded) {
    if ('issue' in entry) issues.push(entry.issue);
    else manifests.push(entry.manifest);
  }
  const globalKeys = new Set<string>();
  for (const manifest of manifests) {
    for (const entry of [...manifest.images, ...manifest.animations, ...manifest.audio]) {
      if (globalKeys.has(entry.key)) {
        issues.push({ pack: manifest.pack, stage: 'duplicate', message: `duplicate key across packs: ${entry.key}` });
      }
      globalKeys.add(entry.key);
    }
  }

  if (issues.length > 0 || manifests.length !== REQUIRED_ASSET_PACKS.length) {
    throw new AssetManifestLoadError(issues.length > 0 ? issues : REQUIRED_ASSET_PACKS.map((pack) => ({
      pack,
      stage: 'manifest' as const,
      message: 'required manifest did not load',
    })));
  }
  return manifests;
}
