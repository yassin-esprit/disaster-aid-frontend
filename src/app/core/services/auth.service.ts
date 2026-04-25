import { Injectable } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
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
  constructor(private httpService: HttpService) {
    console.log('AuthService initialized with HttpService');
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    const registrationData = {
      ...data,
      role: data.role || 'VOLUNTEER'  // Changed from 'CITIZEN' to match your app
    };

    console.log('📝 Registering user:', registrationData.email);

    // Try different endpoint paths based on your backend configuration
    const endpoints = [
      '/auth/register',      // Direct
      '/api/auth/register',  // With /api prefix
      '/api/v1/auth/register' // With /api/v1 prefix
    ];

    // Use the first endpoint, we'll test others if this fails
    const endpoint = '/auth/register';
    console.log('📍 Register endpoint:', endpoint);

    return this.httpService.post<AuthResponse>(endpoint, registrationData).pipe(
      tap(res => {
        console.log('✅ Registration API response:', res);
        this.storeAuthData(res);
      }),
      catchError(error => {
        console.error('❌ Registration API error:', error);
        console.log('💡 Tip: Check if your backend endpoint is correct. The server returned HTML instead of JSON.');
        return throwError(() => error);
      })
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    console.log('🔐 Logging in user:', data.email);
    const endpoint = '/auth/login';
    console.log('📍 Login endpoint:', endpoint);

    return this.httpService.post<AuthResponse>(endpoint, data).pipe(
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
    const endpoint = '/auth/logout';
    return this.httpService.post<LogoutResponse>(endpoint, {}).pipe(
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
