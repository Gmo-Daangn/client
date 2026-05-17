import type { ChatRoom } from '@/src/types/chat';

const now = Date.now();
const minutes = (m: number) => now - m * 60 * 1000;
const hours = (h: number) => now - h * 60 * 60 * 1000;

export const INITIAL_CHATS: ChatRoom[] = [
  {
    id: 'chat-1',
    productId: '1',
    productTitle: '아이폰 15 Pro 256GB 자연 티타늄 풀박스',
    productPrice: 1100000,
    productImageUrl: 'https://picsum.photos/seed/iphone15/800',
    otherUserName: '당근이',
    otherUserProfileImage: 'https://i.pravatar.cc/150?img=12',
    otherUserLocation: '역삼동',
    unreadCount: 0,
    updatedAt: minutes(3),
    messages: [
      {
        id: 'm1',
        text: '안녕하세요, 아이폰 아직 판매 중인가요?',
        sender: 'me',
        createdAt: minutes(10),
      },
      {
        id: 'm2',
        text: '네 가능합니다!',
        sender: 'other',
        createdAt: minutes(8),
      },
      {
        id: 'm3',
        text: '역삼역 근처에서 오늘 저녁에 거래 가능하실까요?',
        sender: 'me',
        createdAt: minutes(3),
      },
    ],
  },
  {
    id: 'chat-2',
    productId: '2',
    productTitle: '에어팟 프로 2세대 거의 새 거예요',
    productPrice: 220000,
    productImageUrl: 'https://picsum.photos/seed/airpods/800',
    otherUserName: '논현주민',
    otherUserProfileImage: 'https://i.pravatar.cc/150?img=15',
    otherUserLocation: '논현동',
    unreadCount: 2,
    updatedAt: hours(1),
    messages: [
      {
        id: 'm4',
        text: '안녕하세요!',
        sender: 'me',
        createdAt: hours(2),
      },
      {
        id: 'm5',
        text: '혹시 가격 조금만 깎아주실 수 있을까요?',
        sender: 'me',
        createdAt: hours(2),
      },
      {
        id: 'm6',
        text: '음... 얼마 정도 생각하세요?',
        sender: 'other',
        createdAt: hours(1),
      },
      {
        id: 'm7',
        text: '20만원에 가능할까요?',
        sender: 'other',
        createdAt: hours(1),
      },
    ],
  },
];
