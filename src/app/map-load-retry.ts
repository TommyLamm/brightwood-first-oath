/** Prevents per-frame retries after a visual map load fails; explicit retries bypass the failed-map guard. */
export function shouldAttemptMapVisualLoad(
  mapId: string,
  activeMapId: string | null,
  failedMapIds: ReadonlySet<string>,
  explicitRetry: boolean,
): boolean {
  return explicitRetry || (activeMapId !== mapId && !failedMapIds.has(mapId));
}
