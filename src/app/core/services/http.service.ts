import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {T} from '@angular/cdk/keycodes';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private buildHeaders(additional?: HttpHeaders, isFormData = false): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();

    // Only set JSON content-type when NOT sending FormData
    if (!isFormData) {
      headers = headers.set('Content-Type', 'application/json');
      headers = headers.set('Accept', 'application/json');
    }

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    if (additional) {
      additional.keys().forEach(key => {
        const val = additional.get(key);
        if (val !== null) {
          headers = headers.set(key, val);
        }
      });
    }

    return headers;
  }

  get<T>(endpoint: string, params?: { polygon: string }, customHeaders?: HttpHeaders): Observable<T> {
    const options = {
      headers: this.buildHeaders(customHeaders, false),
      params
    };
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, options);
  }

  post<T>(endpoint: string, body: unknown, params?: HttpParams, customHeaders?: HttpHeaders): Observable<T> {
    const isFormData = body instanceof FormData;
    const options = {
      headers: this.buildHeaders(customHeaders, isFormData),
      params
    };
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, body as any, options);
  }

  put<T>(endpoint: string, body: unknown, params?: HttpParams, customHeaders?: HttpHeaders): Observable<T> {
    const isFormData = body instanceof FormData;
    const options = {
      headers: this.buildHeaders(customHeaders, isFormData),
      params
    };
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, body as any, options);
  }
  patch<T>(endpoint: string, body: unknown, params?: HttpParams, customHeaders?: HttpHeaders): Observable<T> {
    const isFormData = body instanceof FormData;
    const options = {
      headers: this.buildHeaders(customHeaders, isFormData),
      params
    };
    return this.http.patch<T>(`${this.apiUrl}${endpoint}`, body as any, options);
  }
  delete<T>(endpoint: string, params?: HttpParams, customHeaders?: HttpHeaders): Observable<T> {
    const options = {
      headers: this.buildHeaders(customHeaders, false),
      params
    };
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, options);
  }
}
