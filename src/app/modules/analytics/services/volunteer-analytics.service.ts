import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { HttpService } from '../../../core/services/http.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  ChurnPrediction,
  OrganisationStats,
  VolunteerAnalyticsReportDto,
  VolunteerStatistics,
} from '../models/volunteer-analytics.model';

@Injectable({ providedIn: 'root' })
export class VolunteerAnalyticsService {
  private readonly base = '/api/analytics/volunteer';

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

  getGlobalReport(highRiskThreshold = 0.7): Observable<VolunteerAnalyticsReportDto> {
    const params = new HttpParams().set('highRiskThreshold', String(highRiskThreshold));
    return this.http
      .get<ApiResponse<VolunteerAnalyticsReportDto>>(`${this.base}/report`, params)
      .pipe(this.extract());
  }

  getLatestVolunteerStats(volunteerId: number): Observable<VolunteerStatistics> {
    return this.http
      .get<ApiResponse<VolunteerStatistics>>(`${this.base}/stats/${volunteerId}`)
      .pipe(this.extract());
  }

  getLatestOrganisationStats(orgId: number): Observable<OrganisationStats> {
    return this.http
      .get<ApiResponse<OrganisationStats>>(`${this.base}/organisations/${orgId}`)
      .pipe(this.extract());
  }

  getHighRiskPredictions(threshold = 0.7): Observable<ChurnPrediction[]> {
    const params = new HttpParams().set('threshold', String(threshold));
    return this.http
      .get<ApiResponse<ChurnPrediction[]>>(`${this.base}/churn/high-risk`, params)
      .pipe(this.extract());
  }

  getLatestPredictionByVolunteer(volunteerId: number): Observable<ChurnPrediction> {
    return this.http
      .get<ApiResponse<ChurnPrediction>>(`${this.base}/churn/volunteer/${volunteerId}`)
      .pipe(this.extract());
  }
}
