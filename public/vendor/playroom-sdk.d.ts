export type ProgressSave = {
    data: Record<string, unknown>;
    revision: number;
    formatVersion: number;
    gameVersion: string;
    updatedAt: string;
};
export type ReadyState = {
    available: boolean;
    progressAvailable: boolean;
    mode: 'authenticated' | 'guest' | 'preview' | 'standalone';
    sdkVersion: string;
    protocolVersion: number;
    capabilities: string[];
};
export type PlayroomError = Error & {
    code?: number;
    machineCode?: string;
    details?: Record<string, string | number | boolean | null>;
};
export declare const Playroom: {
    ready: () => Promise<ReadyState>;
    /** null means unavailable or no save. SAVE_FORMAT_INCOMPATIBLE rejects unsupported formats; never initialize empty progress after a rejected read. */
    loadProgress: () => Promise<ProgressSave | null>;
    /** Use the Manifest writeFormat and validate/migrate data. Reuse requestId only for identical retries; only saved:true proves persistence. */
    saveProgress: ({ data, revision, formatVersion, requestId }: {
        data: Record<string, unknown>;
        revision: number;
        formatVersion: number;
        requestId?: string;
    }) => Promise<({
        saved: true;
    } & ProgressSave) | null>;
    /** Diagnostic previews return temporary run IDs; no account run is created. */
    startRun: () => Promise<{
        runId: string;
    } | null>;
    finishRun: ({ runId, score }: {
        runId: string;
        score: number;
    }) => Promise<{
        saved: true;
        runId: string;
        score: number;
        finishedAt: string;
    } | null>;
};
