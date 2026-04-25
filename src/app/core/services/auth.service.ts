// core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http'; // Remove this if not needed
import { HttpService } from './http.service';

export interface AuthResponse {
  token: string;
  tokenType?: string;
  userId?: number;
  id?: number;
  email: string;
  role: string;
  message?: string;
}

export interface LogoutResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  phoneNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Make sure you're ONLY using HttpService, NOT HttpClient directly
  constructor(private httpService: HttpService) {
    console.log('AuthService initialized with HttpService');
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    const registrationData = {
      ...data,
      role: data.role || 'CITIZEN'
    };

    console.log('📝 Registering user:', registrationData.email);
    console.log('📍 Register endpoint: /auth/register');

    return this.httpService.post<AuthResponse>('/auth/register', registrationData).pipe(
      tap(res => {
        console.log('✅ Registration API response:', res);
        this.storeAuthData(res);
      }),
      catchError(error => {
        console.error('❌ Registration API error:', error);
        return throwError(() => error);
      })
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    console.log('🔐 Logging in user:', data.email);
    console.log('📍 Login endpoint: /auth/login');

    return this.httpService.post<AuthResponse>('/auth/login', data).pipe(
      tap(res => {
        console.log('✅ Login API response:', res);
        this.storeAuthData(res);
      }),
      catchError(error => {
        console.error('❌ Login API error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<LogoutResponse> {
    console.log('🚪 Logging out');
    return this.httpService.post<LogoutResponse>('/auth/logout', {}).pipe(
      tap(() => {
        console.log('✅ Logout successful');
        this.clearAuthData();
      }),
      catchError((error) => {
        console.error('❌ Logout error:', error);
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  private storeAuthData(res: AuthResponse): void {
    if (res.token) {
      localStorage.setItem('token', res.token);
    }

    const userId = res.userId || res.id;
    if (userId) {
      localStorage.setItem('userId', userId.toString());
    }

    if (res.email) {
      localStorage.setItem('email', res.email);
    }

    if (res.role) {
      localStorage.setItem('role', res.role);
    }

    console.log('💾 Auth data stored - Role:', res.role, 'UserId:', userId);
  }

  clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    console.log('🗑️ Auth data cleared');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getEmail(): string | null {
    return localStorage.getItem('email');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const isLoggedIn = !!token;
    console.log('🔍 Is logged in:', isLoggedIn);
    return isLoggedIn;
  }
}
