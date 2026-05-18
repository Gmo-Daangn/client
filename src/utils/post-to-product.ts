import type { PostDetail, PostListItem } from '@/src/types/post';
import type { Product } from '@/src/types/product';
import { formatPostCreatedAt } from '@/src/utils/format-post-time';

const PLACEHOLDER_IMAGE = 'https://picsum.photos/seed/danggn-post/800';

function postImageUrl(postId: number) {
  return `https://picsum.photos/seed/post-${postId}/800`;
}

export function postListItemToProduct(item: PostListItem): Product {
  return {
    id: String(item.postId),
    title: item.title,
    price: item.price,
    location: item.location,
    createdAt: formatPostCreatedAt(item.createdAt),
    imageUrl: postImageUrl(item.postId),
    likeCount: 0,
    chatCount: 0,
    viewCount: item.viewCount,
    category: '',
    description: '',
    seller: {
      name: '',
      profileImageUrl: PLACEHOLDER_IMAGE,
      mannerTemperature: 36.5,
    },
  };
}

export function postDetailToProduct(detail: PostDetail): Product {
  return {
    id: String(detail.postId),
    title: detail.title,
    price: detail.price,
    location: detail.location,
    createdAt: formatPostCreatedAt(detail.createdAt),
    imageUrl: postImageUrl(detail.postId),
    likeCount: 0,
    chatCount: 0,
    viewCount: detail.viewCount,
    category: statusLabel(detail.status),
    description: detail.content,
    seller: {
      name: detail.sellerNickname,
      profileImageUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(detail.sellerNickname)}`,
      mannerTemperature: 36.5,
    },
  };
}

function statusLabel(status: PostDetail['status']): string {
  switch (status) {
    case 'FOR_SALE':
      return '판매중';
    case 'RESERVED':
      return '예약중';
    case 'SOLD':
      return '판매완료';
    default:
      return '';
  }
}
