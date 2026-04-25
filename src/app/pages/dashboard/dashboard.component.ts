// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthenticatedLayoutComponent } from '../../layouts/authenticated-layout/authenticated-layout.component';
import { SensorService } from '../../core/services/sensor.service';
import { AlertService } from '../../core/services/alert.service';
import { EvacuationService } from '../../core/services/evacuation.service';
import { forkJoin, interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthenticatedLayoutComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ── Live stats ──────────────────────────────────────────────────────────────
  totalSensors  = 0;
  activeSensors = 0;
  offlineSensors = 0;
  activeAlerts  = 0;
  criticalAlerts = 0;
  activeRoutes  = 0;
  anomaliesCount = 0;

  // ── Live alerts feed ────────────────────────────────────────────────────────
  recentAlerts: any[] = [];

  // ── Stat cards ───────────────────────────────────────────────────────────────
  get stats() {
    return [
      {
        label: 'Active Sensors',
        value: this.activeSensors,
        subLabel: `${this.offlineSensors} offline`,
        icon: 'sensors',
        iconBg: 'bg-secondary/20',
        iconColor: 'text-secondary',
        trend: this.offlineSensors > 0 ? `⚠ ${this.offlineSensors} need attention` : '✓ All sensors online',
        trendColor: this.offlineSensors > 0 ? 'text-amber-400' : 'text-green-400',
      },
      {
        label: 'Active Alerts',
        value: this.activeAlerts,
        subLabel: `${this.criticalAlerts} critical`,
        icon: 'emergency',
        iconBg: 'bg-error/20',
        iconColor: 'text-error',
        trend: this.criticalAlerts > 0 ? `🔴 ${this.criticalAlerts} critical active` : '✓ No critical alerts',
        trendColor: this.criticalAlerts > 0 ? 'text-error' : 'text-green-400',
      },
      {
        label: 'Active Routes',
        value: this.activeRoutes,
        subLabel: 'evacuation routes',
        icon: 'directions',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        trend: this.activeRoutes > 0 ? `${this.activeRoutes} route(s) operational` : 'No active evacuations',
        trendColor: this.activeRoutes > 0 ? 'text-primary' : 'text-on-surface-variant',
      },
      {
        label: 'Anomalies',
        value: this.anomaliesCount,
        subLabel: 'detected readings',
        icon: 'troubleshoot',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        trend: this.anomaliesCount > 0 ? `${this.anomaliesCount} anomalous readings` : '✓ All readings normal',
        trendColor: this.anomaliesCount > 0 ? 'text-amber-400' : 'text-green-400',
      },
    ];
  }

  // ── Static dashboard data (UX items kept from original) ──────────────────
  readonly notifications = [
    { color: 'bg-secondary', time: '2 min ago',  message: 'Scheduler: 3 geofence zones expired and were flagged.' },
    { color: 'bg-primary',   time: '8 min ago',  message: 'New evacuation route activated for alert #12.' },
    { color: 'bg-amber-500', time: '15 min ago', message: 'Sensor SEISMIC-04 has gone offline (no ping).' },
    { color: 'bg-error',     time: '1 hr ago',   message: 'CRITICAL alert auto-triggered — Flood Gauge threshold exceeded.' },
  ];

  readonly quickLinks = [
    { label: 'Add Sensor',     icon: 'sensors',     route: '/sensors/new',    color: 'text-secondary' },
    { label: 'Create Alert',   icon: 'add_alert',   route: '/alerts/new',     color: 'text-error' },
    { label: 'New Route',      icon: 'add_road',    route: '/evacuation/new', color: 'text-primary' },
    { label: 'Geofence Zones', icon: 'map',         route: '/geofence',       color: 'text-amber-400' },
  ];

  readonly systemStatus = [
    { label: 'JWT Auth',         status: 'Online',   color: 'text-green-400' },
    { label: 'WebSocket',        status: 'Live',     color: 'text-green-400' },
    { label: 'Cache (Caffeine)', status: 'Active',   color: 'text-green-400' },
    { label: 'Scheduler',        status: 'Running',  color: 'text-green-400' },
    { label: 'PostGIS Spatial',  status: 'Ready',    color: 'text-green-400' },
  ];

  private sub?: Subscription;

  constructor(
    private sensorService: SensorService,
    private alertService: AlertService,
    private evacuationService: EvacuationService
  ) {}

  ngOnInit(): void {
    // Auto-refresh every 30 seconds
    this.sub = interval(30_000).pipe(
      startWith(0),
      switchMap(() => forkJoin({
        sensors:    this.sensorService.getAllSensors(),
        alerts:     this.alertService.getAllAlerts(),
        routes:     this.evacuationService.getAllRoutes(),
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
          borderClass:   this.borderClass(a.severity),
        }));
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  alertIcon(type: string): string {
    return { FLOOD: 'water', EARTHQUAKE: 'earthquake', WILDFIRE: 'local_fire_department',
      LANDSLIDE: 'landslide', STORM: 'thunderstorm', CHEMICAL: 'science' }[type] ?? 'emergency';
  }
  alertIconBg(severity: string): string {
    return { CRITICAL: 'bg-error/20 text-error', HIGH: 'bg-orange-500/20 text-orange-400',
      MODERATE: 'bg-amber-500/20 text-amber-400', LOW: 'bg-green-500/20 text-green-400' }[severity] ?? 'bg-white/10 text-white';
  }
  severityClass(severity: string): string {
    return { CRITICAL: 'bg-error text-white', HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      MODERATE: 'bg-amber-500/20 text-amber-400', LOW: 'bg-green-500/20 text-green-400' }[severity] ?? '';
  }
  borderClass(severity: string): string {
    return { CRITICAL: 'border-error', HIGH: 'border-orange-500',
      MODERATE: 'border-amber-500', LOW: 'border-green-500' }[severity] ?? 'border-white/10';
  }
}
