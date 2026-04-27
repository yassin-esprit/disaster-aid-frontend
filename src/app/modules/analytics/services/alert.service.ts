import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { HttpService } from '../../../core/services/http.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Alert, AlertWithStats, MapSummary,
  SlaMetric, SlaSummary, ComparisonResult,
  AlertRule, RuleExecutionResult,
  DataQualityReport, RiskZone, AlertSnapshot,
} from '../models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly base = '/alerts';

  constructor(private http: HttpService) {}

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

  getAllAlerts(): Observable<Alert[]> {
    return this.http
      .get<ApiResponse<Alert[]>>(this.base)
      .pipe(this.extract());
  }

  getActiveAlerts(): Observable<Alert[]> {
    return this.http
      .get<ApiResponse<Alert[]>>(`${this.base}/active`)
      .pipe(this.extract());
  }

  getAlertsWithStats(): Observable<AlertWithStats[]> {
    return this.http
      .get<ApiResponse<AlertWithStats[]>>(`${this.base}/with-stats`)
      .pipe(this.extract());
  }

  getAlertWithStats(alertId: number): Observable<AlertWithStats> {
    return this.http
      .get<ApiResponse<AlertWithStats>>(`${this.base}/${alertId}/with-stats`)
      .pipe(this.extract());
  }

  getMapSummary(): Observable<MapSummary> {
    return this.http
      .get<ApiResponse<MapSummary>>(`${this.base}/map-summary`)
      .pipe(this.extract());
  }

  deleteAlert(alertId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${alertId}`).pipe(this.extract());
  }

  // SLA
  getSlaMetrics(): Observable<SlaMetric[]> {
    return this.http.get<ApiResponse<SlaMetric[]>>('/sla').pipe(this.extract());
  }

  getSlaSummary(): Observable<SlaSummary> {
    return this.http.get<ApiResponse<SlaSummary>>('/sla/summary').pipe(this.extract());
  }

  // Rules
  getRules(): Observable<AlertRule[]> {
    return this.http.get<ApiResponse<AlertRule[]>>('/rules').pipe(this.extract());
  }

  createRule(rule: AlertRule): Observable<AlertRule> {
    return this.http.post<ApiResponse<AlertRule>>('/rules', rule).pipe(this.extract());
  }

  updateRule(id: number, rule: AlertRule): Observable<AlertRule> {
    return this.http.put<ApiResponse<AlertRule>>(`/rules/${id}`, rule).pipe(this.extract());
  }

  deleteRule(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`/rules/${id}`).pipe(this.extract());
  }

  evaluateRules(): Observable<RuleExecutionResult[]> {
    return this.http.post<ApiResponse<RuleExecutionResult[]>>('/rules/evaluate', {}).pipe(this.extract());
  }

  // Data Quality
  analyzeDataQuality(): Observable<DataQualityReport> {
    return this.http.get<ApiResponse<DataQualityReport>>('/data-quality/analyze').pipe(this.extract());
  }

  // Risk Zones
  getRiskZones(): Observable<RiskZone[]> {
    return this.http.get<ApiResponse<RiskZone[]>>('/risk-zones').pipe(this.extract());
  }

  // Replay
  getTimeline(alertId: number): Observable<AlertSnapshot[]> {
    return this.http
      .get<ApiResponse<AlertSnapshot[]>>(`${this.base}/replay/${alertId}`)
      .pipe(this.extract());
  }
}
