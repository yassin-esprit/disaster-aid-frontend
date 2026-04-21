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

// SLA
export interface SlaMetric {
  id: number;
  alertId: number;
  incidentAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  timeToAcknowledgeMin?: number | null;
  timeToResolveMin?: number | null;
  totalResolutionMin?: number | null;
  slaStatus: 'WITHIN_SLA' | 'AT_RISK' | 'BREACHED';
}

export interface SlaSummary {
  avgAcknowledgeMin: number;
  avgResolveMin: number;
  avgTotalMin: number;
  totalIncidents: number;
  withinSla: number;
  atRisk: number;
  breached: number;
}

// Comparison
export interface ComparisonResult {
  alertA: { alert: Alert; stats: any | null };
  alertB: { alert: Alert; stats: any | null };
}

// Rule Engine
export type RuleField = 'TOTAL_REPORTS' | 'HELP_REQUESTS' | 'ACTIVE_RESPONDERS' | 'AVG_RESPONSE_TIME';
export type RuleOperator = 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'GREATER_OR_EQUAL' | 'LESS_OR_EQUAL';
export type RuleAction = 'CHANGE_SEVERITY' | 'NOTIFY' | 'AUTO_RESOLVE';

export interface AlertRule {
  id?: number;
  name: string;
  description?: string;
  field: RuleField;
  operator: RuleOperator;
  threshold: number;
  action: RuleAction;
  targetSeverity?: AlertSeverity | null;
  active: boolean;
  lastTriggeredAt?: string | null;
  triggerCount?: number;
  createdAt?: string;
}

export interface RuleExecutionResult {
  ruleId: number;
  ruleName: string;
  alertId: number;
  alertTitle: string;
  triggered: boolean;
  actionTaken: string;
  actualValue: number;
  threshold: number;
}

// Data Quality
export interface DataQualityReport {
  totalAlerts: number;
  totalIssues: number;
  qualityScore: number;
  issues: DataIssue[];
}

export interface DataIssue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: string;
  message: string;
  alertId?: number;
  alertTitle?: string;
}

// Risk Zones
export interface RiskZone {
  region: string;
  country: string;
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  avgLatitude: number;
  avgLongitude: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  disasterTypes: string[];
}

// Temporal Replay
export interface AlertSnapshot {
  id: number;
  alertId: number;
  status: AlertStatus;
  severity: AlertSeverity;
  radiusKm?: number;
  totalReports?: number;
  totalHelpRequests?: number;
  activeResponders?: number;
  snapshotAt: string;
}
