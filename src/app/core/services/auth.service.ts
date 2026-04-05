import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpService } from './http.service';

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
  role: string;
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private httpService: HttpService) {}

  // 🔐 REGISTER
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.httpService.post<AuthResponse>('/auth/register', data).pipe(
      tap(res => this.storeAuthData(res))
    );
  }

  // 🔐 LOGIN
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.httpService.post<AuthResponse>('/auth/login', data).pipe(
      tap(res => this.storeAuthData(res))
    );
  }

  // 🔓 LOGOUT
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
  }

  // 💾 STORE TOKEN
  private storeAuthData(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('userId', res.userId.toString());
    localStorage.setItem('email', res.email);
    localStorage.setItem('role', res.role);
  }

  // 🔍 GET TOKEN
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