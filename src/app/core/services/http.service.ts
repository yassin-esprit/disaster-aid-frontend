import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(customHeaders?: HttpHeaders): HttpHeaders {
    const token = localStorage.getItem('token');

    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    if (customHeaders) {
      customHeaders.keys().forEach((key) => {
        const value = customHeaders.get(key);
        if (value !== null) {
          headers = headers.set(key, value);
        }
      });
    }

    return headers;
  }

  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, {
      headers: this.getHeaders(),
      params
    });
  }

  post<T>(endpoint: string, body: unknown, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, body, {
      headers: this.getHeaders(headers)
    });
  }

  put<T>(endpoint: string, body: unknown, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, body, {
      headers: this.getHeaders(headers)
    });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, {
      headers: this.getHeaders()
    });
  }
}