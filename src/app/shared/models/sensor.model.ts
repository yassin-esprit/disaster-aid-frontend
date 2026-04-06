export interface Sensor {
  id: number;
  name: string;
  type: 'SEISMIC' | 'FLOOD_GAUGE' | 'WEATHER' | 'AIR_QUALITY' | 'FIRE_SMOKE';
  location: string;        // WKT point, e.g. "POINT(10.5 36.8)"
  ownerId: number;
  manufacturer: string;
  status: 'ACTIVE' | 'OFFLINE' | 'FAULTY' | 'MAINTENANCE';
  lastPingAt: string;
  calibrationDate: string;
}

export interface SensorData {
  id: number;
  sensorId: number;
  value: number;
  unit: string;
  recordedAt: string;
  rawPayload: any;
  isAnomaly: boolean;
}

export interface Alert {
  id: number;
  disasterType: 'FLOOD' | 'EARTHQUAKE' | 'WILDFIRE' | 'LANDSLIDE' | 'STORM' | 'CHEMICAL';
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'MONITORING' | 'RESOLVED' | 'FALSE_ALARM';
  affectedArea: string;    // WKT polygon
  predictedArea2h: string;
  predictedArea6h: string;
  confidenceScore: number;
  triggerSensorId: number;
  issuedBy: number;
  issuedAt: string;
  resolvedAt: string | null;
  title: string;
  description: string;
}

export interface AlertThreshold {
  id: number;
  sensorType: Sensor['type'];
  parameter: string;
  warnLevel: number;
  criticalLevel: number;
  unit: string;
  evaluationWindowSec: number;
}

export interface GeofenceZone {
  id: number;
  alertId: number;
  polygon: string;         // WKT polygon
  zoneType: 'EVACUATION' | 'QUARANTINE' | 'SAFE' | 'RESTRICTED';
  radius: number | null;
  createdAt: string;
  expiresAt: string;
}
