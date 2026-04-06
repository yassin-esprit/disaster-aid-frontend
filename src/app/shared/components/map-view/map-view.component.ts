// src/app/shared/components/map-view/map-view.component.ts
import { Component, Input, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import wkt from "wkt";

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  template: `<div #mapContainer style="height: 100%; width: 100%;"></div>`,
  styles: [`:host { display: block; height: 100%; }`]
})
export class MapViewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() center: [number, number] = [36.8065, 10.1815]; // Tunis
  @Input() zoom: number = 8;
  @Input() geometries: Array<{ type: string; wkt: string; color?: string }> = [];

  private map!: L.Map;
  private layers: L.Layer[] = [];

  ngAfterViewInit(): void {
    this.initMap();
    this.addGeometries();
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement).setView(this.center, this.zoom);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB'
    }).addTo(this.map);
  }

  private addGeometries(): void {
    this.geometries.forEach(geo => {
      try {
        const geom = wkt.parse(geo.wkt);
        let layer: L.Layer | null = null;
        if (geom.type === 'Point') {
          layer = L.marker([geom.coordinates[1], geom.coordinates[0]]);
        } else if (geom.type === 'LineString') {
          const latLngs = geom.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          layer = L.polyline(latLngs, { color: geo.color || '#3388ff' });
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
    if (this.layers.length && this.map) {
      const group = L.featureGroup(this.layers);
      this.map.fitBounds(group.getBounds());
    }
  }
}
