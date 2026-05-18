import { apiRequest } from '@/src/api/http';
import { unwrapData } from '@/src/api/unwrap';
import { POSTS_PATH } from '@/src/constants/api';
import type { ApiResponse } from '@/src/types/member';
import { normalizePostDetail } from '@/src/utils/normalize-post-detail';
import type {
  CreatePostRequest,
  CreatePostResponse,
  GetPostsParams,
  PostDetail,
  PostPage,
  UpdatePostRequest,
} from '@/src/types/post';

function buildPostsQuery(params?: GetPostsParams): string {
  if (!params) return '';

  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.size !== undefined) search.set('size', String(params.size));
  if (params.sort) search.set('sort', params.sort);

  const query = search.toString();
  return query ? `?${query}` : '';
}

/** POST /api/v1/posts */
export async function createPost(body: CreatePostRequest): Promise<CreatePostResponse> {
  const raw = await apiRequest<ApiResponse<CreatePostResponse> | CreatePostResponse>(POSTS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return unwrapData<CreatePostResponse>(raw);
}

/** GET /api/v1/posts */
export async function fetchPosts(params?: GetPostsParams): Promise<PostPage> {
  const raw = await apiRequest<ApiResponse<PostPage> | PostPage>(
    `${POSTS_PATH}${buildPostsQuery(params)}`,
    { method: 'GET' },
  );

  const page = unwrapData<PostPage>(raw);
  return {
    ...page,
    contents: page.contents ?? [],
  };
}

/** GET /api/v1/posts/{postId} */
export async function fetchPostDetail(postId: number): Promise<PostDetail> {
  const raw = await apiRequest<ApiResponse<PostDetail> | PostDetail>(`${POSTS_PATH}/${postId}`, {
    method: 'GET',
  });

  return normalizePostDetail(unwrapData<unknown>(raw));
}

/** PUT /api/v1/posts/{postId} */
export async function updatePost(postId: number, body: UpdatePostRequest): Promise<PostDetail> {
  const raw = await apiRequest<ApiResponse<PostDetail> | PostDetail>(`${POSTS_PATH}/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return normalizePostDetail(unwrapData<unknown>(raw));
}

/** DELETE /api/v1/posts/{postId}?memberId={memberId} */
export async function deletePost(postId: number, memberId: number): Promise<string> {
  const raw = await apiRequest<ApiResponse<string> | string>(
    `${POSTS_PATH}/${postId}?memberId=${memberId}`,
    { method: 'DELETE' },
  );

  return unwrapData<string>(raw);
}
