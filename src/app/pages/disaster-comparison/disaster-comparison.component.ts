import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AnalyticsNavComponent } from '../../shared/components/analytics-nav/analytics-nav.component';
import { AlertService } from '../../modules/analytics/services/alert.service';
import { Alert, AlertSeverity } from '../../modules/analytics/models/alert.model';

type DiffKind = 'same' | 'diff' | 'A' | 'B';

interface FieldRow {
  label: string;
  key: keyof Alert;
  valueA: string;
  valueB: string;
  diff: DiffKind;
  format?: 'text' | 'number' | 'date' | 'badge';
}

@Component({
  selector: 'app-disaster-comparison',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AnalyticsNavComponent],
  templateUrl: './disaster-comparison.component.html',
})
export class DisasterComparisonComponent implements OnInit {
  private svc = inject(AlertService);

  alerts: Alert[] = [];
  selectedA: number | null = null;
  selectedB: number | null = null;
  alertA: Alert | null = null;
  alertB: Alert | null = null;
  rows: FieldRow[] = [];
  loading = false;
  error = '';

  private readonly severityRank: Record<AlertSeverity, number> = {
    LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4,
  };

  ngOnInit(): void {
    this.loading = true;
    this.svc.getAllAlerts().pipe(catchError(() => {
      this.error = 'Failed to load alerts. Is the backend running?';
      return of([] as Alert[]);
    })).subscribe((a) => {
      this.alerts = a;
      this.loading = false;
    });
  }

  compare(): void {
    if (this.selectedA == null || this.selectedB == null) return;
    if (this.selectedA === this.selectedB) {
      this.error = 'Please select two different alerts';
      this.alertA = this.alertB = null;
      this.rows = [];
      return;
    }
    this.error = '';
    this.alertA = this.alerts.find((a) => a.alertId === this.selectedA) ?? null;
    this.alertB = this.alerts.find((a) => a.alertId === this.selectedB) ?? null;
    if (!this.alertA || !this.alertB) {
      this.error = 'Selected alerts not found';
      this.rows = [];
      return;
    }
    this.rows = this.buildRows(this.alertA, this.alertB);
  }

  private buildRows(a: Alert, b: Alert): FieldRow[] {
    return [
      this.textRow('Alert ID', 'alertId', a, b),
      this.textRow('Title', 'title', a, b),
      this.textRow('Type', 'type', a, b, 'badge'),
      this.severityRow(a, b),
      this.statusRow(a, b),
      this.textRow('Country', 'country', a, b),
      this.textRow('Region', 'region', a, b),
      this.numericRow('Latitude', 'latitude', a, b, 4),
      this.numericRow('Longitude', 'longitude', a, b, 4),
      this.radiusRow(a, b),
      this.dateRow('Reported At', 'reportedAt', a, b, true),
      this.dateRow('Resolved At', 'resolvedAt', a, b, false),
      this.descriptionRow(a, b),
    ];
  }

  private textRow(label: string, key: keyof Alert, a: Alert, b: Alert, format: FieldRow['format'] = 'text'): FieldRow {
    const va = this.str(a[key]);
    const vb = this.str(b[key]);
    return { label, key, valueA: va, valueB: vb, diff: va === vb ? 'same' : 'diff', format };
  }

  private numericRow(label: string, key: keyof Alert, a: Alert, b: Alert, digits = 0): FieldRow {
    const na = a[key] as number | null | undefined;
    const nb = b[key] as number | null | undefined;
    const fmt = (n: number | null | undefined) => n == null ? '—' : Number(n).toFixed(digits);
    return { label, key, valueA: fmt(na), valueB: fmt(nb), diff: na === nb ? 'same' : 'diff', format: 'number' };
  }

  private radiusRow(a: Alert, b: Alert): FieldRow {
    const va = a.radiusKm ?? 0;
    const vb = b.radiusKm ?? 0;
    let diff: DiffKind = 'same';
    if (va !== vb) diff = va > vb ? 'A' : 'B';
    return { label: 'Radius (km)', key: 'radiusKm', valueA: `${va} km`, valueB: `${vb} km`, diff, format: 'number' };
  }

  private severityRow(a: Alert, b: Alert): FieldRow {
    const ra = this.severityRank[a.severity];
    const rb = this.severityRank[b.severity];
    let diff: DiffKind = 'same';
    if (ra !== rb) diff = ra > rb ? 'A' : 'B';
    return { label: 'Severity', key: 'severity', valueA: a.severity, valueB: b.severity, diff, format: 'badge' };
  }

  private statusRow(a: Alert, b: Alert): FieldRow {
    return { label: 'Status', key: 'status', valueA: a.status, valueB: b.status, diff: a.status === b.status ? 'same' : 'diff', format: 'badge' };
  }

  private dateRow(label: string, key: keyof Alert, a: Alert, b: Alert, earlierIsOlder: boolean): FieldRow {
    const da = a[key] as string | null | undefined;
    const db = b[key] as string | null | undefined;
    const fmt = (d?: string | null) => {
      if (!d) return '—';
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? d : dt.toLocaleString();
    };
    let diff: DiffKind = 'same';
    if (da && db) {
      const ta = new Date(da).getTime();
      const tb = new Date(db).getTime();
      if (ta !== tb) {
        diff = earlierIsOlder ? (ta < tb ? 'A' : 'B') : (ta > tb ? 'A' : 'B');
      }
    } else if (da !== db) {
      diff = 'diff';
    }
    return { label, key, valueA: fmt(da), valueB: fmt(db), diff, format: 'date' };
  }

  private descriptionRow(a: Alert, b: Alert): FieldRow {
    const va = a.description ?? '—';
    const vb = b.description ?? '—';
    return { label: 'Description', key: 'description', valueA: va, valueB: vb, diff: va === vb ? 'same' : 'diff' };
  }

  private str(v: unknown): string {
    if (v == null) return '—';
    return String(v);
  }

  distanceKm(): number | null {
    if (!this.alertA || !this.alertB) return null;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(this.alertB.latitude - this.alertA.latitude);
    const dLon = toRad(this.alertB.longitude - this.alertA.longitude);
    const aa =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(this.alertA.latitude)) * Math.cos(toRad(this.alertB.latitude)) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa)));
  }

  durationHours(alert: Alert | null): number | null {
    if (!alert?.reportedAt) return null;
    const start = new Date(alert.reportedAt).getTime();
    const end = alert.resolvedAt ? new Date(alert.resolvedAt).getTime() : Date.now();
    return Math.round((end - start) / 3600000);
  }

  severityColor(s: string): string {
    const map: Record<string, string> = {
      CRITICAL: '#ff6e84',
      HIGH: '#f97316',
      MEDIUM: '#f59e0b',
      LOW: '#699cff',
    };
    return map[s] ?? '#aca3ff';
  }

  statusColor(s: string): string {
    const map: Record<string, string> = {
      ACTIVE: '#ff6e84',
      MONITORING: '#f59e0b',
      RESOLVED: '#22c55e',
    };
    return map[s] ?? '#aca3ff';
  }

  swap(): void {
    [this.selectedA, this.selectedB] = [this.selectedB, this.selectedA];
    this.compare();
  }

  clear(): void {
    this.selectedA = this.selectedB = null;
    this.alertA = this.alertB = null;
    this.rows = [];
    this.error = '';
  }
}
