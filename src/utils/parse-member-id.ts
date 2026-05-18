export function coerceMemberId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

export function extractMemberIdFromRecord(data: Record<string, unknown>): number | undefined {
  const direct = coerceMemberId(
    data.memberId ??
      data.member_id ??
      data.id ??
      data.userId ??
      data.user_id ??
      data.idx,
  );
  if (direct !== undefined) return direct;

  for (const key of ['member', 'user', 'memberInfo', 'memberDto', 'data']) {
    const nested = data[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const fromNested = extractMemberIdFromRecord(nested as Record<string, unknown>);
      if (fromNested !== undefined) return fromNested;
    }
  }

  return undefined;
}

function decodeBase64Url(segment: string): string | null {
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(padded);
    }
    return null;
  } catch {
    return null;
  }
}

/** JWT payload에서 memberId 후보를 추출합니다. */
export function parseMemberIdFromJwt(token: string | null | undefined): number | undefined {
  if (!token) return undefined;

  const parts = token.split('.');
  if (parts.length < 2) return undefined;

  const jsonStr = decodeBase64Url(parts[1]);
  if (!jsonStr) return undefined;

  try {
    const payload = JSON.parse(jsonStr) as Record<string, unknown>;
    return (
      extractMemberIdFromRecord(payload) ??
      coerceMemberId(payload.sub) ??
      coerceMemberId(payload.user_id)
    );
  } catch {
    return undefined;
  }
}
