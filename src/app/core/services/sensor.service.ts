// src/app/core/services/sensor.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { Sensor, SensorData, AlertThreshold } from '../../shared/models/sensor.model';

@Injectable({ providedIn: 'root' })
export class SensorService {
  constructor(private http: HttpService) {}

  // Sensors
  getAllSensors(): Observable<Sensor[]> {
    return this.http.get<Sensor[]>('/sensors');
  }

  getSensorById(id: number): Observable<Sensor> {
    return this.http.get<Sensor>(`/sensors/${id}`);
  }

  createSensor(sensor: Partial<Sensor>): Observable<Sensor> {
    return this.http.post<Sensor>('/sensors', sensor);
  }

  updateSensor(id: number, sensor: Partial<Sensor>): Observable<Sensor> {
    return this.http.put<Sensor>(`/sensors/${id}`, sensor);
  }

  deleteSensor(id: number): Observable<void> {
    return this.http.delete<void>(`/sensors/${id}`);
  }

  updateLastPing(id: number): Observable<Sensor> {
    return this.http.patch<Sensor>(`/sensors/${id}/ping`, {});
  }

  // Sensor Data
  getReadingsBySensor(sensorId: number): Observable<SensorData[]> {
    return this.http.get<SensorData[]>(`/sensor-data/sensor/${sensorId}`);
  }

  getReadingsBetweenDates(sensorId: number, start: string, end: string): Observable<SensorData[]> {
    return this.http.get<SensorData[]>(`/sensor-data/sensor/${sensorId}/between?start=${start}&end=${end}`);
  }

  getAnomalies(): Observable<SensorData[]> {
    return this.http.get<SensorData[]>('/sensor-data/anomalies');
  }

  recordReading(reading: Partial<SensorData>): Observable<SensorData> {
    return this.http.post<SensorData>('/sensor-data', reading);
  }

  // Alert Thresholds
  getAllThresholds(): Observable<AlertThreshold[]> {
    return this.http.get<AlertThreshold[]>('/alert-thresholds');
  }

  getThresholdById(id: number): Observable<AlertThreshold> {
    return this.http.get<AlertThreshold>(`/alert-thresholds/${id}`);
  }

  createThreshold(threshold: Partial<AlertThreshold>): Observable<AlertThreshold> {
    return this.http.post<AlertThreshold>('/alert-thresholds', threshold);
  }

  updateThreshold(id: number, threshold: Partial<AlertThreshold>): Observable<AlertThreshold> {
    return this.http.put<AlertThreshold>(`/alert-thresholds/${id}`, threshold);
  }

  deleteThreshold(id: number): Observable<void> {
    return this.http.delete<void>(`/alert-thresholds/${id}`);
  }
}
