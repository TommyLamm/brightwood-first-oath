import { describe, expect, it, vi } from 'vitest';
import type { CloudError, CloudSaveInput } from '../contracts/index.js';
import {
  createPlayroomCloudPort,
  type PlayroomProgressSdk,
} from './index.js';

function sdk(overrides: Partial<PlayroomProgressSdk> = {}): PlayroomProgressSdk {
  return {
    ready: vi.fn(async () => ({
      available: false,
      progressAvailable: true,
      mode: 'authenticated' as const,
      sdkVersion: '1.1.0',
      protocolVersion: 1,
      capabilities: ['progress', 'saveFormats', 'machineErrors'],
    })),
    loadProgress: vi.fn(async () => null),
    saveProgress: vi.fn(async () => null),
    ...overrides,
  };
}

describe('createPlayroomCloudPort', () => {
  it('loads the SDK once and exposes the CloudPort ready contract', async () => {
    const instance = sdk();
    const loadSdk = vi.fn(async () => instance);
    const port = createPlayroomCloudPort(loadSdk);

    await expect(port.ready()).resolves.toEqual({
      mode: 'authenticated',
      progressAvailable: true,
      capabilities: ['progress', 'saveFormats', 'machineErrors'],
    });
    await port.loadProgress();

    expect(loadSdk).toHaveBeenCalledTimes(1);
  });

  it('passes through a cloud record and successful save without changing the snapshot', async () => {
    const record = {
      data: { marker: 'loaded' },
      revision: 4,
      formatVersion: 1,
      gameVersion: '1.0.0-beta.1',
      updatedAt: '2026-10-18T00:00:00.000Z',
    };
    const saved = { ...record, data: { marker: 'saved' }, revision: 5, saved: true as const };
    const instance = sdk({
      loadProgress: vi.fn(async () => record),
      saveProgress: vi.fn(async () => saved),
    });
    const input: CloudSaveInput = {
      data: { marker: 'snapshot' } as unknown as CloudSaveInput['data'],
      revision: 4,
      formatVersion: 5,
      requestId: '018f47a0-0d75-7d5b-a3d1-62df8fb76d18',
    };
    const port = createPlayroomCloudPort(async () => instance);

    await expect(port.loadProgress()).resolves.toBe(record);
    await expect(port.saveProgress(input)).resolves.toBe(saved);
    expect(instance.saveProgress).toHaveBeenCalledWith(input);
  });

  it('keeps unavailable null distinct from an error', async () => {
    const error = Object.assign(new Error('revision conflict'), {
      code: 409,
      machineCode: 'SAVE_REVISION_CONFLICT',
    }) as CloudError;
    const port = createPlayroomCloudPort(async () => sdk({
      loadProgress: vi.fn(async () => null),
      saveProgress: vi.fn(async () => { throw error; }),
    }));
    const input = {
      data: { marker: 'snapshot' } as unknown as CloudSaveInput['data'],
      revision: 4,
      formatVersion: 5 as const,
      requestId: '018f47a0-0d75-7d5b-a3d1-62df8fb76d18',
    };

    await expect(port.loadProgress()).resolves.toBeNull();
    await expect(port.saveProgress(input)).rejects.toBe(error);
    expect(error.code).toBe(409);
    expect(error.machineCode).toBe('SAVE_REVISION_CONFLICT');
  });
});
