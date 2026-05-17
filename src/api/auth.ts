import { apiRequest } from '@/src/api/http';
import { unwrapData } from '@/src/api/unwrap';
import { AUTH_LOGIN_PATH, AUTH_SIGNUP_PATH } from '@/src/constants/api';
import type { LoginRequest, LoginResponse, SignUpRequest } from '@/src/types/auth';
import type { ApiResponse } from '@/src/types/member';

export async function registerUser(body: SignUpRequest): Promise<string> {
  const raw = await apiRequest<string | ApiResponse<string>>(AUTH_SIGNUP_PATH, {
    method: 'POST',
    skipAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const unwrapped = unwrapData<string | { message?: string }>(raw);
  if (typeof unwrapped === 'string') return unwrapped;
  if (unwrapped && typeof unwrapped === 'object' && 'message' in unwrapped) {
    return String(unwrapped.message);
  }
  return String(unwrapped);
}

export async function loginUser(body: LoginRequest): Promise<LoginResponse> {
  const raw = await apiRequest<LoginResponse | ApiResponse<LoginResponse>>(AUTH_LOGIN_PATH, {
    method: 'POST',
    skipAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: body.email.trim(),
      password: body.password,
    }),
  });

  const data = unwrapData<LoginResponse & { access_token?: string }>(raw);
  const accessToken = data.accessToken ?? data.access_token;

  if (!accessToken) {
    throw new Error('로그인 응답에 accessToken이 없어요.');
  }

  return {
    grantType: data.grantType ?? 'Bearer',
    accessToken,
  };
}
