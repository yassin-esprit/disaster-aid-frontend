import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service'; // ← use master's HttpService, not HttpClient directly

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
  clipScore?: number;        // ✅ Added missing field
  capturedAt?: string;
}

export interface StatusHistory {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  changedBy: number | null;
  note: string | null;
  changedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class IncidentService {

  // All paths are relative — HttpService prepends environment.apiUrl (port 8089)
  private base         = '/incidents';
  private evidenceBase = '/evidences';

  constructor(private http: HttpService) {}

  // ✅ GET all incidents
  getAll(): Observable<IncidentReport[]> {
    return this.http.get<ApiResponse<IncidentReport[]>>(this.base)
      .pipe(map(r => r.data));
  }

  // ✅ GET incident by ID
  getById(id: number): Observable<IncidentReport> {
    return this.http.get<ApiResponse<IncidentReport>>(`${this.base}/${id}`)
      .pipe(map(r => r.data));
  }

  // ✅ NEW: GET incidents by status
  getByStatus(status: string): Observable<IncidentReport[]> {
    return this.http.get<ApiResponse<IncidentReport[]>>(`${this.base}/status/${status}`)
      .pipe(map(r => r.data));
  }

  // ✅ NEW: GET incidents by severity
  getBySeverity(severity: string): Observable<IncidentReport[]> {
    return this.http.get<ApiResponse<IncidentReport[]>>(`${this.base}/severity/${severity}`)
      .pipe(map(r => r.data));
  }

  // ✅ Create new incident (accepts partial for flexibility)
  create(report: Partial<IncidentReport>): Observable<IncidentReport> {
    return this.http.post<ApiResponse<IncidentReport>>(this.base, report)
      .pipe(map(r => r.data));
  }

  // ✅ Update incident (accepts partial for flexibility)
  update(id: number, report: Partial<IncidentReport>): Observable<IncidentReport> {
    return this.http.put<ApiResponse<IncidentReport>>(`${this.base}/${id}`, report)
      .pipe(map(r => r.data));
  }

  // ✅ Delete incident
  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`)
      .pipe(map(() => void 0));
  }

  // ✅ Upvote incident
  upvote(id: number): Observable<IncidentReport> {
    return this.http.post<ApiResponse<IncidentReport>>(`${this.base}/${id}/upvote`, {})
      .pipe(map(r => r.data));
  }

  // ✅ Downvote incident
  downvote(id: number): Observable<IncidentReport> {
    return this.http.post<ApiResponse<IncidentReport>>(`${this.base}/${id}/downvote`, {})
      .pipe(map(r => r.data));
  }

  // ✅ Update incident status
  updateStatus(id: number, status: string): Observable<IncidentReport> {
    return this.http.post<ApiResponse<IncidentReport>>(
      `${this.base}/${id}/status?status=${status}`, {}
    ).pipe(map(r => r.data));
  }

  // ✅ Check for duplicate incidents
  checkDuplicate(dto: Partial<IncidentReport>): Observable<{ message: string; data: IncidentReport | null }> {
    return this.http.post<ApiResponse<IncidentReport | null>>(
      `${this.base}/check-duplicate`, dto
    ).pipe(map(r => ({ message: r.message, data: r.data })));
  }

  // ✅ NEW: Find duplicate (convenience method)
  findDuplicate(dto: Partial<IncidentReport>): Observable<IncidentReport | null> {
    return this.checkDuplicate(dto).pipe(map(r => r.data));
  }

  // ✅ Get status history
  getHistory(id: number): Observable<StatusHistory[]> {
    return this.http.get<ApiResponse<StatusHistory[]>>(`${this.base}/${id}/history`)
      .pipe(map(r => r.data));
  }

  // ✅ Upload evidence
  uploadEvidence(reportId: number, file: File): Observable<ReportEvidence> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ReportEvidence>>(
      `${this.evidenceBase}/report/${reportId}/upload`, formData
    ).pipe(map(r => r.data));
  }

  // ✅ Get evidence by report ID
  getEvidenceByReport(reportId: number): Observable<ReportEvidence[]> {
    return this.http.get<ApiResponse<ReportEvidence[]>>(
      `${this.evidenceBase}/report/${reportId}`
    ).pipe(map(r => r.data));
  }

  // ✅ NEW: Delete evidence by ID
  deleteEvidence(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.evidenceBase}/${id}`)
      .pipe(map(() => void 0));
  }

  // ✅ NEW: Get evidence by ID
  getEvidenceById(id: number): Observable<ReportEvidence> {
    return this.http.get<ApiResponse<ReportEvidence>>(`${this.evidenceBase}/${id}`)
      .pipe(map(r => r.data));
  }

  // // ✅ NEW: Update evidence clip score (for AI credibility scoring)
  // updateEvidenceClipScore(id: number, clipScore: number): Observable<ReportEvidence> {
  //   return this.http.patch<ApiResponse<ReportEvidence>>(
  //     `${this.evidenceBase}/${id}/clip-score`, { clipScore }
  //   ).pipe(map(r => r.data));
  // }

  // ✅ NEW: Bulk upload multiple evidences
  uploadMultipleEvidences(reportId: number, files: File[]): Observable<ReportEvidence[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return this.http.post<ApiResponse<ReportEvidence[]>>(
      `${this.evidenceBase}/report/${reportId}/bulk-upload`, formData
    ).pipe(map(r => r.data));
  }

  // ✅ NEW: Get incidents by reporter ID
  getByReporterId(reporterId: number): Observable<IncidentReport[]> {
    return this.http.get<ApiResponse<IncidentReport[]>>(`${this.base}/reporter/${reporterId}`)
      .pipe(map(r => r.data));
  }

  // ✅ NEW: Get incidents by disaster type
  getByDisasterType(disasterType: string): Observable<IncidentReport[]> {
    return this.http.get<ApiResponse<IncidentReport[]>>(`${this.base}/disaster-type/${disasterType}`)
      .pipe(map(r => r.data));
  }

  // ✅ NEW: Get incidents within date range
  getByDateRange(startDate: string, endDate: string): Observable<IncidentReport[]> {
    return this.http.get<ApiResponse<IncidentReport[]>>(
      `${this.base}/date-range?start=${startDate}&end=${endDate}`
    ).pipe(map(r => r.data));
  }

  // ✅ NEW: Get top rated incidents (by credibility score)
  getTopRated(limit: number = 10): Observable<IncidentReport[]> {
    return this.http.get<ApiResponse<IncidentReport[]>>(`${this.base}/top-rated?limit=${limit}`)
      .pipe(map(r => r.data));
  }

  // ✅ NEW: Verify incident with AI credibility check
  verifyIncident(id: number): Observable<{ credibilityScore: number; message: string }> {
    return this.http.post<ApiResponse<{ credibilityScore: number; message: string }>>(
      `${this.base}/${id}/verify`, {}
    ).pipe(map(r => r.data));
  }

  // ✅ NEW: Search incidents by keyword/location
  searchIncidents(query: string): Observable<IncidentReport[]> {
    return this.http.get<ApiResponse<IncidentReport[]>>(`${this.base}/search?q=${encodeURIComponent(query)}`)
      .pipe(map(r => r.data));
  }

  // ✅ NEW: Get incident statistics
  getStatistics(): Observable<{
    totalIncidents: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    byDisasterType: Record<string, number>;
    averageCredibilityScore: number;
  }> {
    return this.http.get<ApiResponse<any>>(`${this.base}/statistics`)
      .pipe(map(r => r.data));
  }

  // // ✅ NEW: Export incidents to CSV/Excel
  // exportIncidents(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
  //   return this.http.get(`${this.base}/export?format=${format}`, {
  //     responseType: 'blob'
  //   }) as Observable<Blob>;
  // }
}
