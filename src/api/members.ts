import { apiRequest } from '@/src/api/http';
import { getAccessToken } from '@/src/api/token-storage';
import { unwrapData } from '@/src/api/unwrap';
import { MEMBERS_ME_PATH } from '@/src/constants/api';
import type { SignUpAddress } from '@/src/types/auth';
import type { ApiResponse, MemberInfo } from '@/src/types/member';
import { extractMemberIdFromRecord, parseMemberIdFromJwt } from '@/src/utils/parse-member-id';

function normalizeAddress(raw: unknown): SignUpAddress {
  const addr =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  return {
    city: String(addr.city ?? addr.cityName ?? ''),
    district: String(addr.district ?? addr.districtName ?? addr.gu ?? ''),
    town: String(addr.town ?? addr.townName ?? addr.dong ?? ''),
  };
}

function normalizeMemberInfo(raw: unknown): MemberInfo {
  const data =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const email = String(data.email ?? '');
  const nickname = String(data.nickname ?? data.nickName ?? data.name ?? '');

  const memberId =
    extractMemberIdFromRecord(data) ?? parseMemberIdFromJwt(getAccessToken());

  const addressSource = data.address ?? data.memberAddress ?? data.userAddress;
  const address = normalizeAddress(addressSource);

  if (!email) {
    throw new Error('회원 정보에 이메일이 없어요.');
  }

  return { memberId, email, nickname, address };
}

/** GET /api/v1/members — Authorization: Bearer {accessToken} */
export async function fetchMyInfo(): Promise<MemberInfo> {
  const raw = await apiRequest<ApiResponse<unknown> | unknown>(MEMBERS_ME_PATH, {
    method: 'GET',
  });

  const unwrapped = unwrapData<unknown>(raw);
  return normalizeMemberInfo(unwrapped);
}
