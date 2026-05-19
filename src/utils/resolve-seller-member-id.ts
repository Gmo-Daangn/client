import { fetchChatRooms } from '@/src/api/chat';
import type { ChatRoomListItem } from '@/src/types/chat-api';
import type { ChatRoom } from '@/src/types/chat';

function matchNickname(roomNickname: string, sellerNickname: string) {
  return roomNickname.trim() === sellerNickname.trim();
}

function pickFromApiRooms(
  rooms: ChatRoomListItem[],
  sellerNickname: string,
  productId: string,
): number | undefined {
  const onProduct = rooms.find(
    (r) => String(r.productId) === productId && matchNickname(r.otherMemberNickname, sellerNickname),
  );
  if (onProduct) return onProduct.otherMemberId;

  const anyRoom = rooms.find((r) => matchNickname(r.otherMemberNickname, sellerNickname));
  return anyRoom?.otherMemberId;
}

function pickFromLocalRooms(
  rooms: ChatRoom[],
  sellerNickname: string,
  productId: string,
): number | undefined {
  const onProduct = rooms.find(
    (r) => r.productId === productId && matchNickname(r.otherUserName, sellerNickname),
  );
  if (onProduct) return onProduct.otherMemberId;

  const anyRoom = rooms.find((r) => matchNickname(r.otherUserName, sellerNickname));
  return anyRoom?.otherMemberId;
}

export async function resolveSellerMemberId(input: {
  myMemberId: number;
  sellerNickname: string;
  productId: string;
  sellerMemberIdFromPost?: number;
  localRooms?: ChatRoom[];
}): Promise<number | undefined> {
  if (input.sellerMemberIdFromPost) return input.sellerMemberIdFromPost;

  const fromLocal = input.localRooms
    ? pickFromLocalRooms(input.localRooms, input.sellerNickname, input.productId)
    : undefined;
  if (fromLocal) return fromLocal;

  const apiRooms = await fetchChatRooms(input.myMemberId);
  return pickFromApiRooms(apiRooms, input.sellerNickname, input.productId);
}
