export type InterventionType =
  | 'OPPORTUNITY_REC'
  | 'TEAM_CHALLENGE'
  | 'ACHIEVEMENT_NUDGE';

export interface VolunteerAnalyticsReportDto {
  totalApprovedHours: number;
  totalOpportunities: number;
  avgChurnProbability: number;
  highRiskVolunteers: number;
  organisationsTracked: number;
}

export interface VolunteerStatistics {
  statId: number;
  volunteerId: number;
  totalApprovedHours: number;
  totalOpportunities: number;
  causeDistribution?: string | null;
  skillsUtilised?: string | null;
  avgRating?: number | null;
  currentStreak: number;
  longestStreak: number;
  achievementCount: number;
  lastActivityDate?: string | null;
  churnProbability?: number | null;
  computedAt: string;
}

export interface OrganisationStats {
  statId: number;
  orgId: number;
  totalVolunteers: number;
  activeVolunteers: number;
  totalHoursDelivered: number;
  retentionRate?: number | null;
  avgRating?: number | null;
  skillCoverage?: string | null;
  openPositions: number;
  computedAt: string;
}

export interface ChurnPrediction {
  predictionId: number;
  volunteerId: number;
  predictedChurnProb: number;
  interventionType: InterventionType;
  predictedAt: string;
  reactivated: boolean;
  reactivatedAt?: string | null;
  modelVersion?: string | null;
}
