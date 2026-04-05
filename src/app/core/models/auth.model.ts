export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
  role: string;
  message: string;
}