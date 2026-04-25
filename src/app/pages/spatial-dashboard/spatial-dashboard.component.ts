import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpatialService, SpatialSensor } from '../../core/services/spatial.service';
import * as L from 'leaflet';
import wkt from 'wkt';

type QueryMode = 'inside-zone' | 'nearest';

@Component({
  selector: 'app-spatial-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">

      <!-- Header -->
      <div>
        <h1 class="text-3xl font-black tracking-tight">Spatial Intelligence</h1>
        <p class="text-sm text-on-surface-variant mt-1">
          PostGIS geographic queries running directly against sensor geometry columns
        </p>
      </div>

      <!-- Mode selector — two cards filling full width -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

        <!-- Sensors in Zone -->
        <button (click)="setMode('inside-zone')"
                class="text-left p-6 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99]"
                [ngClass]="mode==='inside-zone'
                  ? 'border-primary bg-primary/10 shadow-[0_0_32px_rgba(108,92,231,0.25)]'
                  : 'border-white/10 glass-1 hover:border-primary/30'">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                 [ngClass]="mode==='inside-zone' ? 'bg-primary' : 'bg-primary/20'">
              <span class="material-symbols-outlined text-2xl"
                    [ngClass]="mode==='inside-zone' ? 'text-white' : 'text-primary'">sensors</span>
            </div>
            <div>
              <p class="font-bold text-base mb-1">Sensors in Zone</p>
              <p class="text-xs text-on-surface-variant leading-relaxed">
                Uses <span class="font-mono text-primary/80">ST_Contains(polygon, sensor.location)</span> to find every sensor
                physically located inside a geographic boundary. Draw any polygon on the map or use the
                visible map area as your query zone.
              </p>
              <div class="flex flex-wrap gap-2 mt-3">
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">PostGIS</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-on-surface-variant border border-white/10">Polygon query</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-on-surface-variant border border-white/10">Geofence</span>
              </div>
            </div>
          </div>
          <div *ngIf="mode==='inside-zone'"
               class="mt-4 pt-4 border-t border-primary/20 flex items-center gap-2 text-xs text-primary font-bold">
            <span class="material-symbols-outlined text-sm">radio_button_checked</span>
            Active — configure below
          </div>
        </button>

        <!-- Nearest Sensors -->
        <button (click)="setMode('nearest')"
                class="text-left p-6 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99]"
                [ngClass]="mode==='nearest'
                  ? 'border-secondary bg-secondary/10 shadow-[0_0_32px_rgba(0,184,148,0.25)]'
                  : 'border-white/10 glass-1 hover:border-secondary/30'">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                 [ngClass]="mode==='nearest' ? 'bg-secondary' : 'bg-secondary/20'">
              <span class="material-symbols-outlined text-2xl"
                    [ngClass]="mode==='nearest' ? 'text-white' : 'text-secondary'">near_me</span>
            </div>
            <div>
              <p class="font-bold text-base mb-1">Nearest Sensors</p>
              <p class="text-xs text-on-surface-variant leading-relaxed">
                Uses <span class="font-mono text-secondary/80">ORDER BY ST_Distance(sensor.location, point)</span> to rank
                every sensor by proximity to a GPS coordinate. Click anywhere on the map to set the origin,
                or type coordinates manually.
              </p>
              <div class="flex flex-wrap gap-2 mt-3">
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold border border-secondary/20">PostGIS</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-on-surface-variant border border-white/10">Distance sort</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-on-surface-variant border border-white/10">KNN</span>
              </div>
            </div>
          </div>
          <div *ngIf="mode==='nearest'"
               class="mt-4 pt-4 border-t border-secondary/20 flex items-center gap-2 text-xs text-secondary font-bold">
            <span class="material-symbols-outlined text-sm">radio_button_checked</span>
            Active — click map or enter coordinates below
          </div>
        </button>
      </div>

      <!-- Controls bar -->
      <div class="glass-1 rounded-2xl border border-white/10 p-5">
        <!-- No mode selected -->
        <div *ngIf="!mode" class="flex items-center gap-3 text-on-surface-variant text-sm py-1">
          <span class="material-symbols-outlined">travel_explore</span>
          Select a query mode above to get started
        </div>

        <!-- Inside Zone controls -->
        <div *ngIf="mode==='inside-zone'" class="space-y-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full bg-primary"></span>
            <p class="text-xs font-bold text-primary uppercase tracking-widest">Sensors in Zone — Query Parameters</p>
          </div>
          <div class="flex gap-3 flex-wrap items-center">
            <input [(ngModel)]="polygonInput"
                   placeholder="POLYGON((lng lat, lng lat, lng lat, lng lat, lng lat))"
                   class="flex-1 min-w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-primary transition-colors" />
            <button (click)="useMapBounds()"
                    class="px-4 py-2.5 text-xs font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary/10 transition-colors whitespace-nowrap flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">crop_free</span>
              Use Map Bounds
            </button>
            <button (click)="runInsideZone()" [disabled]="running || !polygonInput.trim()"
                    class="px-6 py-2.5 text-xs font-bold bg-primary text-on-primary rounded-xl disabled:opacity-40 hover:shadow-[0_0_16px_rgba(108,92,231,0.5)] transition-all flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">{{ running ? 'progress_activity' : 'search' }}</span>
              {{ running ? 'Running…' : 'Run Query' }}
            </button>
          </div>
          <p class="text-[11px] text-on-surface-variant">
            💡 Tip: click <strong>Use Map Bounds</strong> to instantly query all sensors visible in the current map view.
          </p>
        </div>

        <!-- Nearest Sensors controls -->
        <div *ngIf="mode==='nearest'" class="space-y-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full bg-secondary"></span>
            <p class="text-xs font-bold text-secondary uppercase tracking-widest">Nearest Sensors — Query Parameters</p>
          </div>
          <div class="flex flex-wrap gap-3 items-end">
            <div>
              <label class="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">Latitude</label>
              <input type="number" step="0.0001" [(ngModel)]="nearLat"
                     class="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors" />
            </div>
            <div>
              <label class="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">Longitude</label>
              <input type="number" step="0.0001" [(ngModel)]="nearLng"
                     class="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors" />
            </div>
            <div>
              <label class="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">Count</label>
              <input type="number" [(ngModel)]="nearLimit" min="1" max="20"
                     class="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors" />
            </div>
            <button (click)="runNearest()" [disabled]="running"
                    class="px-6 py-2.5 text-xs font-bold bg-secondary text-white rounded-xl disabled:opacity-40 hover:shadow-[0_0_16px_rgba(0,184,148,0.5)] transition-all flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">{{ running ? 'progress_activity' : 'near_me' }}</span>
              {{ running ? 'Running…' : 'Find Nearest' }}
            </button>
          </div>
          <p class="text-[11px] text-on-surface-variant">
            📍 Or simply <strong>click on the map</strong> to instantly set the origin point.
          </p>
        </div>
      </div>

      <!-- Map + Results -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- Map — takes 2/3 -->
        <div class="lg:col-span-2 flex flex-col gap-0">
          <div class="glass-1 rounded-2xl border border-white/10 overflow-hidden relative" style="height: 500px;">
            <div #spatialMap style="height:100%;width:100%;"></div>

            <!-- Floating hint overlays -->
            <div *ngIf="mode==='nearest' && !ran"
                 class="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
              <div class="bg-black/75 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full flex items-center gap-2">
                <span class="material-symbols-outlined text-sm text-amber-400">touch_app</span>
                Click anywhere on the map to set origin
              </div>
            </div>
            <div *ngIf="mode==='inside-zone' && !ran"
                 class="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
              <div class="bg-black/75 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full flex items-center gap-2">
                <span class="material-symbols-outlined text-sm text-primary">crop_free</span>
                Use "Map Bounds" or enter a WKT polygon above
              </div>
            </div>

            <!-- Result count badge on map -->
            <div *ngIf="ran && sensorResults.length > 0"
                 class="absolute top-3 left-3 z-10 pointer-events-none">
              <div class="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                   [ngClass]="mode==='inside-zone' ? 'bg-primary/90 text-white' : 'bg-secondary/90 text-white'">
                <span class="material-symbols-outlined text-sm">sensors</span>
                {{ sensorResults.length }} sensor{{ sensorResults.length !== 1 ? 's' : '' }} found
              </div>
            </div>
          </div>
        </div>

        <!-- Results panel — 1/3 -->
        <div class="flex flex-col gap-3">

          <!-- Summary bar -->
          <div class="glass-1 rounded-2xl border border-white/10 p-4 flex items-center justify-between">
            <div>
              <p class="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Results</p>
              <p class="text-2xl font-black mt-0.5">{{ sensorResults.length }}<span class="text-sm font-normal text-on-surface-variant ml-1">sensors</span></p>
            </div>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                 [ngClass]="mode==='nearest' ? 'bg-secondary/20' : 'bg-primary/20'">
              <span class="material-symbols-outlined"
                    [ngClass]="mode==='nearest' ? 'text-secondary' : 'text-primary'">
                {{ mode === 'nearest' ? 'near_me' : 'sensors' }}
              </span>
            </div>
          </div>

          <!-- Empty / idle states -->
          <div *ngIf="!mode"
               class="glass-1 rounded-2xl border border-white/10 p-8 flex flex-col items-center text-center text-on-surface-variant gap-3 flex-1">
            <span class="material-symbols-outlined text-4xl opacity-40">travel_explore</span>
            <p class="text-sm font-bold">No query running</p>
            <p class="text-xs leading-relaxed">Pick a mode from the cards above to query your sensor network</p>
          </div>

          <div *ngIf="mode && ran && !running && sensorResults.length === 0"
               class="glass-1 rounded-2xl border border-white/10 p-8 flex flex-col items-center text-center text-on-surface-variant gap-3">
            <span class="material-symbols-outlined text-4xl opacity-40">search_off</span>
            <p class="text-sm font-bold">No sensors found</p>
            <p class="text-xs">{{ mode === 'inside-zone' ? 'No sensors are inside this zone' : 'No sensor data available' }}</p>
          </div>

          <div *ngIf="running" class="flex justify-center py-10">
            <span class="material-symbols-outlined animate-spin text-4xl"
                  [ngClass]="mode==='nearest' ? 'text-secondary' : 'text-primary'">progress_activity</span>
          </div>

          <!-- Sensor result cards -->
          <div *ngIf="sensorResults.length > 0 && !running"
               class="space-y-2 overflow-y-auto" style="max-height: 380px;">
            <div *ngFor="let s of sensorResults; let i = index"
                 (click)="focusSensor(s)"
                 class="glass-1 rounded-xl border border-white/5 p-3.5 cursor-pointer hover:border-primary/30 transition-all hover:bg-white/5 group">

              <!-- Top row -->
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex items-center gap-2 min-w-0">
                  <!-- Rank badge for nearest mode -->
                  <div *ngIf="mode==='nearest'"
                       class="w-6 h-6 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center flex-shrink-0">
                    <span class="text-[10px] font-black text-secondary">{{ i + 1 }}</span>
                  </div>
                  <p class="font-bold text-sm truncate">{{ s.name }}</p>
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                      [ngClass]="s.status === 'ACTIVE'
                        ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                        : s.status === 'OFFLINE'
                        ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'">
                  {{ s.status }}
                </span>
              </div>

              <!-- Type + location -->
              <div class="flex items-center gap-3 text-[11px] text-on-surface-variant">
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">device_hub</span>
                  {{ s.type.replace('_', ' ') }}
                </span>
                <span *ngIf="s.manufacturer" class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">factory</span>
                  {{ s.manufacturer }}
                </span>
              </div>

              <!-- Focus hint -->
              <p class="text-[10px] text-on-surface-variant/50 mt-2 group-hover:text-primary/60 transition-colors flex items-center gap-1">
                <span class="material-symbols-outlined text-[11px]">center_focus_weak</span>
                Click to focus on map
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SpatialDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('spatialMap') mapRef!: ElementRef;

  mode: QueryMode | null = null;
  polygonInput = '';
  nearLat = 36.8065;
  nearLng = 10.1815;
  nearLimit = 5;
  sensorResults: SpatialSensor[] = [];
  running = false;
  ran = false;

  private map!: L.Map;
  private resultLayers: L.Layer[] = [];
  private originMarker: L.Marker | null = null;

  constructor(
    private spatialService: SpatialService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 50);
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  setMode(m: QueryMode): void {
    this.mode = m;
    this.sensorResults = [];
    this.ran = false;
    this.clearResultLayers();
    if (this.map) {
      this.map.getContainer().style.cursor = m === 'nearest' ? 'crosshair' : '';
      setTimeout(() => this.map.invalidateSize(), 50);
    }
  }

  useMapBounds(): void {
    if (!this.map) return;
    const b = this.map.getBounds();
    const sw = b.getSouthWest(), ne = b.getNorthEast();
    this.polygonInput = `POLYGON((${sw.lng.toFixed(6)} ${sw.lat.toFixed(6)}, ${ne.lng.toFixed(6)} ${sw.lat.toFixed(6)}, ${ne.lng.toFixed(6)} ${ne.lat.toFixed(6)}, ${sw.lng.toFixed(6)} ${ne.lat.toFixed(6)}, ${sw.lng.toFixed(6)} ${sw.lat.toFixed(6)}))`;
  }

  runInsideZone(): void {
    if (!this.polygonInput.trim()) return;
    this.running = true;
    this.clearResultLayers();
    this.spatialService.getSensorsInsideZone(this.polygonInput).subscribe({
      next: s => {
        this.sensorResults = s;
        this.running = false;
        this.ran = true;
        this.renderPolygon(this.polygonInput);
        this.renderSensorMarkers(s, '#6c5ce7');
      },
      error: () => { this.running = false; this.ran = true; }
    });
  }

  runNearest(): void {
    const point = `POINT(${this.nearLng} ${this.nearLat})`;
    this.running = true;
    this.clearResultLayers();
    this.spatialService.getNearestSensors(point, this.nearLimit).subscribe({
      next: s => {
        this.sensorResults = s;
        this.running = false;
        this.ran = true;
        this.renderOriginMarker(this.nearLat, this.nearLng);
        this.renderSensorMarkers(s, '#00b894');
        this.renderDistanceLines(s, this.nearLat, this.nearLng);
      },
      error: () => { this.running = false; this.ran = true; }
    });
  }

  focusSensor(s: SpatialSensor): void {
    if (!this.map || !s.location) return;
    try {
      const g = wkt.parse(s.location);
      if (g?.type === 'Point') this.map.setView([g.coordinates[1], g.coordinates[0]], 15, { animate: true });
    } catch {}
  }

  private initMap(): void {
    if (!this.mapRef?.nativeElement || this.map) return;

    this.map = L.map(this.mapRef.nativeElement, {
      zoomControl: false,
      scrollWheelZoom: true,
      preferCanvas: true
    }).setView([36.8065, 10.1815], 9);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OSM © CartoDB',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.mode !== 'nearest') return;
      this.nearLat = parseFloat(e.latlng.lat.toFixed(6));
      this.nearLng = parseFloat(e.latlng.lng.toFixed(6));
      this.cdr.detectChanges();

      if (this.originMarker) this.map.removeLayer(this.originMarker);
      const icon = L.divIcon({
        html: `<div style="width:18px;height:18px;background:#f59e0b;border:3px solid white;border-radius:50%;box-shadow:0 0 14px rgba(245,158,11,0.9)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9], className: ''
      });
      this.originMarker = L.marker([this.nearLat, this.nearLng], { icon })
        .bindPopup(`<b>Origin</b><br>${this.nearLat.toFixed(5)}, ${this.nearLng.toFixed(5)}`)
        .addTo(this.map);
    });

    setTimeout(() => this.map.invalidateSize(), 200);
  }

  private clearResultLayers(): void {
    this.resultLayers.forEach(l => this.map?.removeLayer(l));
    this.resultLayers = [];
    if (this.originMarker) {
      this.map?.removeLayer(this.originMarker);
      this.originMarker = null;
    }
  }

  private renderSensorMarkers(sensors: SpatialSensor[], color: string): void {
    sensors.forEach(s => {
      if (!s.location) return;
      try {
        const g = wkt.parse(s.location);
        if (g?.type === 'Point') {
          const m = L.circleMarker([g.coordinates[1], g.coordinates[0]], {
            radius: 10,
            color,
            fillColor: color,
            fillOpacity: 0.85,
            weight: 2
          }).bindPopup(`<b>${s.name}</b><br><i>${s.type.replace('_', ' ')}</i><br>Status: ${s.status}`);
          m.addTo(this.map);
          this.resultLayers.push(m);
        }
      } catch {}
    });

    if (this.resultLayers.filter(l => l instanceof L.CircleMarker).length > 0) {
      const markers = this.resultLayers.filter(l => l instanceof L.CircleMarker);
      const grp = L.featureGroup(markers);
      const b = grp.getBounds();
      if (b.isValid()) this.map.fitBounds(b, { padding: [60, 60], maxZoom: 13 });
    }
  }

  private renderOriginMarker(lat: number, lng: number): void {
    if (this.originMarker) this.map.removeLayer(this.originMarker);
    const icon = L.divIcon({
      html: `<div style="width:18px;height:18px;background:#f59e0b;border:3px solid white;border-radius:50%;box-shadow:0 0 14px rgba(245,158,11,0.9)"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 9], className: ''
    });
    this.originMarker = L.marker([lat, lng], { icon })
      .bindPopup(`<b>Origin</b><br>${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      .addTo(this.map);
  }

  private renderDistanceLines(sensors: SpatialSensor[], lat: number, lng: number): void {
    sensors.forEach(s => {
      if (!s.location) return;
      try {
        const g = wkt.parse(s.location);
        if (g?.type === 'Point') {
          const l = L.polyline(
            [[lat, lng], [g.coordinates[1], g.coordinates[0]]],
            { color: '#00b894', weight: 1.5, dashArray: '6,5', opacity: 0.5 }
          ).addTo(this.map);
          this.resultLayers.push(l);
        }
      } catch {}
    });
  }

  private renderPolygon(polygonWkt: string): void {
    try {
      const g = wkt.parse(polygonWkt);
      if (g?.type === 'Polygon') {
        const latLngs = g.coordinates[0].map((c: number[]) => [c[1], c[0]]) as [number, number][];
        const p = L.polygon(latLngs, {
          color: '#6c5ce7',
          fillColor: '#6c5ce7',
          fillOpacity: 0.10,
          weight: 2,
          dashArray: '8,5'
        }).addTo(this.map);
        this.resultLayers.push(p);
        this.map.fitBounds(p.getBounds(), { padding: [30, 30] });
      }
    } catch {}
  }
}
