export type AlertType =
  | 'EARTHQUAKE'
  | 'FLOOD'
  | 'WILDFIRE'
  | 'STORM'
  | 'LANDSLIDE'
  | 'TSUNAMI'
  | 'VOLCANIC'
  | 'OTHER';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AlertStatus = 'ACTIVE' | 'MONITORING' | 'RESOLVED';

export interface Alert {
  alertId: number;
  title: string;
  description?: string | null;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  latitude: number;
  longitude: number;
  radiusKm: number;
  region?: string | null;
  country?: string | null;
  reportedAt: string;
  resolvedAt?: string | null;
}

export interface AlertWithStats {
  alert: Alert;
  latestStats: {
    statId: number;
    alertId: number;
    totalReports: number;
    verifiedReports: number;
    totalHelpRequests: number;
    resolvedRequests: number;
    activeResponders: number;
    shelterOccupancy?: string | null;
    avgResponseTimeMin?: number | null;
    affectedAreaKm2?: number | null;
    computedAt: string;
  } | null;
}

export interface MapSummary {
  activeAlerts: number;
  monitoringAlerts: number;
  resolvedAlerts: number;
  totalResponders: number;
  totalHelpRequests: number;
  resolvedRequests: number;
}
