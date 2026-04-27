import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AnalyticsNavComponent } from '../../shared/components/analytics-nav/analytics-nav.component';
import { AlertService } from '../../modules/analytics/services/alert.service';
import { DataQualityReport, DataIssue } from '../../modules/analytics/models/alert.model';

@Component({
  selector: 'app-data-quality',
  standalone: true,
  imports: [CommonModule, RouterModule, AnalyticsNavComponent],
  templateUrl: './data-quality.component.html',
})
export class DataQualityComponent implements OnInit {
  private svc = inject(AlertService);

  loading = true;
  report: DataQualityReport | null = null;

  readonly severityColors: Record<string, string> = {
    CRITICAL: '#ff6e84',
    WARNING: '#f59e0b',
    INFO: '#699cff',
  };

  readonly categoryLabels: Record<string, string> = {
    MISSING_LOCATION: 'Missing Location',
    MISSING_REGION: 'Missing Region',
    STALE_ACTIVE: 'Stale Active Alert',
    MISSING_RESOLVED_DATE: 'Missing Resolved Date',
    MISSING_DESCRIPTION: 'Missing Description',
    LARGE_RADIUS: 'Large Radius',
    NO_STATISTICS: 'No Statistics',
  };

  ngOnInit(): void {
    this.analyze();
  }

  analyze(): void {
    this.loading = true;
    this.svc.analyzeDataQuality().pipe(
      catchError(() => of(null as DataQualityReport | null))
    ).subscribe((r) => {
      this.report = r;
      this.loading = false;
    });
  }

  get criticalCount(): number {
    return this.report?.issues.filter(i => i.severity === 'CRITICAL').length ?? 0;
  }

  get warningCount(): number {
    return this.report?.issues.filter(i => i.severity === 'WARNING').length ?? 0;
  }

  get infoCount(): number {
    return this.report?.issues.filter(i => i.severity === 'INFO').length ?? 0;
  }

  get scoreColor(): string {
    if (!this.report) return 'text-on-surface';
    if (this.report.qualityScore >= 80) return 'text-green-400';
    if (this.report.qualityScore >= 50) return 'text-amber-400';
    return 'text-error';
  }
}
