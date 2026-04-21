import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AnalyticsNavComponent } from '../../shared/components/analytics-nav/analytics-nav.component';
import { AlertService } from '../../modules/analytics/services/alert.service';
import { Alert, ComparisonResult } from '../../modules/analytics/models/alert.model';

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
  comparison: ComparisonResult | null = null;
  loading = false;
  error = '';

  ngOnInit(): void {
    this.svc.getAllAlerts().pipe(catchError(() => of([]))).subscribe((a) => (this.alerts = a));
  }

  compare(): void {
    if (this.selectedA == null || this.selectedB == null) return;
    if (this.selectedA === this.selectedB) {
      this.error = 'Please select two different alerts';
      return;
    }
    this.loading = true;
    this.error = '';
    this.svc.compareAlerts(this.selectedA, this.selectedB).pipe(
      catchError((e) => {
        this.error = 'Failed to compare alerts';
        this.loading = false;
        return of(null);
      })
    ).subscribe((res) => {
      this.comparison = res;
      this.loading = false;
    });
  }

  getStatValue(side: any, field: string): number | string {
    if (!side?.stats) return '---';
    return side.stats[field] ?? '---';
  }

  better(a: any, b: any, field: string, lower = true): string {
    const va = a?.stats?.[field];
    const vb = b?.stats?.[field];
    if (va == null || vb == null) return '';
    if (lower) return va < vb ? 'A' : va > vb ? 'B' : '';
    return va > vb ? 'A' : va < vb ? 'B' : '';
  }
}
