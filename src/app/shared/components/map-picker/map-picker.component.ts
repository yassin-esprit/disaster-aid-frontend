// src/app/shared/components/map-picker/map-picker.component.ts
import {
  Component, Input, Output, EventEmitter,
  AfterViewInit, OnDestroy, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

/**
 * Interactive map picker.
 * The user clicks anywhere on the map → emits a WKT POINT string.
 *
 * Usage:
 *   <app-map-picker
 *     [initialWkt]="sensorForm.get('location')?.value"
 *     (locationPicked)="onLocationPicked($event)">
 *   </app-map-picker>
 */
@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      <div class="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
        <span class="material-symbols-outlined text-sm text-primary">touch_app</span>
        Click on the map to pin the location
      </div>
      <div #mapEl style="height:320px; width:100%; border-radius:12px; overflow:hidden;"
           class="border border-white/10"></div>
      <div *ngIf="pickedWkt" class="flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded-lg text-xs">
        <span class="material-symbols-outlined text-primary text-sm">location_on</span>
        <span class="font-mono text-primary">{{ pickedWkt }}</span>
        <button type="button" (click)="clearPin()"
                class="ml-auto text-error hover:text-error/70 transition-colors">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      <div *ngIf="!pickedWkt" class="text-xs text-on-surface-variant/60 italic">
        No location selected — click the map above
      </div>
    </div>
  `
})
export class MapPickerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef;

  /** Pre-populate from an existing WKT point, e.g. "POINT(10.5 36.8)" */
  @Input() set initialWkt(wkt: string | null | undefined) {
    if (wkt) {
      this._initialWkt = wkt;
      this.pickedWkt   = wkt;
      this._tryShowPin(wkt);
    }
  }

  /** Emits a WKT string every time the user picks a point */
  @Output() locationPicked = new EventEmitter<string>();

  pickedWkt: string | null = null;
  private _initialWkt: string | null = null;
  private map!: L.Map;
  private marker?: L.Marker;

  // Default center: Tunis
  private center: [number, number] = [36.8065, 10.1815];

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      zoomControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: false,
    }).setView(this.center, 9);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OSM © CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(this.map);

    // Click → place / move pin
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this._placePin(lat, lng);
      const wkt = `POINT(${lng.toFixed(6)} ${lat.toFixed(6)})`;
      this.pickedWkt = wkt;
      this.locationPicked.emit(wkt);
    });

    // If initial WKT was provided before map was ready, show pin now
    if (this._initialWkt) this._tryShowPin(this._initialWkt);

    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  clearPin(): void {
    if (this.marker) { this.map.removeLayer(this.marker); this.marker = undefined; }
    this.pickedWkt = null;
    this.locationPicked.emit('');
  }

  ngOnDestroy(): void { this.map?.remove(); }

  private _placePin(lat: number, lng: number): void {
    if (this.marker) this.map.removeLayer(this.marker);
    this.marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          background:#6C5CE7;border:3px solid #fff;
          transform:rotate(-45deg);
          box-shadow:0 2px 10px rgba(108,92,231,0.6)">
        </div>`,
        iconSize:   [28, 28],
        iconAnchor: [14, 28],
      })
    }).addTo(this.map);
  }

  private _tryShowPin(wkt: string): void {
    if (!this.map) return;
    const m = wkt.match(/POINT\(([^ ]+) ([^ )]+)\)/i);
    if (m) {
      const lng = parseFloat(m[1]);
      const lat = parseFloat(m[2]);
      this._placePin(lat, lng);
      this.map.setView([lat, lng], 13);
    }
  }
}
