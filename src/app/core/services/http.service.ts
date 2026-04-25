import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {T} from '@angular/cdk/keycodes';

@Injectable({ providedIn: 'root' })
export class HttpService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('🌐 HttpService initialized with API URL:', this.apiUrl);
  }

  private buildHeaders(additional?: HttpHeaders, isFormData = false): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();

    // Only set JSON content-type when NOT sending FormData
    if (!isFormData) {
      headers = headers.set('Content-Type', 'application/json');
      headers = headers.set('Accept', 'application/json');
    }
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
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

  private handleError(error: HttpErrorResponse) {
    // Check if the response is HTML instead of JSON
    let errorMessage = error.message;
    let isHtmlResponse = false;

    if (error.error && typeof error.error === 'string' && error.error.trim().startsWith('<!DOCTYPE')) {
      isHtmlResponse = true;
      errorMessage = `Server returned HTML instead of JSON. The endpoint ${error.url} may not exist.`;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    console.error('HTTP Error:', {
      url: error.url,
      status: error.status,
      message: errorMessage,
      isHtmlResponse: isHtmlResponse
    });

    if (isHtmlResponse) {
      console.error('💡 The backend endpoint might be incorrect. Check your Spring Boot controller mappings.');
    }

    return throwError(() => error);
  }

  get<T>(endpoint: string, params?: { polygon: string }, customHeaders?: HttpHeaders): Observable<T> {
    const options = {
      headers: this.buildHeaders(customHeaders, false),
      params
    };
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, options);}


  post<T>(endpoint: string, body: unknown, params?: HttpParams, customHeaders?: HttpHeaders): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const isFormData = body instanceof FormData;
    console.log('📡 POST Request:', url, body);
    return this.http.post<T>(url, body as any, { headers: this.buildHeaders(customHeaders, isFormData), params }).pipe(catchError(this.handleError));
  }

  put<T>(endpoint: string, body: unknown, params?: HttpParams, customHeaders?: HttpHeaders): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const isFormData = body instanceof FormData;
    return this.http.put<T>(url, body as any, { headers: this.buildHeaders(customHeaders, isFormData), params }).pipe(catchError(this.handleError));
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
    const url = `${this.apiUrl}${endpoint}`;
    return this.http.delete<T>(url, { headers: this.buildHeaders(customHeaders), params }).pipe(catchError(this.handleError));
  }
}
