import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { DisasterAnalyticsService } from '../../modules/analytics/services/disaster-analytics.service';
import { VolunteerAnalyticsService } from '../../modules/analytics/services/volunteer-analytics.service';
import {
  AuditLog,
  DisasterAnalyticsReportDto,
  PredictiveModel,
} from '../../modules/analytics/models/disaster-analytics.model';
import {
  ChurnPrediction,
  VolunteerAnalyticsReportDto,
} from '../../modules/analytics/models/volunteer-analytics.model';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics-dashboard.component.html',
})
export class AnalyticsDashboardComponent implements OnInit {
  private disasterSvc = inject(DisasterAnalyticsService);
  private volunteerSvc = inject(VolunteerAnalyticsService);

  loading = true;
  error: string | null = null;

  disasterReport: DisasterAnalyticsReportDto | null = null;
  volunteerReport: VolunteerAnalyticsReportDto | null = null;
  predictiveModels: PredictiveModel[] = [];
  auditLogs: AuditLog[] = [];
  highRiskChurn: ChurnPrediction[] = [];

  highRiskThreshold = 0.7;

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      disasterReport: this.disasterSvc.getGlobalReport().pipe(catchError(() => of(null))),
      volunteerReport: this.volunteerSvc
        .getGlobalReport(this.highRiskThreshold)
        .pipe(catchError(() => of(null))),
      predictiveModels: this.disasterSvc
        .getPredictiveModels(true)
        .pipe(catchError(() => of([] as PredictiveModel[]))),
      auditLogs: this.disasterSvc
        .getLatestAuditLogs()
        .pipe(catchError(() => of([] as AuditLog[]))),
      highRiskChurn: this.volunteerSvc
        .getHighRiskPredictions(this.highRiskThreshold)
        .pipe(catchError(() => of([] as ChurnPrediction[]))),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.disasterReport = res.disasterReport;
          this.volunteerReport = res.volunteerReport;
          this.predictiveModels = res.predictiveModels ?? [];
          this.auditLogs = (res.auditLogs ?? []).slice(0, 8);
          this.highRiskChurn = (res.highRiskChurn ?? []).slice(0, 8);

          if (!res.disasterReport && !res.volunteerReport) {
            this.error = 'Could not reach the analytics backend. Is it running on :8081?';
          }
        },
        error: (err) => {
          this.error = err?.message ?? 'Unknown error while loading analytics.';
        },
      });
  }

  get verifiedRatio(): number {
    if (!this.disasterReport || this.disasterReport.totalReports === 0) return 0;
    return Math.round(
      (this.disasterReport.verifiedReports / this.disasterReport.totalReports) * 100,
    );
  }

  get resolvedRatio(): number {
    if (!this.disasterReport || this.disasterReport.totalHelpRequests === 0) return 0;
    return Math.round(
      (this.disasterReport.resolvedRequests / this.disasterReport.totalHelpRequests) * 100,
    );
  }

  get churnPct(): number {
    if (!this.volunteerReport) return 0;
    return Math.round(this.volunteerReport.avgChurnProbability * 100);
  }
}
