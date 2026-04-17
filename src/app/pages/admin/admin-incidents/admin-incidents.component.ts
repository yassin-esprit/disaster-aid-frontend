import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { IncidentService, IncidentReport, StatusHistory } from '../../../core/services/incident.service';







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

  historyMap: Record<number, StatusHistory[]> = {};
  loadingHistory = false;

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
    this.svc.updateStatus(id, status).subscribe({
      next: updated => {
        const i = this.reports.findIndex(x => x.id === id);
        if (i !== -1) this.reports[i] = updated as any;
        this.applyFilters();
      },
      error: () => this.errorMessage = 'Update failed.'
    });
  }


  delete(id: number): void {
    if (!confirm('Delete this report?')) return;
    this.svc.delete(id).subscribe({ next: () => this.load() });
  }


  toggle(id: number): void {
    if (this.expandedId === id) { this.expandedId = null; return; }
    this.expandedId = id;
    if (!this.historyMap[id]) {
      this.svc.getHistory(id).subscribe(h => this.historyMap[id] = h);
    }
  }

  getTimelineIcon(status: string): string {
    const map: Record<string, string> = {
      PENDING:   'schedule',
      VERIFIED:  'check',
      REJECTED:  'close',
      ESCALATED: 'arrow_upward',
    };
    return map[status] || 'circle';
  }

  getTimelineDotStyle(status: string): string {
    const map: Record<string, string> = {
      PENDING:   'background:rgba(245,158,11,0.8)',
      VERIFIED:  'background:rgba(105,156,255,0.8)',
      REJECTED:  'background:rgba(255,110,132,0.8)',
      ESCALATED: 'background:rgba(249,115,22,0.8)',
    };
    return map[status] || 'background:rgba(255,255,255,0.2)';
  }

  getStatusStyle(status: string): string {
    const map: Record<string, string> = {
      PENDING:   'background:rgba(245,158,11,0.15);color:#fbbf24',
      VERIFIED:  'background:rgba(105,156,255,0.15);color:#699cff',
      REJECTED:  'background:rgba(255,110,132,0.15);color:#ff6e84',
      ESCALATED: 'background:rgba(249,115,22,0.15);color:#fb923c',
    };
    return map[status] || 'background:rgba(255,255,255,0.05);color:#94a3b8';
  }



}
