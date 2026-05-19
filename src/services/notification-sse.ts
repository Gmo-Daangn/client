import { API_BASE_URL } from '@/src/constants/api';
import { buildNotificationSseUrl } from '@/src/api/notifications';
import type { NotificationItem } from '@/src/types/notification';
import { normalizeNotificationPayload } from '@/src/utils/normalize-notification';

type NotificationHandler = (item: NotificationItem) => void;

function isDummyPayload(data: string) {
  const trimmed = data.trim();
  if (!trimmed) return true;
  if (trimmed === 'connected' || trimmed === 'Connection established') return true;
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (parsed.dummy === true || parsed.type === 'connected') return true;
    if (typeof parsed.message === 'string' && parsed.message.includes('연결')) return true;
  } catch {
    // not json
  }
  return false;
}

function parseEventBlock(block: string): NotificationItem | null {
  const dataLines = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart());

  if (!dataLines.length) return null;

  const payload = dataLines.join('\n');
  if (isDummyPayload(payload)) return null;

  try {
    return normalizeNotificationPayload(JSON.parse(payload));
  } catch {
    if (__DEV__) console.warn('[sse] JSON parse failed:', payload.slice(0, 200));
    return null;
  }
}

function extractEvents(buffer: string): { events: string[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const parts = normalized.split('\n\n');
  const rest = parts.pop() ?? '';
  return { events: parts, rest };
}

const MAX_RECONNECT_DELAY_MS = 30_000;

/**
 * React Native(Expo Go) 호환 SSE — XMLHttpRequest 스트리밍
 */
export class NotificationSseClient {
  private xhr: XMLHttpRequest | null = null;
  private buffer = '';
  private lastIndex = 0;
  private memberId: number | null = null;
  private accessToken: string | null = null;
  private onNotification: NotificationHandler | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private intentionalDisconnect = false;

  connect(memberId: number, accessToken: string, onNotification: NotificationHandler) {
    this.intentionalDisconnect = false;
    this.memberId = memberId;
    this.accessToken = accessToken;
    this.onNotification = onNotification;
    this.clearReconnectTimer();
    this.openStream();
  }

  disconnect() {
    this.intentionalDisconnect = true;
    this.memberId = null;
    this.accessToken = null;
    this.onNotification = null;
    this.reconnectAttempt = 0;
    this.clearReconnectTimer();
    this.abortXhr();
  }

  isActive() {
    return this.xhr != null;
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(reason: string) {
    if (this.intentionalDisconnect || !this.memberId || !this.accessToken || !this.onNotification) {
      return;
    }

    this.clearReconnectTimer();
    const delay = Math.min(MAX_RECONNECT_DELAY_MS, 1000 * 2 ** this.reconnectAttempt);
    this.reconnectAttempt += 1;

    if (__DEV__) {
      console.log(`[sse] reconnect in ${delay}ms (${reason})`);
    }

    this.reconnectTimer = setTimeout(() => {
      this.openStream();
    }, delay);
  }

  private openStream() {
    this.abortXhr();

    const memberId = this.memberId;
    const accessToken = this.accessToken;
    const onNotification = this.onNotification;
    if (!memberId || !accessToken || !onNotification) return;

    const path = buildNotificationSseUrl(memberId, accessToken);
    const url = `${API_BASE_URL}${path}`;

    const xhr = new XMLHttpRequest();
    this.xhr = xhr;
    this.buffer = '';
    this.lastIndex = 0;

    xhr.open('GET', url);
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Cache-Control', 'no-cache');

    xhr.onprogress = () => {
      const chunk = xhr.responseText.substring(this.lastIndex);
      this.lastIndex = xhr.responseText.length;
      if (!chunk) return;

      this.buffer += chunk;
      const parsed = extractEvents(this.buffer);
      this.buffer = parsed.rest;

      for (const block of parsed.events) {
        const item = parseEventBlock(block);
        if (!item) continue;

        this.reconnectAttempt = 0;
        if (__DEV__) console.log('[sse] notification', item.id, item.templateType);
        onNotification(item);
      }
    };

    xhr.onload = () => {
      if (__DEV__) console.log('[sse] connection closed');
      this.scheduleReconnect('closed');
    };

    xhr.onerror = () => {
      if (__DEV__) console.warn('[sse] connection error');
      this.scheduleReconnect('error');
    };

    xhr.send();

    if (__DEV__) {
      console.log('[sse] connecting', url.replace(/access_token=[^&]+/, 'access_token=***'));
    }
  }

  private abortXhr() {
    if (this.xhr) {
      try {
        this.xhr.abort();
      } catch {
        // ignore
      }
      this.xhr = null;
    }
    this.buffer = '';
    this.lastIndex = 0;
  }
}

export const notificationSseClient = new NotificationSseClient();
