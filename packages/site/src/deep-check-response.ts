export function isCompletedDeepCheckResponse(data: Record<string, unknown>): boolean {
  return data.deepCheckCompleted === true || data.deepCheckCached === true;
}