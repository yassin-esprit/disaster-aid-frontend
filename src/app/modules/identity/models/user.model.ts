export interface User {
  userId: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  profilePhoto?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  mfaEnabled?: boolean;
  status?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserRequest {
  email: string;
  password?: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  profilePhoto?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  mfaEnabled?: boolean;
  status?: string;
}