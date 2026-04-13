import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IncidentService,
  IncidentReport,
} from '../../../core/services/incident.service';

@Component({
  selector: 'app-admin-incidents',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-incidents.component.html',
})
export class AdminIncidentsComponent implements OnInit {
  reports: IncidentReport[] = [];
  filtered: IncidentReport[] = [];
  isLoading = true;
  errorMessage = '';
  activeFilter = 'ALL';
  expandedId: number | null = null;
  statusFilter = 'ALL';
  severityFilter = 'ALL';

  statuses = ['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'ESCALATED'];
  severities = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  credColor(score: number | undefined): string {
    if (!score) return 'text-on-surface-variant';
    if (score >= 0.8) return 'text-secondary';
    if (score >= 0.5) return 'text-amber-400';
    return 'text-error';
  }

  severityBadge: Record<string, string> = {
    LOW: 'bg-secondary/10 text-secondary border-secondary/20',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-error/20 text-error border-error/30',
  };

  statusBadge: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    VERIFIED: 'bg-secondary/10 text-secondary border-secondary/20',
    REJECTED: 'bg-error/10 text-error border-error/20',
    ESCALATED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };

  constructor(private svc: IncidentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.svc.getAll().subscribe({
      next: (d) => {
        this.reports = d;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Backend unreachable.';
        this.isLoading = false;
      },
    });
  }

  applyFilters(): void {
    this.filtered = this.reports.filter((r) => {
      const s = this.statusFilter === 'ALL' || r.status === this.statusFilter;
      const v =
        this.severityFilter === 'ALL' || r.severity === this.severityFilter;
      return s && v;
    });
  }

  updateStatus(id: number, status: string): void {
    const r = this.reports.find((x) => x.id === id);
    if (!r) return;
    this.svc.update(id, { ...r, status }).subscribe({
      next: (updated) => {
        const i = this.reports.findIndex((x) => x.id === id);
        this.reports[i] = updated;
        this.applyFilters();
      },
      error: () => (this.errorMessage = 'Update failed.'),
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this report?')) return;
    this.svc.delete(id).subscribe({ next: () => this.load() });
  }

  toggle(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }
}
