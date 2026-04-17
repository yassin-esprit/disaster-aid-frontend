import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IncidentService, IncidentReport } from '../../../core/services/incident.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './incident-list.component.html'
})
export class IncidentListComponent implements OnInit {

  reports: IncidentReport[] = [];
  filtered: IncidentReport[] = [];
  isLoading = true;
  errorMessage = '';
  activeFilter = 'ALL';
  deleteConfirmId: number | null = null;
  upvotedIds = new Set<number>();

  filters = ['ALL','PENDING','VERIFIED','REJECTED','ESCALATED'];

  severityBorder: Record<string,string> = {
    LOW:      'border-l-secondary',
    MEDIUM:   'border-l-amber-400',
    HIGH:     'border-l-error',
    CRITICAL: 'border-l-error'
  };

  severityIcon: Record<string,string> = {
    FLOOD: 'water', EARTHQUAKE: 'crisis_alert',
    WILDFIRE: 'local_fire_department', HURRICANE: 'tornado',
    TSUNAMI: 'waves', DROUGHT: 'wb_sunny'
  };

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('upvotedIncidents');
    if (stored) this.upvotedIds = new Set(JSON.parse(stored));
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.incidentService.getAll().subscribe({
      next: data => {
        this.reports = data;
        this.applyFilter(this.activeFilter);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load reports. Is the backend running?';
        this.isLoading = false;
      }
    });
  }

  applyFilter(f: string): void {
    this.activeFilter = f;
    this.filtered = f === 'ALL' ? this.reports : this.reports.filter(r => r.status === f);
  }

  upvote(id: number, event: Event): void {
    event.stopPropagation();
    if (this.upvotedIds.has(id)) return;
    this.incidentService.upvote(id).subscribe({
      next: updated => {
        const i = this.reports.findIndex(r => r.id === id);
        if (i !== -1) this.reports[i] = updated;
        this.applyFilter(this.activeFilter);
        this.upvotedIds.add(id);
        localStorage.setItem('upvotedIncidents', JSON.stringify([...this.upvotedIds]));
      }
    });
  }

  credibilityColor(score: number | undefined): string {
    if (!score) return 'text-on-surface-variant';
    if (score >= 0.8) return 'text-secondary';
    if (score >= 0.5) return 'text-amber-400';
    return 'text-error';
  }

  credibilityLabel(score: number | undefined): string {
    if (!score) return 'Unscored';
    if (score >= 0.8) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  }

  confirmDelete(id: number): void { this.deleteConfirmId = id; }
  cancelDelete(): void { this.deleteConfirmId = null; }

  doDelete(): void {
    if (!this.deleteConfirmId) return;
    this.incidentService.delete(this.deleteConfirmId).subscribe({
      next: () => { this.deleteConfirmId = null; this.load(); },
      error: () => { this.errorMessage = 'Delete failed.'; this.deleteConfirmId = null; }
    });
  }

  getIcon(type: string): string { return this.severityIcon[type] || 'warning'; }
  getBorder(severity: string): string { return this.severityBorder[severity] || 'border-l-outline'; }
}
