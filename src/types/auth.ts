export type SignUpAddress = {
  city: string;
  district: string;
  town: string;
};

/** POST /api/v1/auth */
export type SignUpRequest = {
  email: string;
  nickname: string;
  password: string;
  address: SignUpAddress;
};

/** POST /api/v1/auth/login */
export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  grantType: string;
  accessToken: string;
};
