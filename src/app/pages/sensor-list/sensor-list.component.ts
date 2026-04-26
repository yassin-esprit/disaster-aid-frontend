import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SensorService } from '../../core/services/sensor.service';
import { AuthService } from '../../core/services/auth.service';
import { Sensor } from '../../shared/models/sensor.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

const ADMIN_ROLES = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN', 'ADMIN'];

@Component({
  selector: 'app-sensor-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent],
  template: `
    <div class="p-6 space-y-6">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black tracking-tight">Sensors</h1>
          <p class="text-sm text-on-surface-variant mt-1">
            {{ filtered.length }} sensor{{ filtered.length !== 1 ? 's' : '' }}
            <span *ngIf="searchTerm || statusFilter"> matching your filters</span>
          </p>
        </div>
        <a *ngIf="isAdmin" [routerLink]="basePath + '/new'"
           class="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(108,92,231,0.4)] transition-all active:scale-95 self-start">
          <span class="material-symbols-outlined text-sm">add</span> Add Sensor
        </a>
      </div>

      <!-- Filter bar -->
      <div class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-[200px] flex items-center gap-2 glass-1 px-4 py-2 rounded-xl border border-white/10">
          <span class="material-symbols-outlined text-sm text-on-surface-variant">search</span>
          <input [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()"
                 placeholder="Search by name or manufacturer…"
                 class="bg-transparent text-sm outline-none flex-1 text-on-surface placeholder:text-on-surface-variant" />
        </div>
        <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()"
                class="glass-1 px-4 py-2 rounded-xl border border-white/10 text-sm text-on-surface bg-transparent outline-none">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="OFFLINE">Offline</option>
          <option value="FAULTY">Faulty</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
        <select [(ngModel)]="typeFilter" (ngModelChange)="applyFilters()"
                class="glass-1 px-4 py-2 rounded-xl border border-white/10 text-sm text-on-surface bg-transparent outline-none">
          <option value="">All Types</option>
          <option value="SEISMIC">Seismic</option>
          <option value="FLOOD_GAUGE">Flood Gauge</option>
          <option value="WEATHER">Weather</option>
          <option value="AIR_QUALITY">Air Quality</option>
          <option value="FIRE_SMOKE">Fire / Smoke</option>
        </select>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto glass-1 rounded-2xl border border-white/5">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-white/10 text-xs uppercase tracking-widest text-on-surface-variant">
            <tr>
              <th class="px-5 py-4">Name</th>
              <th class="px-5 py-4">Type</th>
              <th class="px-5 py-4">Manufacturer</th>
              <th class="px-5 py-4">Status</th>
              <th class="px-5 py-4">Last Ping</th>
              <th class="px-5 py-4">Calibration</th>
              <th class="px-5 py-4"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of filtered"
                class="border-b border-white/5 hover:bg-white/5 transition-colors group">
              <td class="px-5 py-4 font-semibold text-on-surface">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                       [ngClass]="typeIconBg(s.type)">
                    <span class="material-symbols-outlined text-sm" [ngClass]="typeIconColor(s.type)">
                      {{ typeIcon(s.type) }}
                    </span>
                  </div>
                  {{ s.name }}
                </div>
              </td>
              <td class="px-5 py-4 text-on-surface-variant font-mono text-xs">{{ s.type }}</td>
              <td class="px-5 py-4 text-on-surface-variant">{{ s.manufacturer || '—' }}</td>
              <td class="px-5 py-4">
                <app-status-badge [status]="s.status"></app-status-badge>
              </td>
              <td class="px-5 py-4 text-on-surface-variant text-xs">
                <span *ngIf="s.lastPingAt; else noPing">{{ s.lastPingAt | date:'dd MMM, HH:mm' }}</span>
                <ng-template #noPing><span class="text-error/70">Never</span></ng-template>
              </td>
              <td class="px-5 py-4 text-on-surface-variant text-xs">{{ s.calibrationDate | date:'dd MMM yyyy' }}</td>
              <td class="px-5 py-4">
                <a [routerLink]="[basePath, s.id]"
                   class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-primary text-xs font-bold">
                  View <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
              </td>
            </tr>
            <tr *ngIf="filtered.length === 0">
              <td colspan="7" class="px-5 py-12 text-center text-on-surface-variant">
                <span class="material-symbols-outlined text-4xl block mb-2">sensors_off</span>
                No sensors found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class SensorListComponent implements OnInit {
  sensors: Sensor[]  = [];
  filtered: Sensor[] = [];
  searchTerm   = '';
  statusFilter = '';
  typeFilter   = '';
  isAdmin      = false;
  basePath     = '/sensors';

  constructor(
    private sensorService: SensorService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const role = (this.authService.getRole() || '').trim().toUpperCase();
    this.isAdmin  = ADMIN_ROLES.includes(role);
    this.basePath = this.isAdmin ? '/admin/sensors' : '/sensors';

    this.sensorService.getAllSensors().subscribe(data => {
      this.sensors  = data;
      this.filtered = data;
    });
  }

  applyFilters(): void {
    this.filtered = this.sensors.filter(s => {
      const matchSearch = !this.searchTerm ||
        s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (s.manufacturer || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.statusFilter || s.status === this.statusFilter;
      const matchType   = !this.typeFilter   || s.type   === this.typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      SEISMIC: 'earthquake', FLOOD_GAUGE: 'water', WEATHER: 'thunderstorm',
      AIR_QUALITY: 'air', FIRE_SMOKE: 'local_fire_department'
    };
    return map[type] ?? 'sensors';
  }
  typeIconBg(type: string): string {
    const map: Record<string, string> = {
      SEISMIC: 'bg-orange-500/20', FLOOD_GAUGE: 'bg-blue-500/20', WEATHER: 'bg-sky-500/20',
      AIR_QUALITY: 'bg-green-500/20', FIRE_SMOKE: 'bg-red-500/20'
    };
    return map[type] ?? 'bg-white/10';
  }
  typeIconColor(type: string): string {
    const map: Record<string, string> = {
      SEISMIC: 'text-orange-400', FLOOD_GAUGE: 'text-blue-400', WEATHER: 'text-sky-400',
      AIR_QUALITY: 'text-green-400', FIRE_SMOKE: 'text-red-400'
    };
    return map[type] ?? 'text-white';
  }
}
