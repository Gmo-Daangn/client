import { getAccessToken } from '@/src/api/token-storage';
import { API_BASE_URL } from '@/src/constants/api';

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

export async function parseErrorMessage(response: Response): Promise<string> {
  const fallback = `요청에 실패했어요. (${response.status})`;

  try {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };
      return data.message ?? data.error ?? fallback;
    }
    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, headers = {}, ...init } = options;

  const token = getAccessToken();
  const authHeaders: Record<string, string> =
    !skipAuth && token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...headers,
      ...authHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  return text as T;
}
