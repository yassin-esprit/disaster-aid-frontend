// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

import { SensorService } from '../../core/services/sensor.service';
import { AlertService } from '../../core/services/alert.service';
import { EvacuationService } from '../../core/services/evacuation.service';
import { IncidentService, IncidentReport, StatusHistory } from '../../core/services/incident.service';
import { CoordinationService, HelpRequest, TaskAssignment,
  CoordinationStats, VolunteerMatch } from '../../core/services/coordination.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ── Stats from coordination service ──────────────────
  stats: CoordinationStats | null = null;

  // ── Incidents ─────────────────────────────────────────
  incidents: IncidentReport[] = [];
  filteredIncidents: IncidentReport[] = [];
  incidentFilter = 'ALL';
  incidentSearch = '';
  expandedIncidentId: number | null = null;
  historyMap: Record<number, StatusHistory[] | undefined> = {};
  incidentLoading = true;

  // ── Help Requests ─────────────────────────────────────
  requests: HelpRequest[] = [];
  filteredRequests: HelpRequest[] = [];
  requestFilter = 'ALL';
  requestSearch = '';
  expandedRequestId: number | null = null;
  assignmentsMap: Record<number, TaskAssignment[] | undefined> = {};
  requestLoading = true;

  // ── Live sensor/alert/routes data ────────────────────
  totalSensors = 0;
  activeSensors = 0;
  offlineSensors = 0;
  activeAlerts = 0;
  criticalAlerts = 0;
  activeRoutes = 0;
  anomaliesCount = 0;

  // ── Live alerts feed ─────────────────────────────────
  recentAlerts: any[] = [];

  // ── Static dashboard data (kept from original) ───────
  readonly notifications = [
    { color: 'bg-secondary', time: '2 min ago',  message: 'Scheduler: 3 geofence zones expired and were flagged.' },
    { color: 'bg-primary',   time: '8 min ago',  message: 'New evacuation route activated for alert #12.' },
    { color: 'bg-amber-500', time: '15 min ago', message: 'Sensor SEISMIC-04 has gone offline (no ping).' },
    { color: 'bg-error',     time: '1 hr ago',   message: 'CRITICAL alert auto-triggered — Flood Gauge threshold exceeded.' }
  ];

  readonly systemStatus = [
    { label: 'JWT Auth',         status: 'Online',   color: 'text-green-400' },
    { label: 'WebSocket',        status: 'Live',     color: 'text-green-400' },
    { label: 'Cache (Caffeine)', status: 'Active',   color: 'text-green-400' },
    { label: 'Scheduler',        status: 'Running',  color: 'text-green-400' },
    { label: 'PostGIS Spatial',  status: 'Ready',    color: 'text-green-400' }
  ];

  readonly impactBars = [
    { label: 'Civic Engagement', value: 82 },
    { label: 'Crisis Response',  value: 45 },
    { label: 'Social Support',   value: 67 }
  ];

  // ── Quick links ──────────────────────────────────────
  readonly quickLinks = [
    { label: 'Add Sensor',     icon: 'sensors',     route: '/sensors/new',    color: 'text-secondary' },
    { label: 'Create Alert',   icon: 'add_alert',   route: '/alerts/new',     color: 'text-error' },
    { label: 'New Route',      icon: 'add_road',    route: '/evacuation/new', color: 'text-primary' },
    { label: 'Geofence Zones', icon: 'map',         route: '/geofence',       color: 'text-amber-400' }
  ];

  // ── Delete confirm ────────────────────────────────────
  deleteTarget: { type: 'incident' | 'request'; id: number } | null = null;

  // ── Assign modal ──────────────────────────────────────
  assigningToRequestId: number | null = null;
  matchesForRequest: VolunteerMatch[] = [];
  loadingMatches = false;
  assignResponderId: number | null = null;
  assignNotes = '';
  assignError = '';

  // ── Active tab ────────────────────────────────────────
  activeTab: string = 'overview';

  // ── Status/urgency helpers ───────────────────────────
  incidentStatuses = ['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'ESCALATED'];
  requestStatuses  = ['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];

  severityBadge: Record<string, string> = {
    LOW:      'bg-secondary/10 text-secondary border-secondary/20',
    MEDIUM:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    HIGH:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-error/20 text-error border-error/30'
  };

  urgencyColors = ['', 'bg-secondary', 'bg-secondary', 'bg-amber-400', 'bg-orange-400', 'bg-error'];

  // ── Private subscriptions ────────────────────────────
  private liveDataSub?: Subscription;

  // ── Single constructor ────────────────────────────────
  constructor(
    private sensorService: SensorService,
    private alertService: AlertService,
    private evacuationService: EvacuationService,
    private incSvc: IncidentService,
    private coordSvc: CoordinationService,
    private route: ActivatedRoute
  ) {}

  // ── Lifecycle hooks ───────────────────────────────────
  ngOnInit(): void {
    // Read optional tab from route data
    const routeTab = this.route.snapshot.data['tab'];
    if (routeTab && ['overview', 'incidents', 'coordination'].includes(routeTab)) {
      this.activeTab = routeTab;
    }

    // Load data from coordination/incident services
    this.loadStats();
    this.loadIncidents();
    this.loadRequests();

    // Auto-refresh live sensor/alert/routes every 30 seconds
    this.liveDataSub = interval(30_000).pipe(
      startWith(0),
      switchMap(() => forkJoin({
        sensors: this.sensorService.getAllSensors(),
        alerts:  this.alertService.getAllAlerts(),
        routes:  this.evacuationService.getAllRoutes()
      }))
    ).subscribe(({ sensors, alerts, routes }) => {
      this.totalSensors   = sensors.length;
      this.activeSensors  = sensors.filter(s => s.status === 'ACTIVE').length;
      this.offlineSensors = sensors.filter(s => s.status === 'OFFLINE').length;

      this.activeAlerts   = alerts.filter(a => a.status === 'ACTIVE').length;
      this.criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

      this.activeRoutes   = routes.filter(r => r.status === 'ACTIVE').length;

      // Recent 4 alerts sorted newest first
      this.recentAlerts = [...alerts]
        .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
        .slice(0, 4)
        .map(a => ({
          ...a,
          icon:          this.alertIcon(a.disasterType),
          iconBg:        this.alertIconBg(a.severity),
          severityClass: this.severityClass(a.severity),
          borderClass:   this.borderClass(a.severity)
        }));
    });
  }

  ngOnDestroy(): void {
    this.liveDataSub?.unsubscribe();
  }

  // ── Getter for stat cards (avoid name conflict with `stats`) ──
  get statsCards() {
    return [
      {
        label: 'Active Sensors',
        value: this.activeSensors,
        subLabel: `${this.offlineSensors} offline`,
        icon: 'sensors',
        iconBg: 'bg-secondary/20',
        iconColor: 'text-secondary',
        trend: this.offlineSensors > 0 ? `⚠ ${this.offlineSensors} need attention` : '✓ All sensors online',
        trendColor: this.offlineSensors > 0 ? 'text-amber-400' : 'text-green-400'
      },
      {
        label: 'Active Alerts',
        value: this.activeAlerts,
        subLabel: `${this.criticalAlerts} critical`,
        icon: 'emergency',
        iconBg: 'bg-error/20',
        iconColor: 'text-error',
        trend: this.criticalAlerts > 0 ? `🔴 ${this.criticalAlerts} critical active` : '✓ No critical alerts',
        trendColor: this.criticalAlerts > 0 ? 'text-error' : 'text-green-400'
      },
      {
        label: 'Active Routes',
        value: this.activeRoutes,
        subLabel: 'evacuation routes',
        icon: 'directions',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        trend: this.activeRoutes > 0 ? `${this.activeRoutes} route(s) operational` : 'No active evacuations',
        trendColor: this.activeRoutes > 0 ? 'text-primary' : 'text-on-surface-variant'
      },
      {
        label: 'Anomalies',
        value: this.anomaliesCount,
        subLabel: 'detected readings',
        icon: 'troubleshoot',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        trend: this.anomaliesCount > 0 ? `${this.anomaliesCount} anomalous readings` : '✓ All readings normal',
        trendColor: this.anomaliesCount > 0 ? 'text-amber-400' : 'text-green-400'
      }
    ];
  }

  // ── Data loading methods ──────────────────────────────
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

  // ── Filter methods ────────────────────────────────────
  applyIncidentFilters(): void {
    this.filteredIncidents = this.incidents.filter(r => {
      const statusMatch = this.incidentFilter === 'ALL' || r.status === this.incidentFilter;
      const searchMatch = !this.incidentSearch ||
        r.disasterType?.toLowerCase().includes(this.incidentSearch.toLowerCase()) ||
        r.location?.toLowerCase().includes(this.incidentSearch.toLowerCase());
      return statusMatch && searchMatch;
    });
  }

  applyRequestFilters(): void {
    this.filteredRequests = this.requests.filter(r => {
      const statusMatch = this.requestFilter === 'ALL' || r.status === this.requestFilter;
      const searchMatch = !this.requestSearch ||
        r.type?.toLowerCase().includes(this.requestSearch.toLowerCase()) ||
        r.location?.toLowerCase().includes(this.requestSearch.toLowerCase());
      return statusMatch && searchMatch;
    });
  }

  // ── Incident actions ──────────────────────────────────
  updateIncidentStatus(id: number, status: string): void {
    this.incSvc.updateStatus(id, status).subscribe({
      next: updated => {
        const idx = this.incidents.findIndex(x => x.id === id);
        if (idx !== -1) this.incidents[idx] = updated as IncidentReport;
        this.applyIncidentFilters();
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

  // ── Request actions ───────────────────────────────────
  updateRequestStatus(id: number, status: string): void {
    const req = this.requests.find(x => x.id === id);
    if (!req) return;
    this.coordSvc.updateRequest(id, { ...req, status }).subscribe({
      next: updated => {
        const idx = this.requests.findIndex(x => x.id === id);
        if (idx !== -1) this.requests[idx] = updated;
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

  // ── Assign modal ──────────────────────────────────────
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
        this.coordSvc.getAssignmentsByRequest(reqId).subscribe(a => this.assignmentsMap[reqId] = a);
        this.closeAssignModal();
      },
      error: () => this.assignError = 'Assignment failed.'
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
        this.coordSvc.getAssignmentsByRequest(reqId).subscribe(a => this.assignmentsMap[reqId] = a);
        this.closeAssignModal();
      },
      error: () => this.assignError = 'Assignment failed.'
    });
  }

  // ── Delete ────────────────────────────────────────────
  confirmDelete(type: 'incident' | 'request', id: number): void {
    this.deleteTarget = { type, id };
  }

  doDelete(): void {
    if (!this.deleteTarget) return;
    if (this.deleteTarget.type === 'incident') {
      this.incSvc.delete(this.deleteTarget.id).subscribe({
        next: () => { this.deleteTarget = null; this.loadIncidents(); }
      });
    } else {
      this.coordSvc.deleteRequest(this.deleteTarget.id).subscribe({
        next: () => { this.deleteTarget = null; this.loadRequests(); }
      });
    }
  }

  // ── Template helpers ──────────────────────────────────
  credColor(score?: number): string {
    if (!score) return 'text-on-surface-variant';
    return score >= 0.8 ? 'text-secondary' : score >= 0.5 ? 'text-amber-400' : 'text-error';
  }

  getUrgencyDotClass(urgency: number, dotIndex: number): string {
    return dotIndex < urgency ? this.urgencyColors[urgency] || 'bg-on-surface-variant' : 'bg-white/10';
  }

  getPendingIncidentCount(): number {
    return this.incidents.filter(i => i.status === 'PENDING').length;
  }

  getOpenRequestCount(): number {
    return this.requests.filter(r => r.status === 'OPEN').length;
  }

  getTimelineIcon(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'schedule', VERIFIED: 'check', REJECTED: 'close', ESCALATED: 'arrow_upward'
    };
    return map[status] || 'circle';
  }

  getTimelineDotStyle(status: string): string {
    const map: Record<string, string> = {
      PENDING:   'background:rgba(245,158,11,0.8)',
      VERIFIED:  'background:rgba(105,156,255,0.8)',
      REJECTED:  'background:rgba(255,110,132,0.8)',
      ESCALATED: 'background:rgba(249,115,22,0.8)'
    };
    return map[status] || 'background:rgba(255,255,255,0.2)';
  }

  getStatusPill(status: string): string {
    const map: Record<string, string> = {
      PENDING:   'background:rgba(245,158,11,0.15);color:#fbbf24',
      VERIFIED:  'background:rgba(105,156,255,0.15);color:#699cff',
      REJECTED:  'background:rgba(255,110,132,0.15);color:#ff6e84',
      ESCALATED: 'background:rgba(249,115,22,0.15);color:#fb923c'
    };
    return map[status] || 'background:rgba(255,255,255,0.05);color:#94a3b8';
  }

  // ── Alert icons and styling ───────────────────────────
  alertIcon(type: string): string {
    const map: Record<string, string> = {
      FLOOD: 'water', EARTHQUAKE: 'earthquake', WILDFIRE: 'local_fire_department',
      LANDSLIDE: 'landslide', STORM: 'thunderstorm', CHEMICAL: 'science'
    };
    return map[type] ?? 'emergency';
  }

  alertIconBg(severity: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'bg-error/20 text-error',
      HIGH: 'bg-orange-500/20 text-orange-400',
      MODERATE: 'bg-amber-500/20 text-amber-400',
      LOW: 'bg-green-500/20 text-green-400'
    };
    return map[severity] ?? 'bg-white/10 text-white';
  }

  severityClass(severity: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'bg-error text-white',
      HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      MODERATE: 'bg-amber-500/20 text-amber-400',
      LOW: 'bg-green-500/20 text-green-400'
    };
    return map[severity] ?? '';
  }

  borderClass(severity: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'border-error',
      HIGH: 'border-orange-500',
      MODERATE: 'border-amber-500',
      LOW: 'border-green-500'
    };
    return map[severity] ?? 'border-white/10';
  }
}
