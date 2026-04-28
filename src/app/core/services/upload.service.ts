import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly uploadBase = `${environment.apiUrl}/uploads`;

  constructor(private http: HttpClient) {}

  uploadDocument(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ApiResponse<string>>(this.uploadBase, formData)
      .pipe(map((response) => response.data));
  }
}
