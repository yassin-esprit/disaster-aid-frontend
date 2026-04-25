// core/services/http.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  //private readonly apiUrl = environment.apiUrl;
  private readonly apiUrl = 'http://localhost:8089/api'; // Hardcoded for testing

  constructor(private http: HttpClient) {
    console.log('🔍 API URL being used:', this.apiUrl);
  }

  private buildHeaders(additional?: HttpHeaders, isFormData = false): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();

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

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || error.message || `Server returned code ${error.status}`;
    }

    console.error('HTTP Error Details:', {
      url: error.url,
      status: error.status,
      message: errorMessage
    });

    return throwError(() => error);
  }

  post<T>(endpoint: string, body: unknown, params?: HttpParams, customHeaders?: HttpHeaders): Observable<T> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const isFormData = body instanceof FormData;
    const options = {
      headers: this.buildHeaders(customHeaders, isFormData),
      params
    };
    const fullUrl = `${this.apiUrl}${normalizedEndpoint}`;
    console.log(`📤 POST request to: ${fullUrl}`, body);
    return this.http.post<T>(fullUrl, body as any, options).pipe(catchError(this.handleError));
  }

  // Add other HTTP methods (get, put, delete, patch) similarly...
  get<T>(endpoint: string, params?: HttpParams, customHeaders?: HttpHeaders): Observable<T> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const options = {
      headers: this.buildHeaders(customHeaders, false),
      params
    };
    const fullUrl = `${this.apiUrl}${normalizedEndpoint}`;
    console.log(`📤 GET request to: ${fullUrl}`);
    return this.http.get<T>(fullUrl, options).pipe(catchError(this.handleError));
  }

  put<T>(endpoint: string, body: unknown, params?: HttpParams, customHeaders?: HttpHeaders): Observable<T> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const isFormData = body instanceof FormData;
    const options = {
      headers: this.buildHeaders(customHeaders, isFormData),
      params
    };
    const fullUrl = `${this.apiUrl}${normalizedEndpoint}`;
    console.log(`📤 PUT request to: ${fullUrl}`);
    return this.http.put<T>(fullUrl, body as any, options).pipe(catchError(this.handleError));
  }

  delete<T>(endpoint: string, params?: HttpParams, customHeaders?: HttpHeaders): Observable<T> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const options = {
      headers: this.buildHeaders(customHeaders, false),
      params
    };
    const fullUrl = `${this.apiUrl}${normalizedEndpoint}`;
    console.log(`📤 DELETE request to: ${fullUrl}`);
    return this.http.delete<T>(fullUrl, options).pipe(catchError(this.handleError));
  }
}
