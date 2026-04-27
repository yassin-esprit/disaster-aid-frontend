import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

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

  private unwrap<T>(res: ApiResponse<T>): Observable<T> {
    if (!res.success) {
      return throwError(() => ({ error: { message: res.message } }));
    }
    return [res.data] as unknown as Observable<T>;
  }

  private extract<T>() {
    return (source: Observable<ApiResponse<T>>): Observable<T> =>
      source.pipe(
        switchMap((res) => {
          if (!res.success) {
            return throwError(() => ({ error: { message: res.message } }));
          }
          return [res.data];
        }),
      );
  }

  getGlobalReport(): Observable<DisasterAnalyticsReportDto> {
    return this.http
      .get<ApiResponse<DisasterAnalyticsReportDto>>(`${this.base}/report`)
      .pipe(this.extract());
  }

  getAllStats(): Observable<DisasterStatistics[]> {
    return this.http
      .get<ApiResponse<DisasterStatistics[]>>(`${this.base}/stats`)
      .pipe(this.extract());
  }

  getStatsByAlert(alertId: number): Observable<DisasterStatistics[]> {
    return this.http
      .get<ApiResponse<DisasterStatistics[]>>(`${this.base}/stats/alert/${alertId}`)
      .pipe(this.extract());
  }

  getLatestStatsByAlert(alertId: number): Observable<DisasterStatistics> {
    return this.http
      .get<ApiResponse<DisasterStatistics>>(`${this.base}/stats/alert/${alertId}/latest`)
      .pipe(this.extract());
  }

  getLatestAuditLogs(): Observable<AuditLog[]> {
    return this.http
      .get<ApiResponse<AuditLog[]>>(`${this.base}/audit-logs`)
      .pipe(this.extract());
  }

  getPredictiveModels(activeOnly = false): Observable<PredictiveModel[]> {
    const params = new HttpParams().set('activeOnly', String(activeOnly));
    return this.http
      .get<ApiResponse<PredictiveModel[]>>(`${this.base}/predictive-models`, params)
      .pipe(this.extract());
  }

  addPredictiveModel(payload: PredictiveModelRequestDto): Observable<PredictiveModel> {
    return this.http
      .post<ApiResponse<PredictiveModel>>(`${this.base}/add_model`, payload)
      .pipe(this.extract());
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
      .pipe(this.extract());
  }

  deletePredictiveModel(modelId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/delete?modelId=${modelId}`)
      .pipe(map(() => void 0));
  }
}
