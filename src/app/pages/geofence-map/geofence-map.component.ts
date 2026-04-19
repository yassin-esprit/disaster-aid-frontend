// src/app/pages/geofence-map/geofence-map.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../core/services/alert.service';
import { GeofenceZone } from '../../shared/models/sensor.model';
import { MapViewComponent } from '../../shared/components/map-view/map-view.component';

@Component({
  selector: 'app-geofence-map',
  standalone: true,
  imports: [CommonModule, MapViewComponent],
  template: `
    <div class="p-6 h-full">
      <h1 class="text-3xl font-bold mb-6">Geofence Zones</h1>
      <div class="glass-1 rounded-xl overflow-hidden" style="height: calc(100vh - 120px);">
        <app-map-view [geometries]="zonesGeometry"></app-map-view>
      </div>
    </div>
  `
})
export class GeofenceMapComponent implements OnInit {
  zones: GeofenceZone[] = [];
  get zonesGeometry() {
    return this.zones.map(z => ({ type: 'Polygon', wkt: z.polygon, color: z.zoneType === 'EVACUATION' ? '#3388ff' : '#ffaa33' }));
  }
  constructor(private alertService: AlertService) {}
  ngOnInit(): void {
    this.alertService.getAllZones().subscribe(data => this.zones = data);
  }
}
