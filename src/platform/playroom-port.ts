import type {
  CloudPort,
  CloudReady,
  CloudRecord,
  CloudSaveInput,
  CloudSaved,
} from '../contracts/index.js';

type PlayroomModule = typeof import('../../public/vendor/playroom-sdk.js');

export type PlayroomProgressSdk = Pick<
  PlayroomModule['Playroom'],
  'ready' | 'loadProgress' | 'saveProgress'
>;

export type PlayroomProgressSdkLoader = () => Promise<PlayroomProgressSdk>;

/**
 * A top-level page has no Playroom host to answer the SDK handshake, so the SDK
 * would only resolve `ready()` after its 8 s fallback timer. Answer as standalone
 * immediately instead; the game then uses local saves exactly as before.
 */
const standalonePlayroomSdk: PlayroomProgressSdk = {
  ready: async () => ({
    available: false,
    progressAvailable: false,
    mode: 'standalone',
    sdkVersion: 'standalone',
    protocolVersion: 1,
    capabilities: [],
  }),
  loadProgress: async () => null,
  saveProgress: async () => null,
};

async function loadBundledPlayroomSdk(): Promise<PlayroomProgressSdk> {
  if (window.parent === window) return standalonePlayroomSdk;
  const sdkUrl = new URL('./vendor/playroom-sdk.js', document.baseURI).href;
  const sdkModule = await import(/* @vite-ignore */ sdkUrl) as PlayroomModule;
  return sdkModule.Playroom;
}

export function createPlayroomCloudPort(
  loadSdk: PlayroomProgressSdkLoader = loadBundledPlayroomSdk,
): CloudPort {
  let sdkPromise: Promise<PlayroomProgressSdk> | null = null;
  const sdk = (): Promise<PlayroomProgressSdk> => {
    sdkPromise ??= loadSdk();
    return sdkPromise;
  };

  return {
    async ready(): Promise<CloudReady> {
      const state = await (await sdk()).ready();
      return {
        mode: state.mode,
        progressAvailable: state.progressAvailable,
        capabilities: state.capabilities,
      };
    },

    async loadProgress(): Promise<CloudRecord | null> {
      return (await sdk()).loadProgress();
    },

    async saveProgress(input: CloudSaveInput): Promise<CloudSaved | null> {
      return (await sdk()).saveProgress(input);
    },
  };
}

export const playroomCloudPort: CloudPort = createPlayroomCloudPort();
