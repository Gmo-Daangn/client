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

/** 게시글 상세 API 응답을 앱 모델로 정규화합니다. */
export function normalizePostDetail(raw: unknown): PostDetail {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  // 이 백엔드는 게시글 작성자 ID를 `memberId`로 내려줍니다.
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
