import type { SignUpAddress } from '@/src/types/auth';

export type MemberInfo = {
  email: string;
  nickname: string;
  address: SignUpAddress;
};

/** 백엔드 공통 응답 (data 필드) */
export type ApiResponse<T> = {
  data: T;
  message?: string;
  success?: boolean;
};
