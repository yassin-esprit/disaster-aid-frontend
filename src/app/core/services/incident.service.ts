import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface IncidentReport {
  id?: number;
  reporterId?: number;
  alertId?: number;
  disasterType: string;
  severity: string;
  location: string;
  description: string;
  status?: string;
  credibilityScore?: number;
  upvoteCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportEvidence {
  id?: number;
  incidentReportId?: number;
  fileUrl: string;
  fileType?: string;
  clipScore?: number;
  capturedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
export interface StatusHistory {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  changedBy: number | null;
  note: string | null;
  changedAt: string;
}



@Injectable({ providedIn: 'root' })
export class IncidentService {
  private base = `${environment.apiUrl}/incidents`;
  private evidenceBase = `${environment.apiUrl}/evidences`;

  constructor(private http: HttpClient) {}




getHistory(id: number): Observable<StatusHistory[]> {
  return this.http.get<ApiResponse<StatusHistory[]>>(`${this.base}/${id}/history`)
    .pipe(map(r => r.data));
}

  checkDuplicate(dto: Partial<IncidentReport>): Observable<{ message: string; data: IncidentReport | null }> {
    return this.http.post<ApiResponse<IncidentReport | null>>(
      `${this.base}/check-duplicate`, dto
    ).pipe(map(r => ({ message: r.message, data: r.data })));
  }



  getAll(): Observable<IncidentReport[]> {
    return this.http
      .get<ApiResponse<IncidentReport[]>>(this.base)
      .pipe(map((r) => r.data));
  }

  getById(id: number): Observable<IncidentReport> {
    return this.http
      .get<ApiResponse<IncidentReport>>(`${this.base}/${id}`)
      .pipe(map((r) => r.data));
  }

  getByStatus(status: string): Observable<IncidentReport[]> {
    return this.http
      .get<ApiResponse<IncidentReport[]>>(`${this.base}/status/${status}`)
      .pipe(map((r) => r.data));
  }

  getBySeverity(severity: string): Observable<IncidentReport[]> {
    return this.http
      .get<ApiResponse<IncidentReport[]>>(`${this.base}/severity/${severity}`)
      .pipe(map((r) => r.data));
  }

  create(report: IncidentReport): Observable<IncidentReport> {
    return this.http
      .post<ApiResponse<IncidentReport>>(this.base, report)
      .pipe(map((r) => r.data));
  }

  update(id: number, report: IncidentReport): Observable<IncidentReport> {
    return this.http
      .put<ApiResponse<IncidentReport>>(`${this.base}/${id}`, report)
      .pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/${id}`)
      .pipe(map(() => void 0));
  }

  getEvidenceByReport(reportId: number): Observable<ReportEvidence[]> {
    return this.http
      .get<
        ApiResponse<ReportEvidence[]>
      >(`${this.evidenceBase}/report/${reportId}`)
      .pipe(map((r) => r.data));
  }

  upvote(id: number): Observable<IncidentReport> {
    return this.http.patch<ApiResponse<IncidentReport>>(`${this.base}/${id}/upvote`, {})
      .pipe(map(r => r.data));
  }

  updateStatus(id: number, status: string): Observable<IncidentReport> {
    return this.http.patch<ApiResponse<IncidentReport>>(
      `${this.base}/${id}/status?status=${status}`, {}
    ).pipe(map(r => r.data));
  }
}
