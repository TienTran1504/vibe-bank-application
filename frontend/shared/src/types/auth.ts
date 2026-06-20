export interface ApiResponse<T> {
  data: T;
  message: string;
  timestamp: string;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: ApiErrorDetail[];
  timestamp: string;
  traceId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phone: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  requiresMfa: boolean;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface MfaVerifyRequest {
  otp: string;
}
