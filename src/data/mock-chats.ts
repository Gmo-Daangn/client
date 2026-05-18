import type { ChatRoom } from '@/src/types/chat';

const now = Date.now();
const minutes = (m: number) => now - m * 60 * 1000;
const hours = (h: number) => now - h * 60 * 60 * 1000;

/** 개발·프리뷰용 mock (런타임에서는 ChatContext가 API를 사용합니다). */
export const INITIAL_CHATS: ChatRoom[] = [
  {
    id: '1',
    roomId: 1,
    productId: '1',
    productTitle: '아이폰 15 Pro 256GB 자연 티타늄 풀박스',
    productPrice: 1100000,
    productImageUrl: 'https://picsum.photos/seed/iphone15/800',
    otherMemberId: 2,
    otherUserName: '당근이',
    otherUserProfileImage: 'https://i.pravatar.cc/150?img=12',
    otherUserLocation: '역삼동',
    unreadCount: 0,
    updatedAt: minutes(3),
    messages: [
      {
        id: '1',
        messageId: 1,
        text: '안녕하세요, 아이폰 아직 판매 중인가요?',
        sender: 'me',
        createdAt: minutes(10),
      },
      {
        id: '2',
        messageId: 2,
        text: '네 가능합니다!',
        sender: 'other',
        createdAt: minutes(8),
      },
      {
        id: '3',
        messageId: 3,
        text: '역삼역 근처에서 오늘 저녁에 거래 가능하실까요?',
        sender: 'me',
        createdAt: minutes(3),
      },
    ],
  },
];
