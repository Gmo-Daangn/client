import type { PostDetail, PostStatus } from '@/src/types/post';
import { coerceMemberId } from '@/src/utils/parse-member-id';

function normalizeStatus(value: unknown): PostStatus {
  if (value === 'FOR_SALE' || value === 'RESERVED' || value === 'SOLD') return value;
  return 'FOR_SALE';
}

function sellerIdFromNested(data: Record<string, unknown>): number | undefined {
  const seller = data.seller ?? data.author ?? data.member ?? data.writer;
  if (seller && typeof seller === 'object' && !Array.isArray(seller)) {
    const record = seller as Record<string, unknown>;
    return (
      coerceMemberId(record.memberId) ??
      coerceMemberId(record.id) ??
      coerceMemberId(record.sellerId)
    );
  }
  return undefined;
}

export function normalizePostDetail(raw: unknown): PostDetail {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const sellerMemberId =
    coerceMemberId(data.memberId) ??
    coerceMemberId(data.sellerMemberId) ??
    coerceMemberId(data.sellerId) ??
    coerceMemberId(data.sellerMember_id) ??
    coerceMemberId(data.authorId) ??
    coerceMemberId(data.writerId) ??
    sellerIdFromNested(data);

  return {
    postId: Number(data.postId ?? data.id ?? 0),
    sellerMemberId,
    sellerNickname: String(data.sellerNickname ?? data.sellerNickName ?? ''),
    title: String(data.title ?? ''),
    content: String(data.content ?? data.description ?? ''),
    price: Number(data.price ?? 0),
    location: String(data.location ?? ''),
    status: normalizeStatus(data.status),
    viewCount: Number(data.viewCount ?? 0),
    createdAt: String(data.createdAt ?? ''),
  };
}
