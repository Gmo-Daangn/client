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
