import { apiRequest } from '@/src/api/http';
import { unwrapData } from '@/src/api/unwrap';
import { CHAT_MESSAGES_PATH, CHAT_ROOMS_PATH } from '@/src/constants/api';
import type { ApiResponse } from '@/src/types/member';
import type {
  ChatMessageDto,
  ChatRoomListItem,
  DeleteChatMessageRequest,
  EnterChatRoomRequest,
  EnterChatRoomResponse,
  ReadChatRoomRequest,
  ReadChatRoomResponse,
  UpdateChatMessageRequest,
} from '@/src/types/chat-api';

function unwrapList<T>(payload: unknown): T[] {
  const data = unwrapData<unknown>(payload);
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['contents', 'items', 'list', 'data']) {
      const nested = record[key];
      if (Array.isArray(nested)) return nested as T[];
    }
  }
  return [];
}

/** POST /api/v1/chat/rooms/enter */
export async function enterChatRoom(body: EnterChatRoomRequest): Promise<EnterChatRoomResponse> {
  const raw = await apiRequest<ApiResponse<EnterChatRoomResponse> | EnterChatRoomResponse>(
    `${CHAT_ROOMS_PATH}/enter`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  return unwrapData<EnterChatRoomResponse>(raw);
}

/** GET /api/v1/chat/rooms?memberId={memberId} */
export async function fetchChatRooms(memberId: number): Promise<ChatRoomListItem[]> {
  const raw = await apiRequest<ApiResponse<ChatRoomListItem[]> | ChatRoomListItem[]>(
    `${CHAT_ROOMS_PATH}?memberId=${memberId}`,
    { method: 'GET' },
  );

  return unwrapList<ChatRoomListItem>(raw);
}

/** POST /api/v1/chat/rooms/read/{roomId} */
export async function markChatRoomAsRead(
  roomId: number,
  body: ReadChatRoomRequest,
): Promise<ReadChatRoomResponse> {
  const raw = await apiRequest<ApiResponse<ReadChatRoomResponse> | ReadChatRoomResponse>(
    `${CHAT_ROOMS_PATH}/read/${roomId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  return unwrapData<ReadChatRoomResponse>(raw);
}

/** GET /api/v1/chat/messages/{roomId}?memberId={memberId} */
export async function fetchChatMessages(
  roomId: number,
  memberId: number,
): Promise<ChatMessageDto[]> {
  const raw = await apiRequest<ApiResponse<ChatMessageDto[]> | ChatMessageDto[]>(
    `${CHAT_MESSAGES_PATH}/${roomId}?memberId=${memberId}`,
    { method: 'GET' },
  );

  return unwrapList<ChatMessageDto>(raw);
}

/** PATCH /api/v1/chat/messages/{messageId} */
export async function updateChatMessage(
  messageId: number,
  body: UpdateChatMessageRequest,
): Promise<ChatMessageDto> {
  const raw = await apiRequest<ApiResponse<ChatMessageDto> | ChatMessageDto>(
    `${CHAT_MESSAGES_PATH}/${messageId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  return unwrapData<ChatMessageDto>(raw);
}

/** DELETE /api/v1/chat/messages/{messageId} */
export async function deleteChatMessage(
  messageId: number,
  body: DeleteChatMessageRequest,
): Promise<ChatMessageDto> {
  const raw = await apiRequest<ApiResponse<ChatMessageDto> | ChatMessageDto>(
    `${CHAT_MESSAGES_PATH}/${messageId}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  return unwrapData<ChatMessageDto>(raw);
}
