export type AssetPack = 'actors' | 'environment' | 'interface' | 'audio';

export type AssetImage = {
  key: string;
  url: string;
  columns: number;
  rows: number;
  displayWidth: number;
  displayHeight: number;
  pivotX: number;
  pivotY: number;
};

export type AssetAnimation = {
  key: string;
  imageKey: string;
  frames: number[];
  frameMs: number[];
  loop: boolean;
};

export type AssetAudio = {
  key: string;
  url: string;
  /** Tried when `url` cannot be fetched or decoded (e.g. a browser without Ogg Vorbis support). */
  fallbackUrl?: string;
  kind: 'music' | 'sfx';
  loop: boolean;
  /** Music only: the adaptive set this layer belongs to (a map's `musicKey`). */
  group?: string;
  /** Music only: 'base' always plays; 'combat'/'phase2' fade in with intensity, sample-synced to base. */
  layer?: AudioLayer;
  /** One-shots only: music bus gain (0..1) while this stinger plays. */
  duck?: number;
  /** One-shots only: random playback-rate variation in cents, so repeats never sound identical. */
  variance?: number;
};

export type AudioLayer = 'base' | 'combat' | 'phase2';

/** Pack manifests use entry-relative URLs; image dimensions must divide evenly by rows and columns. */
export type AssetManifest = {
  version: 1;
  pack: AssetPack;
  images: AssetImage[];
  animations: AssetAnimation[];
  audio: AssetAudio[];
};
