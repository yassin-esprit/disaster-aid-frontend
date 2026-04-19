// src/app/pages/alert-list/alert-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../core/services/alert.service';
import { Alert } from '../../shared/models/sensor.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent],
  template: `
    <div class="p-6 space-y-6">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black tracking-tight">Alerts</h1>
          <p class="text-sm text-on-surface-variant mt-1">
            {{ filtered.length }} alert{{ filtered.length !== 1 ? 's' : '' }}
          </p>
        </div>
        <a routerLink="/alerts/new"
           class="flex items-center gap-2 bg-error/20 border border-error/30 text-error px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-error/30 transition-all active:scale-95 self-start">
          <span class="material-symbols-outlined text-sm">add_alert</span> Create Alert
        </a>
      </div>

      <!-- Filter bar -->
      <div class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-[200px] flex items-center gap-2 glass-1 px-4 py-2 rounded-xl border border-white/10">
          <span class="material-symbols-outlined text-sm text-on-surface-variant">search</span>
          <input [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()"
                 placeholder="Search by title or type…"
                 class="bg-transparent text-sm outline-none flex-1 text-on-surface placeholder:text-on-surface-variant" />
        </div>
        <select [(ngModel)]="severityFilter" (ngModelChange)="applyFilters()"
                class="glass-1 px-4 py-2 rounded-xl border border-white/10 text-sm text-on-surface bg-transparent outline-none">
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MODERATE">Moderate</option>
          <option value="LOW">Low</option>
        </select>
        <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()"
                class="glass-1 px-4 py-2 rounded-xl border border-white/10 text-sm text-on-surface bg-transparent outline-none">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="MONITORING">Monitoring</option>
          <option value="RESOLVED">Resolved</option>
          <option value="FALSE_ALARM">False Alarm</option>
        </select>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto glass-1 rounded-2xl border border-white/5">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-white/10 text-xs uppercase tracking-widest text-on-surface-variant">
          <tr>
            <th class="px-5 py-4">Alert</th>
            <th class="px-5 py-4">Disaster Type</th>
            <th class="px-5 py-4">Severity</th>
            <th class="px-5 py-4">Status</th>
            <th class="px-5 py-4">Issued</th>
            <th class="px-5 py-4">Confidence</th>
            <th class="px-5 py-4"></th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let a of filtered"
              class="border-b border-white/5 hover:bg-white/5 transition-colors group"
              [ngClass]="rowClass(a.severity)">
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                     [ngClass]="disasterIconBg(a.disasterType)">
                    <span class="material-symbols-outlined text-sm" [ngClass]="disasterIconColor(a.disasterType)">
                      {{ disasterIcon(a.disasterType) }}
                    </span>
                </div>
                <div>
                  <p class="font-semibold text-on-surface">{{ a.title || 'Untitled Alert' }}</p>
                  <p class="text-xs text-on-surface-variant">{{ a.description | slice:0:50 }}{{ (a.description?.length ?? 0) > 50 ? '…' : '' }}</p>
                </div>
              </div>
            </td>
            <td class="px-5 py-4 font-mono text-xs text-on-surface-variant">{{ a.disasterType }}</td>
            <td class="px-5 py-4">
                <span class="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider"
                      [ngClass]="severityClass(a.severity)">{{ a.severity }}</span>
            </td>
            <td class="px-5 py-4">
              <app-status-badge [status]="a.status"></app-status-badge>
            </td>
            <td class="px-5 py-4 text-on-surface-variant text-xs">{{ a.issuedAt | date:'dd MMM, HH:mm' }}</td>
            <td class="px-5 py-4 text-on-surface-variant text-xs">
              <span *ngIf="a.confidenceScore != null">{{ (a.confidenceScore * 100).toFixed(0) }}%</span>
              <span *ngIf="a.confidenceScore == null">—</span>
            </td>
            <td class="px-5 py-4">
              <a [routerLink]="['/alerts', a.id]"
                 class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-primary text-xs font-bold">
                View <span class="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </td>
          </tr>
          <tr *ngIf="filtered.length === 0">
            <td colspan="7" class="px-5 py-12 text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-4xl block mb-2">check_circle</span>
              No alerts found
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AlertListComponent implements OnInit {
  alerts: Alert[]  = [];
  filtered: Alert[] = [];
  searchTerm     = '';
  severityFilter = '';
  statusFilter   = '';

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.alertService.getAllAlerts().subscribe(data => {
      this.alerts   = data;
      this.filtered = data;
    });
  }

  applyFilters(): void {
    this.filtered = this.alerts.filter(a => {
      const matchSearch   = !this.searchTerm     ||
        (a.title || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        a.disasterType.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchSeverity = !this.severityFilter || a.severity     === this.severityFilter;
      const matchStatus   = !this.statusFilter   || a.status       === this.statusFilter;
      return matchSearch && matchSeverity && matchStatus;
    });
  }

  rowClass(severity: string): string {
    return severity === 'CRITICAL' ? 'border-l-2 border-l-error' :
      severity === 'HIGH'     ? 'border-l-2 border-l-orange-500' : '';
  }

  severityClass(severity: string): string {
    return {
      CRITICAL: 'bg-error text-white',
      HIGH:     'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      MODERATE: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      LOW:      'bg-green-500/20 text-green-400 border border-green-500/30',
    }[severity] ?? 'bg-white/10 text-white';
  }

  disasterIcon(type: string): string {
    const m: Record<string,string> = {
      FLOOD: 'water', EARTHQUAKE: 'earthquake', WILDFIRE: 'local_fire_department',
      LANDSLIDE: 'landslide', STORM: 'thunderstorm', CHEMICAL: 'science'
    };
    return m[type] ?? 'emergency';
  }
  disasterIconBg(type: string): string {
    const m: Record<string,string> = {
      FLOOD: 'bg-blue-500/20', EARTHQUAKE: 'bg-orange-500/20', WILDFIRE: 'bg-red-500/20',
      LANDSLIDE: 'bg-amber-500/20', STORM: 'bg-sky-500/20', CHEMICAL: 'bg-purple-500/20'
    };
    return m[type] ?? 'bg-white/10';
  }
  disasterIconColor(type: string): string {
    const m: Record<string,string> = {
      FLOOD: 'text-blue-400', EARTHQUAKE: 'text-orange-400', WILDFIRE: 'text-red-400',
      LANDSLIDE: 'text-amber-400', STORM: 'text-sky-400', CHEMICAL: 'text-purple-400'
    };
    return m[type] ?? 'text-white';
  }
}
