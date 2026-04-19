import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IncidentService, IncidentReport, StatusHistory } from '../../core/services/incident.service';
import { CoordinationService, HelpRequest, TaskAssignment, CoordinationStats } from '../../core/services/coordination.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  // ── Stats ────────────────────────────────────
  stats: CoordinationStats | null = null;

  // ── Incidents ────────────────────────────────
  incidents: IncidentReport[] = [];
  filteredIncidents: IncidentReport[] = [];
  incidentFilter = 'ALL';
  incidentSearch = '';
  expandedIncidentId: number | null = null;
  historyMap: Record<number, StatusHistory[]> = {};
  incidentLoading = true;

  // ── Help Requests ────────────────────────────
  requests: HelpRequest[] = [];
  filteredRequests: HelpRequest[] = [];
  requestFilter = 'ALL';
  requestSearch = '';
  expandedRequestId: number | null = null;
  assignmentsMap: Record<number, TaskAssignment[]> = {};
  requestLoading = true;

  // ── Active tab ───────────────────────────────
  activeTab: 'overview' | 'incidents' | 'coordination' = 'overview';

  // ── Delete confirm ───────────────────────────
  deleteTarget: { type: 'incident' | 'request'; id: number } | null = null;

  // ── Notification feed ────────────────────────
  notifications = [
    { color: 'bg-secondary', time: '2h ago',  msg: 'Certification "Emergency First Aid" verified.'   },
    { color: 'bg-primary',   time: '5h ago',  msg: 'New request from Hope Shelter matching your skills.' },
    { color: 'bg-error',     time: '1d ago',  msg: 'Flash Flood alert issued for Greater Tunis.'     },
  ];

  impactBars = [
    { label: 'Civic Engagement', value: 82 },
    { label: 'Crisis Response',  value: 45 },
    { label: 'Social Support',   value: 67 },
  ];

  incidentStatuses  = ['ALL','PENDING','VERIFIED','REJECTED','ESCALATED'];
  requestStatuses   = ['ALL','OPEN','ASSIGNED','IN_PROGRESS','RESOLVED','CANCELLED'];

  severityBadge: Record<string,string> = {
    LOW:      'bg-secondary/10 text-secondary border-secondary/20',
    MEDIUM:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    HIGH:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-error/20 text-error border-error/30',
  };

  constructor(
    private incSvc: IncidentService,
    private coordSvc: CoordinationService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadIncidents();
    this.loadRequests();
  }

  // ── Loaders ──────────────────────────────────
  loadStats(): void {
    this.coordSvc.getStats().subscribe({ next: s => this.stats = s });
  }

  loadIncidents(): void {
    this.incidentLoading = true;
    this.incSvc.getAll().subscribe({
      next: d => { this.incidents = d; this.applyIncidentFilters(); this.incidentLoading = false; },
      error: () => this.incidentLoading = false
    });
  }

  loadRequests(): void {
    this.requestLoading = true;
    this.coordSvc.getAllRequests().subscribe({
      next: d => { this.requests = d; this.applyRequestFilters(); this.requestLoading = false; },
      error: () => this.requestLoading = false
    });
  }

  // ── Filters ──────────────────────────────────
  applyIncidentFilters(): void {
    this.filteredIncidents = this.incidents.filter(r => {
      const s = this.incidentFilter === 'ALL' || r.status === this.incidentFilter;
      const q = !this.incidentSearch ||
        r.disasterType?.toLowerCase().includes(this.incidentSearch.toLowerCase()) ||
        r.location?.toLowerCase().includes(this.incidentSearch.toLowerCase());
      return s && q;
    });
  }

  applyRequestFilters(): void {
    this.filteredRequests = this.requests.filter(r => {
      const s = this.requestFilter === 'ALL' || r.status === this.requestFilter;
      const q = !this.requestSearch ||
        r.type?.toLowerCase().includes(this.requestSearch.toLowerCase()) ||
        r.location?.toLowerCase().includes(this.requestSearch.toLowerCase());
      return s && q;
    });
  }

  // ── Incident actions ─────────────────────────
  updateIncidentStatus(id: number, status: string): void {
    this.incSvc.updateStatus(id, status).subscribe({
      next: updated => {
        const i = this.incidents.findIndex(x => x.id === id);
        if (i !== -1) this.incidents[i] = updated as any;
        this.applyIncidentFilters();
        // Refresh history
        this.incSvc.getHistory(id).subscribe(h => this.historyMap[id] = h);
      }
    });
  }

  toggleIncident(id: number): void {
    this.expandedIncidentId = this.expandedIncidentId === id ? null : id;
    if (this.expandedIncidentId === id && !this.historyMap[id]) {
      this.incSvc.getHistory(id).subscribe(h => this.historyMap[id] = h);
    }
  }

  // ── Request actions ──────────────────────────
  updateRequestStatus(id: number, status: string): void {
    const r = this.requests.find(x => x.id === id);
    if (!r) return;
    this.coordSvc.updateRequest(id, { ...r, status }).subscribe({
      next: updated => {
        const i = this.requests.findIndex(x => x.id === id);
        if (i !== -1) this.requests[i] = updated;
        this.applyRequestFilters();
      }
    });
  }

  toggleRequest(id: number): void {
    this.expandedRequestId = this.expandedRequestId === id ? null : id;
    if (this.expandedRequestId === id && !this.assignmentsMap[id]) {
      this.coordSvc.getAssignmentsByRequest(id).subscribe(a => this.assignmentsMap[id] = a);
    }
  }

  updateAssignmentStatus(id: number, status: string, reqId: number): void {
    this.coordSvc.updateAssignmentStatus(id, status).subscribe(() => {
      this.coordSvc.getAssignmentsByRequest(reqId).subscribe(a => this.assignmentsMap[reqId] = a);
    });
  }

  // ── Delete ───────────────────────────────────
  confirmDelete(type: 'incident' | 'request', id: number): void {
    this.deleteTarget = { type, id };
  }

  doDelete(): void {
    if (!this.deleteTarget) return;
    if (this.deleteTarget.type === 'incident') {
      this.incSvc.delete(this.deleteTarget.id).subscribe({ next: () => { this.deleteTarget = null; this.loadIncidents(); } });
    } else {
      this.coordSvc.deleteRequest(this.deleteTarget.id).subscribe({ next: () => { this.deleteTarget = null; this.loadRequests(); } });
    }
  }

  // ── Helpers ──────────────────────────────────
  credColor(score?: number): string {
    if (!score) return 'text-on-surface-variant';
    return score >= 0.8 ? 'text-secondary' : score >= 0.5 ? 'text-amber-400' : 'text-error';
  }

  getTimelineIcon(status: string): string {
    const m: Record<string,string> = { PENDING: 'schedule', VERIFIED: 'check', REJECTED: 'close', ESCALATED: 'arrow_upward' };
    return m[status] || 'circle';
  }

  getTimelineDotStyle(status: string): string {
    const m: Record<string,string> = {
      PENDING: 'background:rgba(245,158,11,0.8)', VERIFIED: 'background:rgba(105,156,255,0.8)',
      REJECTED: 'background:rgba(255,110,132,0.8)', ESCALATED: 'background:rgba(249,115,22,0.8)'
    };
    return m[status] || 'background:rgba(255,255,255,0.2)';
  }

  getStatusPill(status: string): string {
    const m: Record<string,string> = {
      PENDING: 'background:rgba(245,158,11,0.15);color:#fbbf24',
      VERIFIED: 'background:rgba(105,156,255,0.15);color:#699cff',
      REJECTED: 'background:rgba(255,110,132,0.15);color:#ff6e84',
      ESCALATED: 'background:rgba(249,115,22,0.15);color:#fb923c',
    };
    return m[status] || 'background:rgba(255,255,255,0.05);color:#94a3b8';
  }

  urgencyColors: string[] = ['','bg-secondary','bg-secondary','bg-amber-400','bg-orange-400','bg-error'];

  getUrgencyDotClass(urgency: number, dotIndex: number): string {
    return dotIndex < urgency ? this.urgencyColors[urgency] || 'bg-on-surface-variant' : 'bg-white/10';
  }

  getPendingIncidentCount(): number {
    return this.incidents.filter(i => i.status === 'PENDING').length;
  }

  getOpenRequestCount(): number {
    return this.requests.filter(r => r.status === 'OPEN').length;
  }

  // Assign modal state
  assigningToRequestId: number | null = null;
  matchesForRequest: any[] = [];
  loadingMatches = false;
  assignResponderId: number | null = null;
  assignNotes = '';
  assignError = '';

  openAssignModal(requestId: number, event: Event): void {
    event.stopPropagation();
    this.assigningToRequestId = requestId;
    this.assignResponderId = null;
    this.assignNotes = '';
    this.assignError = '';
    this.loadingMatches = true;
    this.matchesForRequest = [];
    this.coordSvc.getMatches(requestId).subscribe({
      next: m => { this.matchesForRequest = m; this.loadingMatches = false; },
      error: () => { this.matchesForRequest = []; this.loadingMatches = false; }
    });
  }

  closeAssignModal(): void {
    this.assigningToRequestId = null;
  }

  submitAssignment(): void {
    if (!this.assigningToRequestId || !this.assignResponderId) {
      this.assignError = 'Please enter a responder ID.';
      return;
    }
    this.coordSvc.createAssignment(
      this.assigningToRequestId,
      { responderId: this.assignResponderId, notes: this.assignNotes }
    ).subscribe({
      next: () => {
        const reqId = this.assigningToRequestId!;
        this.coordSvc.getAssignmentsByRequest(reqId)
          .subscribe(a => this.assignmentsMap[reqId] = a);
        this.closeAssignModal();
      },
      error: () => this.assignError = 'Assignment failed. Check responder ID.'
    });
  }

  assignFromMatch(volunteerId: number): void {
    if (!this.assigningToRequestId) return;
    this.coordSvc.createAssignment(
      this.assigningToRequestId,
      { responderId: volunteerId }
    ).subscribe({
      next: () => {
        const reqId = this.assigningToRequestId!;
        this.coordSvc.getAssignmentsByRequest(reqId)
          .subscribe(a => this.assignmentsMap[reqId] = a);
        this.closeAssignModal();
      },
      error: () => this.assignError = 'Assignment failed.'
    });
  }

}
