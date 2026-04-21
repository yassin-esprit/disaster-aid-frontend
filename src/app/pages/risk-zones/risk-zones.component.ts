import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AnalyticsNavComponent } from '../../shared/components/analytics-nav/analytics-nav.component';
import { AlertService } from '../../modules/analytics/services/alert.service';
import { RiskZone } from '../../modules/analytics/models/alert.model';

@Component({
  selector: 'app-risk-zones',
  standalone: true,
  imports: [CommonModule, RouterModule, AnalyticsNavComponent],
  templateUrl: './risk-zones.component.html',
})
export class RiskZonesComponent implements OnInit {
  private svc = inject(AlertService);

  loading = true;
  zones: RiskZone[] = [];

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
    this.svc.getRiskZones().pipe(
      catchError(() => of([] as RiskZone[]))
    ).subscribe((z) => {
      this.zones = z;
      this.loading = false;
    });
  }

  get totalIncidents(): number {
    return this.zones.reduce((s, z) => s + z.totalAlerts, 0);
  }

  get criticalZones(): number {
    return this.zones.filter(z => z.riskLevel === 'CRITICAL').length;
  }
}
