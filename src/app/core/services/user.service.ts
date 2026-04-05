import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { User, UserRequest } from '../../modules/identity/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private httpService: HttpService) {}

  getAllUsers(): Observable<User[]> {
    return this.httpService.get<User[]>('/identity-access/users');
  }

  getUserById(id: number): Observable<User> {
    return this.httpService.get<User>(`/identity-access/users/${id}`);
  }

  createUser(user: UserRequest): Observable<User> {
    return this.httpService.post<User>('/identity-access/users', user);
  }

  updateUser(id: number, user: UserRequest): Observable<User> {
    return this.httpService.put<User>(`/identity-access/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.httpService.delete<void>(`/identity-access/users/${id}`);
  }
}