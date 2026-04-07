import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpService } from '../../../core/services/http.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AuditLog,
  DisasterAnalyticsReportDto,
  DisasterStatistics,
  PredictiveModel,
  PredictiveModelRequestDto,
} from '../models/disaster-analytics.model';

@Injectable({ providedIn: 'root' })
export class DisasterAnalyticsService {
  private readonly base = '/api/analytics/disaster';

  constructor(private http: HttpService) {}

  getGlobalReport(): Observable<DisasterAnalyticsReportDto> {
    return this.http
      .get<ApiResponse<DisasterAnalyticsReportDto>>(`${this.base}/report`)
      .pipe(map((res) => res.data));
  }

  getAllStats(): Observable<DisasterStatistics[]> {
    return this.http
      .get<ApiResponse<DisasterStatistics[]>>(`${this.base}/stats`)
      .pipe(map((res) => res.data));
  }

  getStatsByAlert(alertId: number): Observable<DisasterStatistics[]> {
    return this.http
      .get<ApiResponse<DisasterStatistics[]>>(`${this.base}/stats/alert/${alertId}`)
      .pipe(map((res) => res.data));
  }

  getLatestStatsByAlert(alertId: number): Observable<DisasterStatistics> {
    return this.http
      .get<ApiResponse<DisasterStatistics>>(`${this.base}/stats/alert/${alertId}/latest`)
      .pipe(map((res) => res.data));
  }

  getLatestAuditLogs(): Observable<AuditLog[]> {
    return this.http
      .get<ApiResponse<AuditLog[]>>(`${this.base}/audit-logs`)
      .pipe(map((res) => res.data));
  }

  getPredictiveModels(activeOnly = false): Observable<PredictiveModel[]> {
    const params = new HttpParams().set('activeOnly', String(activeOnly));
    return this.http
      .get<ApiResponse<PredictiveModel[]>>(`${this.base}/predictive-models`, params)
      .pipe(map((res) => res.data));
  }

  addPredictiveModel(payload: PredictiveModelRequestDto): Observable<PredictiveModel> {
    return this.http
      .post<ApiResponse<PredictiveModel>>(`${this.base}/add_model`, payload)
      .pipe(map((res) => res.data));
  }

  modifyPredictiveModel(
    modelId: number,
    payload: PredictiveModelRequestDto,
  ): Observable<PredictiveModel> {
    return this.http
      .put<ApiResponse<PredictiveModel>>(
        `${this.base}/modify_model?modelId=${modelId}`,
        payload,
      )
      .pipe(map((res) => res.data));
  }

  deletePredictiveModel(modelId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/delete?modelId=${modelId}`)
      .pipe(map(() => void 0));
  }
}
