import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { User, UserRequest } from '../../modules/identity/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private httpService: HttpService) {}

  // Get all users
  getAllUsers(): Observable<User[]> {
    return this.httpService.get<User[]>('/identity-access/users');
  }

  // Get user by ID
  getUserById(id: number): Observable<User> {
    return this.httpService.get<User>(`/identity-access/users/${id}`);
  }

  // Create a new user
  createUser(user: UserRequest): Observable<User> {
    return this.httpService.post<User>('/identity-access/users', user);
  }

  // Update an existing user
  updateUser(id: number, user: UserRequest): Observable<User> {
    return this.httpService.put<User>(`/identity-access/users/${id}`, user);
  }

  // Delete user by ID
  deleteUser(id: number): Observable<void> {
    return this.httpService.delete<void>(`/identity-access/users/${id}`);
  }

  // Get the current authenticated user's profile
  getMyProfile(): Observable<any> {
    return this.httpService.get<any>('/identity-access/users/me');
  }

  updateMyProfile(formData: FormData): Observable<any> {
    // Ne pas définir headers Content-Type ici ; le navigateur fixe le boundary
    return this.httpService.put<any>('/identity-access/users/me', formData);
  }
}