import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsNavComponent } from '../../shared/components/analytics-nav/analytics-nav.component';
import { FormsModule } from '@angular/forms';

import { DisasterAnalyticsService } from '../../modules/analytics/services/disaster-analytics.service';
import { VolunteerAnalyticsService } from '../../modules/analytics/services/volunteer-analytics.service';
import { DisasterStatistics } from '../../modules/analytics/models/disaster-analytics.model';
import {
  ChurnPrediction,
  OrganisationStats,
  VolunteerStatistics,
} from '../../modules/analytics/models/volunteer-analytics.model';

@Component({
  selector: 'app-analytics-lookups',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AnalyticsNavComponent],
  templateUrl: './analytics-lookups.component.html',
})
export class AnalyticsLookupsComponent implements OnInit {
  private disasterSvc = inject(DisasterAnalyticsService);
  private volunteerSvc = inject(VolunteerAnalyticsService);

  // All disaster stats
  allStats: DisasterStatistics[] = [];
  allStatsLoading = false;
  allStatsError: string | null = null;
  statsSearchTerm = '';

  get filteredStats(): DisasterStatistics[] {
    if (!this.statsSearchTerm.trim()) return this.allStats;
    const term = this.statsSearchTerm.trim().toLowerCase();
    return this.allStats.filter(s =>
      String(s.alertId).includes(term) ||
      String(s.totalReports).includes(term) ||
      String(s.verifiedReports).includes(term) ||
      String(s.totalHelpRequests).includes(term) ||
      String(s.resolvedRequests).includes(term) ||
      String(s.activeResponders).includes(term)
    );
  }

  // Disaster stats by alert
  alertId: number | null = null;
  alertStats: DisasterStatistics[] = [];
  latestAlertStat: DisasterStatistics | null = null;
  alertLoading = false;
  alertError: string | null = null;

  // Volunteer stats lookup
  volunteerId: number | null = null;
  volunteerStats: VolunteerStatistics | null = null;
  volunteerLoading = false;
  volunteerError: string | null = null;

  // Organisation stats lookup
  orgId: number | null = null;
  orgStats: OrganisationStats | null = null;
  orgLoading = false;
  orgError: string | null = null;

  // Churn prediction lookup
  churnVolunteerId: number | null = null;
  churnPrediction: ChurnPrediction | null = null;
  churnLoading = false;
  churnError: string | null = null;

  ngOnInit(): void {
    this.loadAllStats();
  }

  loadAllStats(): void {
    this.allStatsLoading = true;
    this.allStatsError = null;
    this.disasterSvc.getAllStats().subscribe({
      next: (list) => {
        this.allStats = list;
        this.allStatsLoading = false;
      },
      error: (err) => {
        this.allStatsError = err?.error?.message ?? 'Failed to load stats.';
        this.allStatsLoading = false;
      },
    });
  }

  searchByAlert(): void {
    if (this.alertId == null) return;
    this.alertLoading = true;
    this.alertError = null;
    this.alertStats = [];
    this.latestAlertStat = null;

    this.disasterSvc.getStatsByAlert(this.alertId).subscribe({
      next: (list) => (this.alertStats = list),
      error: (err) =>
        (this.alertError = this.extractError(err, 'No stats for this alert.')),
    });

    this.disasterSvc.getLatestStatsByAlert(this.alertId).subscribe({
      next: (s) => {
        this.latestAlertStat = s;
        this.alertLoading = false;
      },
      error: (err) => {
        this.alertError = this.extractError(err, 'No stats for this alert.');
        this.alertLoading = false;
      },
    });
  }

  searchVolunteer(): void {
    if (this.volunteerId == null) return;
    this.volunteerLoading = true;
    this.volunteerError = null;
    this.volunteerStats = null;
    this.volunteerSvc.getLatestVolunteerStats(this.volunteerId).subscribe({
      next: (s) => {
        this.volunteerStats = s;
        this.volunteerLoading = false;
      },
      error: (err) => {
        this.volunteerError = this.extractError(err, 'Volunteer not found.');
        this.volunteerLoading = false;
      },
    });
  }

  searchOrg(): void {
    if (this.orgId == null) return;
    this.orgLoading = true;
    this.orgError = null;
    this.orgStats = null;
    this.volunteerSvc.getLatestOrganisationStats(this.orgId).subscribe({
      next: (s) => {
        this.orgStats = s;
        this.orgLoading = false;
      },
      error: (err) => {
        this.orgError = this.extractError(err, 'Organisation not found.');
        this.orgLoading = false;
      },
    });
  }

  searchChurn(): void {
    if (this.churnVolunteerId == null) return;
    this.churnLoading = true;
    this.churnError = null;
    this.churnPrediction = null;
    this.volunteerSvc.getLatestPredictionByVolunteer(this.churnVolunteerId).subscribe({
      next: (p) => {
        this.churnPrediction = p;
        this.churnLoading = false;
      },
      error: (err) => {
        this.churnError = this.extractError(err, 'No churn prediction found.');
        this.churnLoading = false;
      },
    });
  }

  private extractError(err: unknown, fallback: string): string {
    const e = err as { error?: { message?: string }; message?: string };
    return e?.error?.message ?? e?.message ?? fallback;
  }
}
