import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CoordinationService,
  HelpRequest,
  TaskAssignment,
} from '../../../core/services/coordination.service';

@Component({
  selector: 'app-admin-coordination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-coordination.component.html',
})
export class AdminCoordinationComponent implements OnInit {
  requests: HelpRequest[] = [];
  filtered: HelpRequest[] = [];
  assignmentsMap: Record<number, TaskAssignment[]> = {};
  isLoading = true;
  errorMessage = '';
  expandedId: number | null = null;
  statusFilter = 'ALL';
  typeFilter = 'ALL';

  statuses = [
    'ALL',
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'CANCELLED',
  ];
  types = [
    'ALL',
    'RESCUE',
    'MEDICAL',
    'EVACUATION',
    'SUPPLY',
    'SHELTER',
    'TECHNICAL',
  ];

  statusBadge: Record<string, string> = {
    OPEN: 'bg-secondary/10 text-secondary border-secondary/20',
    ASSIGNED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    IN_PROGRESS: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CANCELLED: 'bg-error/10 text-error border-error/20',
  };

  aStatusBadge: Record<string, string> = {
    ASSIGNED: 'bg-amber-500/10 text-amber-400',
    ACCEPTED: 'bg-blue-500/10 text-blue-400',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400',
    REJECTED: 'bg-error/10 text-error',
    ABANDONED: 'bg-slate-500/10 text-slate-400',
  };

  urgencyColor = [
    '',
    'text-secondary',
    'text-secondary',
    'text-amber-400',
    'text-orange-400',
    'text-error',
  ];

  constructor(private svc: CoordinationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.svc.getAllRequests().subscribe({
      next: (d) => {
        this.requests = d;
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
    this.filtered = this.requests.filter((r) => {
      const s = this.statusFilter === 'ALL' || r.status === this.statusFilter;
      const t = this.typeFilter === 'ALL' || r.type === this.typeFilter;
      return s && t;
    });
  }

  toggle(id: number): void {
    if (this.expandedId === id) {
      this.expandedId = null;
      return;
    }
    this.expandedId = id;
    if (!this.assignmentsMap[id]) {
      this.svc
        .getAssignmentsByRequest(id)
        .subscribe((a) => (this.assignmentsMap[id] = a));
    }
  }

  updateRequestStatus(id: number, status: string): void {
    const r = this.requests.find((x) => x.id === id);
    if (!r) return;
    this.svc.updateRequest(id, { ...r, status }).subscribe({
      next: (updated) => {
        const i = this.requests.findIndex((x) => x.id === id);
        this.requests[i] = updated;
        this.applyFilters();
      },
    });
  }

  updateAssignStatus(id: number, status: string, reqId: number): void {
    this.svc.updateAssignmentStatus(id, status).subscribe(() => {
      this.svc
        .getAssignmentsByRequest(reqId)
        .subscribe((a) => (this.assignmentsMap[reqId] = a));
    });
  }

  deleteRequest(id: number): void {
    if (!confirm('Delete this request and all assignments?')) return;
    this.svc.deleteRequest(id).subscribe({ next: () => this.load() });
  }
}
