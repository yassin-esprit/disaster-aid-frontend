import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  getGlobalReport(highRiskThreshold = 0.7): Observable<VolunteerAnalyticsReportDto> {
    const params = new HttpParams().set('highRiskThreshold', String(highRiskThreshold));
    return this.http
      .get<ApiResponse<VolunteerAnalyticsReportDto>>(`${this.base}/report`, params)
      .pipe(map((res) => res.data));
  }

  getLatestVolunteerStats(volunteerId: number): Observable<VolunteerStatistics> {
    return this.http
      .get<ApiResponse<VolunteerStatistics>>(`${this.base}/stats/${volunteerId}`)
      .pipe(map((res) => res.data));
  }

  getLatestOrganisationStats(orgId: number): Observable<OrganisationStats> {
    return this.http
      .get<ApiResponse<OrganisationStats>>(`${this.base}/organisations/${orgId}`)
      .pipe(map((res) => res.data));
  }

  getHighRiskPredictions(threshold = 0.7): Observable<ChurnPrediction[]> {
    const params = new HttpParams().set('threshold', String(threshold));
    return this.http
      .get<ApiResponse<ChurnPrediction[]>>(`${this.base}/churn/high-risk`, params)
      .pipe(map((res) => res.data));
  }

  getLatestPredictionByVolunteer(volunteerId: number): Observable<ChurnPrediction> {
    return this.http
      .get<ApiResponse<ChurnPrediction>>(`${this.base}/churn/volunteer/${volunteerId}`)
      .pipe(map((res) => res.data));
  }
}
