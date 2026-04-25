// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { HttpService } from './http.service';

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
  role: string;
  message: string;
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
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private httpService: HttpService) {}

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.httpService.post<AuthResponse>('/auth/register', data).pipe(
      tap(res => this.storeAuthData(res))
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.httpService.post<AuthResponse>('/auth/login', data).pipe(
      tap(res => this.storeAuthData(res))
    );
  }

  logout(): Observable<LogoutResponse> {
    return this.httpService.post<LogoutResponse>('/auth/logout', {}).pipe(
      tap(() => this.clearAuthData()),
      catchError((error) => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  private storeAuthData(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('userId', res.userId.toString());
    localStorage.setItem('email', res.email);
    localStorage.setItem('role', res.role);
  }

  clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
