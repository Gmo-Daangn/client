import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';

import { WS_STOMP_URL } from '@/src/constants/api';
import type { ChatMessageDto } from '@/src/types/chat-api';

export type ChatRoomEventHandlers = {
  onMessage: (payload: ChatMessageDto) => void;
  onReadStatus?: (payload: unknown) => void;
};

export type StompConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

type RoomSubscription = {
  messageSub?: StompSubscription;
  readSub?: StompSubscription;
};

type ConnectWaiter = {
  resolve: () => void;
  reject: (error: Error) => void;
};

/** STOMP 발행/구독 경로 — 백엔드 스펙과 동일 */
export const STOMP_DESTINATIONS = {
  publishMessage: (roomId: number) => `/pub/chat/rooms/${roomId}/messages`,
  subscribeMessages: (roomId: number) => `/sub/chat/rooms/${roomId}/messages`,
  subscribeReadStatus: (roomId: number) => `/sub/chat/rooms/${roomId}/read-status`,
} as const;

function buildWebSocketUrl(accessToken: string) {
  const separator = WS_STOMP_URL.includes('?') ? '&' : '?';
  return `${WS_STOMP_URL}${separator}access_token=${encodeURIComponent(accessToken)}`;
}

function parseJsonBody<T>(message: IMessage): T | null {
  try {
    return JSON.parse(message.body) as T;
  } catch {
    return null;
  }
}

class ChatStompClient {
  private client: Client | null = null;
  private token: string | null = null;
  private status: StompConnectionStatus = 'disconnected';
  private roomSubscriptions = new Map<number, RoomSubscription>();
  private roomHandlers = new Map<number, ChatRoomEventHandlers>();
  private connectWaiters: ConnectWaiter[] = [];
  private statusListeners = new Set<(status: StompConnectionStatus) => void>();

  private setStatus(status: StompConnectionStatus) {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  subscribeStatus(listener: (status: StompConnectionStatus) => void) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  getStatus() {
    return this.status;
  }

  connect(accessToken: string) {
    if (this.client?.active && this.token === accessToken) {
      return;
    }

    this.disconnect();
    this.token = accessToken;
    this.setStatus('connecting');

    const brokerURL = buildWebSocketUrl(accessToken);

    if (__DEV__) {
      console.log('[stomp] connecting to', brokerURL.replace(/access_token=[^&]+/, 'access_token=***'));
    }

    const client = new Client({
      // SockJS 없이 RN 내장 WebSocket + brokerURL (스펙: ws://호스트/api/ws-stomp)
      brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (msg) => {
        if (__DEV__) {
          console.log('[STOMP]', msg);
        }
      },
      onConnect: () => {
        if (__DEV__) console.log('[stomp] connected');
        this.setStatus('connected');
        this.flushConnectWaiters();
        for (const roomId of this.roomHandlers.keys()) {
          this.subscribeRoom(roomId);
        }
      },
      onDisconnect: () => {
        if (this.client?.active) {
          this.setStatus('connecting');
        } else {
          this.setStatus('disconnected');
        }
      },
      onStompError: (frame) => {
        const message = frame.headers.message ?? frame.body ?? 'STOMP 오류';
        console.warn('[stomp] stomp error:', message);
        this.setStatus('error');
        this.rejectConnectWaiters(new Error(String(message)));
      },
      onWebSocketError: (event) => {
        console.warn('[stomp] websocket error:', WS_STOMP_URL, event);
        this.setStatus('error');
        this.rejectConnectWaiters(
          new Error(`WebSocket 연결 실패 (${WS_STOMP_URL})`),
        );
      },
      onWebSocketClose: (event) => {
        if (__DEV__) {
          console.warn('[stomp] websocket closed', event.code, event.reason);
        }
        if (!this.client?.connected) {
          this.setStatus(this.client?.active ? 'connecting' : 'disconnected');
        }
      },
    });

    this.client = client;
    client.activate();
  }

  disconnect() {
    this.rejectConnectWaiters(new Error('채팅 연결이 종료됐어요.'));
    this.roomSubscriptions.forEach((subs, roomId) => {
      subs.messageSub?.unsubscribe();
      subs.readSub?.unsubscribe();
      this.roomSubscriptions.delete(roomId);
    });
    this.roomHandlers.clear();

    if (this.client) {
      void this.client.deactivate();
      this.client = null;
    }
    this.token = null;
    this.setStatus('disconnected');
  }

  isConnected() {
    return Boolean(this.client?.connected);
  }

  private flushConnectWaiters() {
    const waiters = this.connectWaiters.splice(0);
    waiters.forEach((waiter) => waiter.resolve());
  }

  private rejectConnectWaiters(error: Error) {
    const waiters = this.connectWaiters.splice(0);
    waiters.forEach((waiter) => waiter.reject(error));
  }

  waitForConnection(timeoutMs = 15_000): Promise<void> {
    if (this.client?.connected) return Promise.resolve();

    if (!this.client?.active || !this.token) {
      return Promise.reject(
        new Error('채팅 서버에 연결되어 있지 않아요. 로그인 상태를 확인해 주세요.'),
      );
    }

    return new Promise((resolve, reject) => {
      const waiter: ConnectWaiter = {
        resolve: () => {
          clearTimeout(timer);
          resolve();
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      };

      const timer = setTimeout(() => {
        const index = this.connectWaiters.indexOf(waiter);
        if (index >= 0) this.connectWaiters.splice(index, 1);
        reject(new Error(`채팅 서버 연결 시간이 초과됐어요.\n${WS_STOMP_URL}`));
      }, timeoutMs);

      this.connectWaiters.push(waiter);
    });
  }

  registerRoom(roomId: number, handlers: ChatRoomEventHandlers) {
    this.roomHandlers.set(roomId, handlers);
    if (this.client?.connected) {
      this.subscribeRoom(roomId);
    }
  }

  unregisterRoom(roomId: number) {
    this.roomHandlers.delete(roomId);
    const subs = this.roomSubscriptions.get(roomId);
    subs?.messageSub?.unsubscribe();
    subs?.readSub?.unsubscribe();
    this.roomSubscriptions.delete(roomId);
  }

  async publishMessage(roomId: number, memberId: number, message: string) {
    if (!this.token) {
      throw new Error('채팅 서버에 연결되어 있지 않아요.');
    }

    if (!this.client?.active) {
      this.connect(this.token);
    }

    await this.waitForConnection();

    this.client!.publish({
      destination: STOMP_DESTINATIONS.publishMessage(roomId),
      body: JSON.stringify({ memberId, message }),
    });
  }

  private subscribeRoom(roomId: number) {
    if (!this.client?.connected) return;

    const existing = this.roomSubscriptions.get(roomId);
    existing?.messageSub?.unsubscribe();
    existing?.readSub?.unsubscribe();

    const handlers = this.roomHandlers.get(roomId);
    if (!handlers) return;

    const messageSub = this.client.subscribe(STOMP_DESTINATIONS.subscribeMessages(roomId), (frame) => {
      const payload = parseJsonBody<ChatMessageDto>(frame);
      if (payload) handlers.onMessage(payload);
    });

    const readSub = this.client.subscribe(STOMP_DESTINATIONS.subscribeReadStatus(roomId), (frame) => {
      const payload = parseJsonBody<unknown>(frame);
      if (payload) handlers.onReadStatus?.(payload);
    });

    this.roomSubscriptions.set(roomId, { messageSub, readSub });
  }
}

export const chatStompClient = new ChatStompClient();
