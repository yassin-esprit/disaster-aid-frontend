import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, of, map, forkJoin } from 'rxjs';

import { AnalyticsNavComponent } from '../../shared/components/analytics-nav/analytics-nav.component';
import { AlertService } from '../../modules/analytics/services/alert.service';
import { Alert, RiskZone } from '../../modules/analytics/models/alert.model';

interface HistoryBucket {
  label: string;
  count: number;
  active: number;
  resolved: number;
}

@Component({
  selector: 'app-risk-zones',
  standalone: true,
  imports: [CommonModule, RouterModule, AnalyticsNavComponent],
  templateUrl: './risk-zones.component.html',
})
export class RiskZonesComponent implements OnInit {
  private svc = inject(AlertService);

  loading = true;
  errorMsg = '';
  usedFallback = false;
  zones: RiskZone[] = [];
  history: HistoryBucket[] = [];
  totalAlerts = 0;

  readonly riskColors: Record<string, string> = {
    CRITICAL: '#ff6e84',
    HIGH: '#f97316',
    MEDIUM: '#f59e0b',
    LOW: '#699cff',
  };

  readonly riskBg: Record<string, string> = {
    CRITICAL: 'border-error/20',
    HIGH: 'border-orange-500/20',
    MEDIUM: 'border-amber-500/20',
    LOW: 'border-primary/20',
  };

  ngOnInit(): void {
    forkJoin({
      zones: this.svc.getRiskZones().pipe(
        catchError(() => of(null as RiskZone[] | null)),
      ),
      alerts: this.svc.getAllAlerts().pipe(
        catchError(() => of([] as Alert[])),
      ),
    }).subscribe(({ zones, alerts }) => {
      this.totalAlerts = alerts.length;

      if (zones && zones.length > 0) {
        this.zones = zones;
      } else {
        this.usedFallback = true;
        this.zones = this.computeZonesFromAlerts(alerts);
      }

      this.history = this.computeHistory(alerts);

      if (this.zones.length === 0 && alerts.length === 0) {
        this.errorMsg = 'No alerts available. Backend may be offline or the database is empty.';
      } else if (this.zones.length === 0) {
        this.errorMsg = 'No alerts have a region set — risk zones cannot be computed.';
      }

      this.loading = false;
    });
  }

  private computeZonesFromAlerts(alerts: Alert[]): RiskZone[] {
    const byRegion = new Map<string, Alert[]>();
    for (const a of alerts) {
      const region = (a.region ?? '').trim();
      if (!region) continue;
      const list = byRegion.get(region) ?? [];
      list.push(a);
      byRegion.set(region, list);
    }

    const zones: RiskZone[] = [];
    byRegion.forEach((list, region) => {
      const total = list.length;
      const active = list.filter((a) => a.status === 'ACTIVE').length;
      const resolved = list.filter((a) => a.status === 'RESOLVED').length;
      const avgLat = list.reduce((s, a) => s + a.latitude, 0) / total;
      const avgLng = list.reduce((s, a) => s + a.longitude, 0) / total;
      const country = list[0].country ?? '—';
      const types = Array.from(new Set(list.map((a) => a.type))).sort();

      let risk: RiskZone['riskLevel'];
      if (active >= 3 || total >= 5) risk = 'CRITICAL';
      else if (active >= 2 || total >= 3) risk = 'HIGH';
      else if (active >= 1 || total >= 2) risk = 'MEDIUM';
      else risk = 'LOW';

      zones.push({
        region,
        country,
        totalAlerts: total,
        activeAlerts: active,
        resolvedAlerts: resolved,
        avgLatitude: avgLat,
        avgLongitude: avgLng,
        riskLevel: risk,
        disasterTypes: types,
      });
    });

    return zones.sort((a, b) => b.totalAlerts - a.totalAlerts);
  }

  private computeHistory(alerts: Alert[]): HistoryBucket[] {
    const buckets = new Map<string, HistoryBucket>();
    for (const a of alerts) {
      if (!a.reportedAt) continue;
      const d = new Date(a.reportedAt);
      if (isNaN(d.getTime())) continue;
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const b = buckets.get(key) ?? { label, count: 0, active: 0, resolved: 0 };
      b.count += 1;
      if (a.status === 'ACTIVE') b.active += 1;
      if (a.status === 'RESOLVED') b.resolved += 1;
      buckets.set(key, b);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }

  get totalIncidents(): number {
    return this.zones.reduce((s, z) => s + z.totalAlerts, 0);
  }

  get criticalZones(): number {
    return this.zones.filter((z) => z.riskLevel === 'CRITICAL').length;
  }

  get maxHistoryCount(): number {
    return Math.max(1, ...this.history.map((h) => h.count));
  }

  historyBarPct(count: number): number {
    return Math.round((count / this.maxHistoryCount) * 100);
  }
}
