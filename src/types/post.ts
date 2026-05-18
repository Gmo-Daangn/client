export type PostStatus = 'FOR_SALE' | 'RESERVED' | 'SOLD';

export type PostListItem = {
  postId: number;
  title: string;
  price: number;
  location: string;
  viewCount: number;
  createdAt: string;
};

export type PostPage = {
  contents: PostListItem[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
};

export type PostDetail = {
  postId: number;
  sellerNickname: string;
  title: string;
  content: string;
  price: number;
  location: string;
  status: PostStatus;
  viewCount: number;
  createdAt: string;
};

export type CreatePostRequest = {
  title: string;
  content: string;
  price: number;
  memberId: number;
};

export type CreatePostResponse = {
  postId: number;
  message: string;
};

export type UpdatePostRequest = {
  title: string;
  content: string;
  price: number;
  status: PostStatus;
  memberId: number;
};

export type GetPostsParams = {
  page?: number;
  size?: number;
  sort?: string;
};
