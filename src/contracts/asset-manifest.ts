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
  kind: 'music' | 'sfx';
  loop: boolean;
};

/** Pack manifests use entry-relative URLs; image dimensions must divide evenly by rows and columns. */
export type AssetManifest = {
  version: 1;
  pack: AssetPack;
  images: AssetImage[];
  animations: AssetAnimation[];
  audio: AssetAudio[];
};
