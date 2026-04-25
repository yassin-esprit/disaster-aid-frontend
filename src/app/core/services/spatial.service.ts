import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HttpService } from './http.service';
import { environment } from '../../../environments/environment';

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
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpService,      // keep for other endpoints if needed
    private httpClient: HttpClient  // add this
  ) {}

  getSensorsInsideZone(polygonWkt: string): Observable<SpatialSensor[]> {
    const params = new HttpParams().set('polygon', polygonWkt);
    // Use httpClient directly to bypass restrictive HttpService
    return this.httpClient.get<SpatialSensor[]>(
      `${this.apiUrl}/spatial/sensors/inside-zone`,
      { params }
    );
  }

  getNearestSensors(pointWkt: string, limit: number = 5): Observable<SpatialSensor[]> {
    let params = new HttpParams()
      .set('point', pointWkt)
      .set('limit', limit.toString());
    // Use httpClient directly
    return this.httpClient.get<SpatialSensor[]>(
      `${this.apiUrl}/spatial/sensors/nearest`,
      { params }
    );
  }
}
