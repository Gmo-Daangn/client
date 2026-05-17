import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { loginUser, registerUser } from '@/src/api/auth';
import { fetchMyInfo } from '@/src/api/members';
import { clearAccessToken, setAccessToken } from '@/src/api/token-storage';
import type { LoginResponse, SignUpRequest } from '@/src/types/auth';
import type { MemberInfo } from '@/src/types/member';

type AuthContextValue = {
  isLoggedIn: boolean;
  userEmail: string | null;
  userName: string | null;
  member: MemberInfo | null;
  accessToken: string | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  signup: (
    body: SignUpRequest,
  ) => Promise<{ ok: true; message: string } | { ok: false; message: string }>;
  refreshMyInfo: () => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function applyMember(
  member: MemberInfo,
  setters: {
    setAccessTokenState: (t: string | null) => void;
    setUserEmail: (e: string | null) => void;
    setUserName: (n: string | null) => void;
    setMember: (m: MemberInfo | null) => void;
  },
) {
  setters.setUserEmail(member.email);
  setters.setUserName(member.nickname);
  setters.setMember(member);
}

function applyToken(
  response: LoginResponse,
  setAccessTokenState: (t: string | null) => void,
) {
  if (!response.accessToken) {
    throw new Error('accessToken이 비어 있어요.');
  }
  setAccessToken(response.accessToken);
  setAccessTokenState(response.accessToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);

  const loadMyInfo = useCallback(async (): Promise<MemberInfo> => {
    const info = await fetchMyInfo();
    applyMember(info, {
      setAccessTokenState,
      setUserEmail,
      setUserName,
      setMember,
    });
    return info;
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      const trimmedEmail = email.trim().toLowerCase();

      try {
        const response = await loginUser({ email: trimmedEmail, password });
        applyToken(response, setAccessTokenState);

        try {
          await loadMyInfo();
        } catch (infoError) {
          console.warn('[auth] 내 정보 조회 실패:', infoError);
          setUserEmail(trimmedEmail);
          setUserName(null);
          setMember(null);
          const message =
            infoError instanceof Error ? infoError.message : '내 정보를 불러오지 못했어요.';
          return { ok: false, message };
        }

        return { ok: true };
      } catch (error) {
        clearAccessToken();
        setAccessTokenState(null);
        setUserEmail(null);
        setUserName(null);
        setMember(null);

        const message = error instanceof Error ? error.message : '로그인에 실패했어요.';
        return { ok: false, message };
      }
    },
    [loadMyInfo],
  );

  const signup = useCallback(
    async (
      body: SignUpRequest,
    ): Promise<{ ok: true; message: string } | { ok: false; message: string }> => {
      const email = body.email.trim().toLowerCase();
      const nickname = body.nickname.trim();

      const payload: SignUpRequest = {
        email,
        nickname,
        password: body.password,
        address: {
          city: body.address.city.trim(),
          district: body.address.district.trim(),
          town: body.address.town.trim(),
        },
      };

      try {
        const signupMessage = await registerUser(payload);

        const loginResponse = await loginUser({ email, password: body.password });
        applyToken(loginResponse, setAccessTokenState);

        try {
          await loadMyInfo();
        } catch {
          setUserEmail(email);
          setUserName(nickname);
          setMember({
            email,
            nickname,
            address: payload.address,
          });
        }

        return { ok: true, message: signupMessage };
      } catch (error) {
        clearAccessToken();
        setAccessTokenState(null);
        setUserEmail(null);
        setUserName(null);
        setMember(null);

        const message = error instanceof Error ? error.message : '회원가입에 실패했어요.';
        return { ok: false, message };
      }
    },
    [loadMyInfo],
  );

  const refreshMyInfo = useCallback(async (): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!accessTokenState) {
      return { ok: false, message: '로그인이 필요해요.' };
    }

    try {
      await loadMyInfo();
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : '내 정보를 불러오지 못했어요.';
      return { ok: false, message };
    }
  }, [accessTokenState, loadMyInfo]);

  const logout = useCallback(() => {
    clearAccessToken();
    setAccessTokenState(null);
    setUserEmail(null);
    setUserName(null);
    setMember(null);
  }, []);

  const value = useMemo(
    () => ({
      isLoggedIn: Boolean(accessTokenState),
      userEmail,
      userName,
      member,
      accessToken: accessTokenState,
      login,
      signup,
      refreshMyInfo,
      logout,
    }),
    [accessTokenState, userEmail, userName, member, login, signup, refreshMyInfo, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}
