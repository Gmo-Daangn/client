/** Spring 등에서 `{ data: T }` 로 감싼 응답을 풀어줍니다. */
export function unwrapData<T>(payload: unknown): T {
  if (payload === null || payload === undefined) {
    throw new Error('서버 응답이 비어 있어요.');
  }

  if (typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data: unknown }).data;
    if (inner !== null && inner !== undefined) {
      return inner as T;
    }
  }

  return payload as T;
}
