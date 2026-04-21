import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsNavComponent } from '../../shared/components/analytics-nav/analytics-nav.component';
import { Subscription, interval, forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AlertService } from '../../modules/analytics/services/alert.service';
import {
  AlertWithStats,
  MapSummary,
  AlertSeverity,
  AlertType,
} from '../../modules/analytics/models/alert.model';

@Component({
  selector: 'app-emergency-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AnalyticsNavComponent],
  templateUrl: './emergency-dashboard.component.html',
  styleUrl: './emergency-dashboard.component.scss',
})
export class EmergencyDashboardComponent implements OnInit, OnDestroy {
  private alertSvc = inject(AlertService);
  private pollSub?: Subscription;

  loading = true;
  alertsWithStats: AlertWithStats[] = [];
  summary: MapSummary | null = null;

  readonly severityColors: Record<AlertSeverity, string> = {
    CRITICAL: '#ff6e84',
    HIGH: '#f97316',
    MEDIUM: '#f59e0b',
    LOW: '#699cff',
  };

  readonly severityBg: Record<AlertSeverity, string> = {
    CRITICAL: 'bg-error/10 border-error/20',
    HIGH: 'bg-orange-500/10 border-orange-500/20',
    MEDIUM: 'bg-amber-500/10 border-amber-500/20',
    LOW: 'bg-primary/10 border-primary/20',
  };

  readonly typeIcons: Record<AlertType, string> = {
    EARTHQUAKE: 'earthquake',
    FLOOD: 'flood',
    WILDFIRE: 'local_fire_department',
    STORM: 'thunderstorm',
    LANDSLIDE: 'landslide',
    TSUNAMI: 'tsunami',
    VOLCANIC: 'volcano',
    OTHER: 'warning',
  };

  ngOnInit(): void {
    this.loadData();
    this.pollSub = interval(30000)
      .pipe(switchMap(() => this.fetchData()))
      .subscribe((res) => this.applyData(res));
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  loadData(): void {
    this.loading = true;
    this.fetchData().subscribe((res) => {
      this.applyData(res);
      this.loading = false;
    });
  }

  private fetchData() {
    return forkJoin({
      alertsWithStats: this.alertSvc
        .getAlertsWithStats()
        .pipe(catchError(() => of([] as AlertWithStats[]))),
      summary: this.alertSvc
        .getMapSummary()
        .pipe(catchError(() => of(null as MapSummary | null))),
    });
  }

  private applyData(res: {
    alertsWithStats: AlertWithStats[];
    summary: MapSummary | null;
  }): void {
    this.alertsWithStats = res.alertsWithStats;
    this.summary = res.summary;
  }

  get criticalAlerts(): AlertWithStats[] {
    return this.alertsWithStats.filter(
      (a) => a.alert.severity === 'CRITICAL' && a.alert.status === 'ACTIVE'
    );
  }

  get activeAlerts(): AlertWithStats[] {
    return this.alertsWithStats.filter((a) => a.alert.status === 'ACTIVE');
  }

  get monitoringAlerts(): AlertWithStats[] {
    return this.alertsWithStats.filter((a) => a.alert.status === 'MONITORING');
  }

  get resolvedAlerts(): AlertWithStats[] {
    return this.alertsWithStats.filter((a) => a.alert.status === 'RESOLVED');
  }

  get resolvedPct(): number {
    if (!this.summary || this.summary.totalHelpRequests === 0) return 0;
    return Math.round(
      (this.summary.resolvedRequests / this.summary.totalHelpRequests) * 100
    );
  }

  get totalReports(): number {
    return this.alertsWithStats.reduce(
      (sum, a) => sum + (a.latestStats?.totalReports ?? 0),
      0
    );
  }

  get totalHelpRequests(): number {
    return this.alertsWithStats.reduce(
      (sum, a) => sum + (a.latestStats?.totalHelpRequests ?? 0),
      0
    );
  }

  deleteAlert(alertId: number): void {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    this.alertSvc.deleteAlert(alertId).subscribe(() => this.loadData());
  }

  timeSince(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
