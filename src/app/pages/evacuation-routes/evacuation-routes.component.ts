import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EvacuationService } from '../../core/services/evacuation.service';
import { AlertService } from '../../core/services/alert.service';
import { EvacuationRoute } from '../../shared/models/evacuation.model';
import { Alert } from '../../shared/models/sensor.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import * as L from 'leaflet';
import wkt from 'wkt';

@Component({
  selector: 'app-evacuation-routes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent, DecimalPipe],
  template: `
    <div class="p-6 space-y-6">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black tracking-tight">Evacuation Routes</h1>
          <p class="text-sm text-on-surface-variant mt-1">
            {{ filtered.length }} route{{ filtered.length !== 1 ? 's' : '' }}
            <span *ngIf="statusFilter"> · filtered by {{ statusFilter }}</span>
          </p>
        </div>
        <button (click)="toggleForm()"
                class="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(108,92,231,0.4)] transition-all active:scale-95 self-start">
          <span class="material-symbols-outlined text-sm">{{ showForm ? 'close' : 'add_road' }}</span>
          {{ showForm ? 'Cancel' : 'Create Route' }}
        </button>
      </div>

      <!-- Create form with embedded map picker -->
      <div *ngIf="showForm" class="glass-1 rounded-2xl border border-primary/20 p-6 space-y-5">
        <h2 class="text-lg font-bold text-primary">New Evacuation Route</h2>
        <p class="text-xs text-on-surface-variant">
          Pin your <span class="text-amber-400 font-bold">origin</span> and <span class="text-green-400 font-bold">shelter</span> on the map below. The road route will be computed automatically via OSRM.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Alert *</label>
            <select [(ngModel)]="newRoute.alertId"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary">
              <option [ngValue]="null" disabled>Select an alert...</option>
              <option *ngFor="let a of alerts" [ngValue]="a.id">
                {{ a.title || ('Alert #' + a.id) }} — {{ a.disasterType }} · {{ a.severity }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Shelter Name *</label>
            <input type="text" [(ngModel)]="newRoute.shelterName" placeholder="e.g. Shelter El Menzah"
                   class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Capacity (people)</label>
            <input type="number" [(ngModel)]="newRoute.capacity" placeholder="500"
                   class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>

        <!-- Pin mode selector -->
        <div class="flex gap-3">
          <button (click)="pinMode='origin'"
                  class="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                  [ngClass]="pinMode==='origin' ? 'bg-amber-500/20 border-amber-400 text-amber-400' : 'border-white/10 text-on-surface-variant hover:border-white/30'">
            <span class="material-symbols-outlined text-sm align-middle mr-1">my_location</span>
            {{ newRoute.fromLatitude ? ('Origin set (' + (newRoute.fromLatitude|number:\'1.4-4\') + ', ' + (newRoute.fromLongitude|number:\'1.4-4\') + ')') : 'Click map to set Origin' }}
          </button>
          <button (click)="pinMode='shelter'"
                  class="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                  [ngClass]="pinMode==='shelter' ? 'bg-green-500/20 border-green-400 text-green-400' : 'border-white/10 text-on-surface-variant hover:border-white/30'">
            <span class="material-symbols-outlined text-sm align-middle mr-1">home</span>
            {{ newRoute.toLatitude ? ('Shelter set (' + (newRoute.toLatitude|number:\'1.4-4\') + ', ' + (newRoute.toLongitude|number:\'1.4-4\') + ')') : 'Click map to set Shelter' }}
          </button>
        </div>

        <!-- Picker map -->
        <div class="rounded-2xl overflow-hidden border border-white/10 relative" style="height:320px;">
          <div #pickerMap style="height:100%;width:100%;"></div>
          <div class="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <span class="bg-black/75 text-white text-xs px-3 py-1.5 rounded-full">
              {{ pinMode === 'origin' ? '🟡 Click to place Origin point' : '🟢 Click to place Shelter point' }}
            </span>
          </div>
        </div>

        <button (click)="createRoute()" [disabled]="creating"
                class="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:shadow-[0_0_16px_rgba(108,92,231,0.4)] transition-all">
          <span class="material-symbols-outlined text-sm">route</span>
          {{ creating ? 'Computing route via OSRM…' : 'Create & Compute Route' }}
        </button>
        <p *ngIf="formError" class="text-xs text-red-400">{{ formError }}</p>
      </div>

      <!-- Status filter pills -->
      <div class="flex flex-wrap gap-2">
        <button *ngFor="let s of ['', 'PLANNED', 'ACTIVE', 'BLOCKED', 'CLOSED']"
                (click)="statusFilter = s; applyFilters()"
                class="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all"
                [ngClass]="statusFilter === s
                  ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(108,92,231,0.4)]'
                  : 'bg-white/5 text-on-surface-variant hover:bg-white/10'">
          {{ s || 'All' }}
        </button>
      </div>

      <!-- Route cards -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5" *ngIf="filtered.length > 0">
        <div *ngFor="let r of filtered"
             class="glass-1 rounded-2xl border border-white/5 overflow-hidden hover:border-primary/30 transition-all">
          <!-- Mini map -->
          <div [id]="'rmap-' + r.id" style="height:180px;" class="bg-white/5"></div>

          <div class="p-5">
            <div class="flex items-start justify-between mb-3 gap-2">
              <div>
                <p class="font-bold text-sm leading-tight">{{ r.alertTitle || ('Alert #' + r.alertId) }}</p>
                <p class="text-xs text-on-surface-variant mt-0.5">
                  <span class="material-symbols-outlined text-[12px] align-middle">home</span>
                  {{ r.shelterName || (r.toShelterId ? 'Shelter #' + r.toShelterId : 'No shelter') }}
                </p>
              </div>
              <app-status-badge [status]="r.status"></app-status-badge>
            </div>

            <div class="grid grid-cols-3 gap-2 mb-4">
              <div class="bg-white/5 rounded-xl p-2.5 text-center">
                <p class="text-[9px] uppercase tracking-widest text-on-surface-variant mb-0.5">Distance</p>
                <p class="text-base font-black">{{ r.distanceKm != null ? (r.distanceKm | number:'1.1-1') : '—' }}<span class="text-[10px] font-normal ml-0.5">km</span></p>
              </div>
              <div class="bg-white/5 rounded-xl p-2.5 text-center">
                <p class="text-[9px] uppercase tracking-widest text-on-surface-variant mb-0.5">Duration</p>
                <p class="text-base font-black">{{ r.estimatedDurationMin ?? '—' }}<span class="text-[10px] font-normal ml-0.5">min</span></p>
              </div>
              <div class="bg-white/5 rounded-xl p-2.5 text-center">
                <p class="text-[9px] uppercase tracking-widest text-on-surface-variant mb-0.5">Capacity</p>
                <p class="text-base font-black">{{ r.capacity ?? '—' }}<span class="text-[10px] font-normal ml-0.5">ppl</span></p>
              </div>
            </div>

            <div class="flex gap-2 pt-3 border-t border-white/5">
              <a [routerLink]="['/evacuation', r.id]"
                 class="flex-1 py-1.5 text-center text-xs font-bold text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors">
                Details
              </a>
              <button *ngIf="r.status === 'PLANNED'" (click)="activate(r)"
                      class="flex-1 py-1.5 text-xs font-bold text-green-400 border border-green-400/30 rounded-lg hover:bg-green-400/10 transition-colors">
                Activate
              </button>
              <button *ngIf="r.status === 'ACTIVE'" (click)="close(r)"
                      class="flex-1 py-1.5 text-xs font-bold text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors">
                Close
              </button>
              <button (click)="recompute(r)" title="Recompute road route"
                      class="px-3 py-1.5 text-xs font-bold text-amber-400 border border-amber-400/30 rounded-lg hover:bg-amber-400/10 transition-colors">
                <span class="material-symbols-outlined text-sm">refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="filtered.length === 0 && !loading"
           class="glass-1 rounded-2xl border border-white/5 py-16 flex flex-col items-center text-on-surface-variant">
        <span class="material-symbols-outlined text-5xl mb-3">directions_off</span>
        <p class="font-bold">No routes found</p>
        <p class="text-sm mt-1">Try changing your filter or create a new route above</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-12">
        <span class="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    </div>
  `
})
export class EvacuationRoutesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pickerMap') pickerMapRef!: ElementRef;

  routes: EvacuationRoute[] = [];
  filtered: EvacuationRoute[] = [];
  alerts: Alert[] = [];
  statusFilter = '';
  showForm = false;
  creating = false;
  loading = true;
  formError = '';
  pinMode: 'origin' | 'shelter' = 'origin';
  newRoute: Partial<EvacuationRoute> = {};

  private pickerMap!: L.Map;
  private pickerOriginMarker: L.Marker | null = null;
  private pickerShelterMarker: L.Marker | null = null;
  private cardMaps: Map<number, L.Map> = new Map();
  private pickerMapInit = false;

  constructor(
    private evacuationService: EvacuationService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
    this.alertService.getAllAlerts().subscribe(a => this.alerts = a);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCardMaps(), 600);
  }

  ngOnDestroy(): void {
    this.cardMaps.forEach(m => m.remove());
    if (this.pickerMap) this.pickerMap.remove();
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.newRoute = {};
      this.pinMode = 'origin';
      this.pickerMapInit = false;
      setTimeout(() => this.initPickerMap(), 150);
    } else {
      if (this.pickerMap) { this.pickerMap.remove(); this.pickerMapInit = false; }
    }
  }

  load(): void {
    this.loading = true;
    this.evacuationService.getAllRoutes().subscribe({
      next: data => {
        this.routes = data;
        this.filtered = data;
        this.loading = false;
        setTimeout(() => this.initCardMaps(), 400);
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters(): void {
    this.filtered = this.statusFilter
      ? this.routes.filter(r => r.status === this.statusFilter)
      : [...this.routes];
    setTimeout(() => this.initCardMaps(), 300);
  }

  createRoute(): void {
    this.formError = '';
    if (!this.newRoute.alertId) { this.formError = 'Please select an alert.'; return; }
    if (!this.newRoute.shelterName?.trim()) { this.formError = 'Please enter a shelter name.'; return; }
    if (!this.newRoute.fromLatitude || !this.newRoute.fromLongitude) { this.formError = 'Please pin the origin on the map.'; return; }
    if (!this.newRoute.toLatitude || !this.newRoute.toLongitude) { this.formError = 'Please pin the shelter on the map.'; return; }
    this.creating = true;
    this.evacuationService.createRoute(this.newRoute).subscribe({
      next: () => { this.creating = false; this.toggleForm(); this.load(); },
      error: (err) => { this.creating = false; this.formError = err?.error?.message || 'Failed to create route.'; }
    });
  }

  activate(r: EvacuationRoute): void { this.evacuationService.activateRoute(r.id).subscribe(() => this.load()); }
  close(r: EvacuationRoute): void { this.evacuationService.closeRoute(r.id).subscribe(() => this.load()); }
  recompute(r: EvacuationRoute): void { this.evacuationService.recomputeRoute(r.id).subscribe(() => this.load()); }

  private initPickerMap(): void {
    if (this.pickerMapInit || !this.pickerMapRef?.nativeElement) return;
    this.pickerMapInit = true;

    if (this.pickerMap) this.pickerMap.remove();
    this.pickerMap = L.map(this.pickerMapRef.nativeElement, {
      zoomControl: true, scrollWheelZoom: true, preferCanvas: true
    }).setView([36.8065, 10.1815], 10);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OSM © CartoDB', subdomains: 'abcd', maxZoom: 19
    }).addTo(this.pickerMap);

    this.pickerMap.getContainer().style.cursor = 'crosshair';

    this.pickerMap.on('click', (e: L.LeafletMouseEvent) => {
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));

      if (this.pinMode === 'origin') {
        this.newRoute.fromLatitude = lat;
        this.newRoute.fromLongitude = lng;
        if (this.pickerOriginMarker) this.pickerMap.removeLayer(this.pickerOriginMarker);
        const icon = L.divIcon({
          html: `<div style="width:20px;height:20px;background:#f59e0b;border:3px solid white;border-radius:50%;box-shadow:0 0 14px rgba(245,158,11,0.9);display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:bold">O</div>`,
          iconSize: [20, 20], iconAnchor: [10, 10], className: ''
        });
        this.pickerOriginMarker = L.marker([lat, lng], { icon })
          .bindPopup(`<b>Origin</b><br>${lat.toFixed(4)}, ${lng.toFixed(4)}`).addTo(this.pickerMap);
        this.pinMode = 'shelter'; // auto-switch to shelter pin next
      } else {
        this.newRoute.toLatitude = lat;
        this.newRoute.toLongitude = lng;
        if (this.pickerShelterMarker) this.pickerMap.removeLayer(this.pickerShelterMarker);
        const icon = L.divIcon({
          html: `<div style="width:20px;height:20px;background:#22c55e;border:3px solid white;border-radius:50%;box-shadow:0 0 14px rgba(34,197,94,0.9);display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:bold">S</div>`,
          iconSize: [20, 20], iconAnchor: [10, 10], className: ''
        });
        this.pickerShelterMarker = L.marker([lat, lng], { icon })
          .bindPopup(`<b>Shelter</b><br>${lat.toFixed(4)}, ${lng.toFixed(4)}`).addTo(this.pickerMap);
      }
      this.cdr.detectChanges();
    });

    setTimeout(() => this.pickerMap.invalidateSize(), 100);
  }

  private initCardMaps(): void {
    this.cardMaps.forEach(m => m.remove());
    this.cardMaps.clear();

    this.filtered.forEach(r => {
      if (!r.path) return;
      const el = document.getElementById('rmap-' + r.id);
      if (!el) return;
      try {
        const map = L.map(el, {
          zoomControl: false, scrollWheelZoom: false, dragging: false,
          doubleClickZoom: false, touchZoom: false, keyboard: false,
          attributionControl: false, preferCanvas: true
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          { subdomains: 'abcd', maxZoom: 19 }).addTo(map);

        const geom = wkt.parse(r.path);
        if (geom && geom.type === 'LineString') {
          const latLngs: [number, number][] = geom.coordinates.map((c: number[]) => [c[1], c[0]]);
          const color = r.status === 'ACTIVE' ? '#22c55e' : r.status === 'BLOCKED' ? '#ef4444' : '#6c5ce7';
          const line = L.polyline(latLngs, { color, weight: 4, opacity: 0.95 }).addTo(map);

          // Origin pin (amber)
          L.circleMarker(latLngs[0], { radius: 7, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1, weight: 2 })
            .bindTooltip('Origin').addTo(map);
          // Shelter pin (green)
          L.circleMarker(latLngs[latLngs.length - 1], { radius: 8, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1, weight: 2 })
            .bindTooltip('Shelter').addTo(map);

          map.fitBounds(line.getBounds(), { padding: [14, 14] });
        }
        this.cardMaps.set(r.id, map);
        setTimeout(() => map.invalidateSize(), 100);
      } catch (e) { console.error('Card map error for route', r.id, e); }
    });
  }
}
