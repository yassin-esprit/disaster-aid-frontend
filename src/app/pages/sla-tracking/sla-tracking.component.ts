import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AnalyticsNavComponent } from '../../shared/components/analytics-nav/analytics-nav.component';
import { AlertService } from '../../modules/analytics/services/alert.service';
import { SlaMetric, SlaSummary } from '../../modules/analytics/models/alert.model';

@Component({
  selector: 'app-sla-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule, AnalyticsNavComponent],
  templateUrl: './sla-tracking.component.html',
})
export class SlaTrackingComponent implements OnInit {
  private svc = inject(AlertService);

  loading = true;
  metrics: SlaMetric[] = [];
  summary: SlaSummary | null = null;

  readonly statusColors: Record<string, string> = {
    WITHIN_SLA: '#22c55e',
    AT_RISK: '#f59e0b',
    BREACHED: '#ff6e84',
  };

  ngOnInit(): void {
    forkJoin({
      metrics: this.svc.getSlaMetrics().pipe(catchError(() => of([] as SlaMetric[]))),
      summary: this.svc.getSlaSummary().pipe(catchError(() => of(null as SlaSummary | null))),
    }).subscribe((res) => {
      this.metrics = res.metrics;
      this.summary = res.summary;
      this.loading = false;
    });
  }

  get complianceRate(): number {
    if (!this.summary || this.summary.totalIncidents === 0) return 0;
    return Math.round((this.summary.withinSla / this.summary.totalIncidents) * 100);
  }

  timeSince(dateStr: string | null | undefined): string {
    if (!dateStr) return '---';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
