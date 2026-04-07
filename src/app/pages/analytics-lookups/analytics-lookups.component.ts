import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './analytics-lookups.component.html',
})
export class AnalyticsLookupsComponent implements OnInit {
  private disasterSvc = inject(DisasterAnalyticsService);
  private volunteerSvc = inject(VolunteerAnalyticsService);

  // All disaster stats
  allStats: DisasterStatistics[] = [];
  allStatsLoading = false;
  allStatsError: string | null = null;

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
        (this.alertError = err?.error?.message ?? 'No stats for this alert.'),
    });

    this.disasterSvc.getLatestStatsByAlert(this.alertId).subscribe({
      next: (s) => {
        this.latestAlertStat = s;
        this.alertLoading = false;
      },
      error: () => (this.alertLoading = false),
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
        this.volunteerError = err?.error?.message ?? 'Volunteer not found.';
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
        this.orgError = err?.error?.message ?? 'Organisation not found.';
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
        this.churnError = err?.error?.message ?? 'No churn prediction found.';
        this.churnLoading = false;
      },
    });
  }
}
