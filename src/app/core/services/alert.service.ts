// src/app/core/services/alert.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { Alert, GeofenceZone } from '../../shared/models/sensor.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  constructor(private http: HttpService) {}

  // Alerts
  getAllAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>('alerts');
  }

  getAlertById(id: number): Observable<Alert> {
    return this.http.get<Alert>(`alerts/${id}`);
  }

  createAlert(alert: Partial<Alert>): Observable<Alert> {
    return this.http.post<Alert>('alerts', alert);
  }

  updateAlert(id: number, alert: Partial<Alert>): Observable<Alert> {
    return this.http.put<Alert>(`alerts/${id}`, alert);
  }

  deleteAlert(id: number): Observable<void> {
    return this.http.delete<void>(`alerts/${id}`);
  }

  resolveAlert(id: number): Observable<Alert> {
    return this.http.patch<Alert>(`alerts/${id}/resolve`, {});
  }

  // Geofence Zones
  getAllZones(): Observable<GeofenceZone[]> {
    return this.http.get<GeofenceZone[]>('geofence-zones');
  }

  getZoneById(id: number): Observable<GeofenceZone> {
    return this.http.get<GeofenceZone>(`geofence-zones/${id}`);
  }

  getZonesByAlert(alertId: number): Observable<GeofenceZone[]> {
    return this.http.get<GeofenceZone[]>(`geofence-zones/alert/${alertId}`);
  }

  createZone(zone: Partial<GeofenceZone>): Observable<GeofenceZone> {
    return this.http.post<GeofenceZone>('geofence-zones', zone);
  }

  updateZone(id: number, zone: Partial<GeofenceZone>): Observable<GeofenceZone> {
    return this.http.put<GeofenceZone>(`geofence-zones/${id}`, zone);
  }

  deleteZone(id: number): Observable<void> {
    return this.http.delete<void>(`geofence-zones/${id}`);
  }
}
