export type ModelType =
  | 'SPREAD_PREDICTOR'
  | 'MATCHING_OPTIMIZER'
  | 'CREDIBILITY_SCORER'
  | 'CHURN_PREDICTOR'
  | 'IMPACT_ESTIMATOR';

export interface DisasterAnalyticsReportDto {
  totalReports: number;
  verifiedReports: number;
  totalHelpRequests: number;
  resolvedRequests: number;
  avgResponseTimeMin: number;
  auditEntries: number;
  activeModels: number;
}

export interface DisasterStatistics {
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
  credibilityWeightedCount?: number | null;
  computedAt: string;
}

export interface AuditLog {
  logId: number;
  actorId: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  previousValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: string;
  isMLGenerated: boolean;
  mlModelVersion?: string | null;
}

export interface PredictiveModel {
  modelId: number;
  name: string;
  version: string;
  type: ModelType;
  artifactUrl?: string | null;
  metrics?: string | null;
  isActive: boolean;
  trainedAt: string;
}

export interface PredictiveModelRequestDto {
  name: string;
  version: string;
  type: ModelType;
  artifactUrl?: string | null;
  metrics?: string | null;
  isActive?: boolean | null;
  trainedAt?: string | null;
}
