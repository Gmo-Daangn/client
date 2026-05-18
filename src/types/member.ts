import type { SignUpAddress } from '@/src/types/auth';

export type MemberInfo = {
  /** API 또는 JWT에서 확보. 게시글 작성·수정 시 필요합니다. */
  memberId?: number;
  email: string;
  nickname: string;
  address: SignUpAddress;
};

export type ApiResponse<T> = {
  data: T;
  message?: string;
  success?: boolean;
};
