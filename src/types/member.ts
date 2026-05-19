import type { SignUpAddress } from '@/src/types/auth';

export type MemberInfo = {
  // jwt 확보 및 게시물 작성, 수정에 필요
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
