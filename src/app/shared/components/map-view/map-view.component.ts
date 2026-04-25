// src/app/shared/components/map-view/map-view.component.ts
import { Component, Input, AfterViewInit, OnChanges, OnDestroy, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import wkt from "wkt";

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  template: `<div #mapContainer style="height: 100%; width: 100%;"></div>`,
  styles: [`:host { display: block; height: 100%; width: 100%; }`]
})
export class MapViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() center: [number, number] = [36.8065, 10.1815];
  @Input() zoom: number = 8;
  @Input() geometries: Array<{ type: string; wkt: string; color?: string }> = [];

  private map!: L.Map;
  private layers: L.Layer[] = [];
  private lastGeometriesHash: string = '';

  ngAfterViewInit(): void {
    this.initMap();
    this.updateGeometries();
    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['geometries'] && this.map) {
      const newHash = JSON.stringify(this.geometries);
      if (newHash !== this.lastGeometriesHash) {
        this.lastGeometriesHash = newHash;
        this.updateGeometries();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true
    }).setView(this.center, this.zoom);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 1
    }).addTo(this.map);
  }

  private updateGeometries(): void {
    if (!this.map) return;
    this.clearLayers();
    this.addGeometries();
  }

  private clearLayers(): void {
    this.layers.forEach(layer => this.map?.removeLayer(layer));
    this.layers = [];
  }

  private addGeometries(): void {
    if (!this.map) return;

    this.geometries.forEach(geo => {
      try {
        const geom = wkt.parse(geo.wkt);
        let layer: L.Layer | null = null;
        if (geom.type === 'Point') {
          layer = L.marker([geom.coordinates[1], geom.coordinates[0]]);
        } else if (geom.type === 'LineString') {
          const latLngs = geom.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          layer = L.polyline(latLngs, { color: geo.color || '#3388ff', weight: 4 });
        } else if (geom.type === 'Polygon') {
          const latLngs = geom.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
          layer = L.polygon(latLngs, { color: geo.color || '#ff3388', fillOpacity: 0.3 });
        }
        if (layer) {
          layer.addTo(this.map);
          this.layers.push(layer);
        }
      } catch (e) {
        console.error('Invalid WKT:', geo.wkt, e);
      }
    });

    // Fit bounds only on initial load, not on every update
    if (this.layers.length && this.map && !this.lastGeometriesHash) {
      const group = L.featureGroup(this.layers);
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds);
      }
    }
  }
}
