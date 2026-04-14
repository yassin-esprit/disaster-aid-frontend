import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { HttpService } from '../../../core/services/http.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Alert, AlertWithStats, MapSummary } from '../models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly base = '/api/alerts';

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
}
