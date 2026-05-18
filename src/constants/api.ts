import { Platform } from 'react-native';

const LOCAL_PORT = 8080;

function getDefaultBaseUrl(): string {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${LOCAL_PORT}`;
  }
  return `http://localhost:${LOCAL_PORT}`;
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? getDefaultBaseUrl();

export const AUTH_SIGNUP_PATH = '/api/v1/auth';
export const AUTH_LOGIN_PATH = '/api/v1/auth/login';
export const MEMBERS_ME_PATH = '/api/v1/members';
export const POSTS_PATH = '/api/v1/posts';
export const CHAT_ROOMS_PATH = '/api/v1/chat/rooms';
export const CHAT_MESSAGES_PATH = '/api/v1/chat/messages';

function toWebSocketBaseUrl(httpBaseUrl: string): string {
  if (httpBaseUrl.startsWith('https://')) {
    return `wss://${httpBaseUrl.slice('https://'.length)}`;
  }
  if (httpBaseUrl.startsWith('http://')) {
    return `ws://${httpBaseUrl.slice('http://'.length)}`;
  }
  return `ws://${httpBaseUrl}`;
}

/** 순수 WebSocket STOMP (SockJS 아님). 끝에 `/websocket` 붙이지 않습니다. */
export const WS_STOMP_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? `${toWebSocketBaseUrl(API_BASE_URL)}/api/ws-stomp`;
