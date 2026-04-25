import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

export interface SpatialSensor {
  id: number;
  name: string;
  type: string;
  location: string;
  status: string;
  manufacturer: string | null;
}

@Injectable({ providedIn: 'root' })
export class SpatialService {
  constructor(private http: HttpService) {}

  getSensorsInsideZone(polygonWkt: string): Observable<SpatialSensor[]> {
    return this.http.get<SpatialSensor[]>('spatial/sensors/inside-zone', { polygon: polygonWkt });
  }

  getNearestSensors(pointWkt: string, limit: number = 5): Observable<SpatialSensor[]> {
    return this.http.get<SpatialSensor[]>('spatial/sensors/nearest', { point: pointWkt, limit });
  }
}
