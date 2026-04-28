import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Fetches the analytics report PDF as a Blob. */
  downloadAnalyticsReport(): Observable<HttpResponse<Blob>> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);

    return this.http.get(`${this.apiUrl}/reports/analytics/download`, {
      headers,
      responseType: 'blob',
      observe: 'response',
    });
  }

  /** Trigger a browser download for the given Blob and filename. */
  saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** Extract a filename from a Content-Disposition header, or return a fallback. */
  filenameFromResponse(headers: HttpHeaders, fallback: string): string {
    const dispo = headers.get('Content-Disposition') || headers.get('content-disposition');
    if (!dispo) return fallback;
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(dispo);
    return match ? decodeURIComponent(match[1]) : fallback;
  }
}

