import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsNavComponent } from '../../shared/components/analytics-nav/analytics-nav.component';
import { forkJoin, of, interval, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import * as L from 'leaflet';

// Fix Leaflet default icon paths (broken by webpack)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
});

import { AlertService } from '../../modules/analytics/services/alert.service';
import { WebSocketService } from '../../core/services/websocket.service';
import {
  Alert,
  AlertWithStats,
  MapSummary,
  AlertSeverity,
  AlertType,
} from '../../modules/analytics/models/alert.model';

@Component({
  selector: 'app-alerts-map',
  standalone: true,
  imports: [CommonModule, RouterModule, AnalyticsNavComponent],
  templateUrl: './alerts-map.component.html',
  styleUrl: './alerts-map.component.scss',
})
export class AlertsMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private alertSvc = inject(AlertService);
  private wsSvc = inject(WebSocketService);
  private map!: L.Map;
  private markersLayer = L.layerGroup();
  private zonesLayer = L.layerGroup();
  private pollSub?: Subscription;
  private wsSub?: Subscription;
  private wsDeleteSub?: Subscription;
  wsConnected = false;

  loading = true;
  error: string | null = null;

  alertsWithStats: AlertWithStats[] = [];
  summary: MapSummary | null = null;
  selectedAlert: AlertWithStats | null = null;
  sidebarOpen = true;

  readonly severityColors: Record<AlertSeverity, string> = {
    CRITICAL: '#ff6e84',
    HIGH: '#f97316',
    MEDIUM: '#f59e0b',
    LOW: '#699cff',
  };

  readonly typeIcons: Record<AlertType, string> = {
    EARTHQUAKE: 'earthquake',
    FLOOD: 'flood',
    WILDFIRE: 'local_fire_department',
    STORM: 'thunderstorm',
    LANDSLIDE: 'landslide',
    TSUNAMI: 'tsunami',
    VOLCANIC: 'volcano',
    OTHER: 'warning',
  };

  ngOnInit(): void {
    this.loadData();

    // Try WebSocket first, fall back to polling
    this.wsSvc.connect();
    this.wsSub = this.wsSvc.alertUpdates$.subscribe(() => {
      this.wsConnected = true;
      this.loadData(); // reload all data on any alert change
    });
    this.wsDeleteSub = this.wsSvc.alertDeleted$.subscribe(() => {
      this.wsConnected = true;
      this.loadData();
    });

    // Fallback polling (if WS is not connected)
    this.pollSub = interval(30000)
      .pipe(switchMap(() => this.fetchData()))
      .subscribe((res) => this.applyData(res));
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.wsSub?.unsubscribe();
    this.wsDeleteSub?.unsubscribe();
    this.wsSvc.disconnect();
    this.map?.remove();
  }

  private initMap(): void {
    this.map = L.map('disaster-map', {
      center: [35.8, 10.2],
      zoom: 7,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }
    ).addTo(this.map);

    this.markersLayer.addTo(this.map);
    this.zonesLayer.addTo(this.map);

    // Fix map size after layout renders
    setTimeout(() => this.map.invalidateSize(), 200);
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    this.fetchData().subscribe((res) => {
      this.applyData(res);
      this.loading = false;
    });
  }

  private fetchData() {
    return forkJoin({
      alertsWithStats: this.alertSvc
        .getAlertsWithStats()
        .pipe(catchError(() => of([] as AlertWithStats[]))),
      summary: this.alertSvc
        .getMapSummary()
        .pipe(catchError(() => of(null as MapSummary | null))),
    });
  }

  private applyData(res: {
    alertsWithStats: AlertWithStats[];
    summary: MapSummary | null;
  }): void {
    this.alertsWithStats = res.alertsWithStats;
    this.summary = res.summary;
    if (!res.alertsWithStats.length && !res.summary) {
      this.error = 'Could not load alerts. Is the backend running?';
    }
    this.renderMarkers();
  }

  private renderMarkers(): void {
    this.markersLayer.clearLayers();
    this.zonesLayer.clearLayers();

    for (const aws of this.alertsWithStats) {
      const a = aws.alert;
      const color = this.severityColors[a.severity];

      // Zone circle
      const circle = L.circle([a.latitude, a.longitude], {
        radius: a.radiusKm * 1000,
        color,
        fillColor: color,
        fillOpacity: 0.1,
        weight: 1.5,
        dashArray: a.status === 'MONITORING' ? '8 4' : undefined,
      });
      circle.addTo(this.zonesLayer);

      // Custom marker
      const icon = L.divIcon({
        className: 'custom-alert-marker',
        html: `<div style="
          background:${color};
          width:36px;height:36px;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 16px ${color}80, 0 2px 8px rgba(0,0,0,0.5);
          border:2px solid rgba(255,255,255,0.3);
          ${a.severity === 'CRITICAL' ? 'animation:pulse 2s infinite;' : ''}
        ">
          <span class="material-symbols-outlined" style="font-size:18px;color:#fff;">
            ${this.typeIcons[a.type]}
          </span>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([a.latitude, a.longitude], { icon });
      marker.on('click', () => this.selectAlert(aws));
      marker.addTo(this.markersLayer);
    }
  }

  selectAlert(aws: AlertWithStats): void {
    this.selectedAlert = aws;
    this.sidebarOpen = true;
    this.map.flyTo([aws.alert.latitude, aws.alert.longitude], 10, {
      duration: 0.8,
    });
  }

  closeDetail(): void {
    this.selectedAlert = null;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  parseShelters(json: string | null | undefined): { name: string; occupancy: number }[] {
    if (!json) return [];
    try {
      const obj = JSON.parse(json);
      return Object.entries(obj).map(([name, occupancy]) => ({
        name,
        occupancy: occupancy as number,
      }));
    } catch {
      return [];
    }
  }

  get resolvedPct(): number {
    if (!this.summary || this.summary.totalHelpRequests === 0) return 0;
    return Math.round(
      (this.summary.resolvedRequests / this.summary.totalHelpRequests) * 100
    );
  }
}
