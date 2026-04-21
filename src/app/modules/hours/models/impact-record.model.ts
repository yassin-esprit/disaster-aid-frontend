export type ConfidenceLevel = 'ESTIMATED' | 'CALIBRATED' | 'VERIFIED';

export interface ImpactRecord {
  impactId: number;
  volunteerId: number;
  totalApprovedHours: number;
  co2OffsetKg: number;
  mealsServed: number;
  peopleHelped: number;
  wasteRemovedKg: number;
  hoursOfTutoring: number;
  confidenceLevel: ConfidenceLevel;
  lastCalculatedAt: string;
}

export interface ImpactRecordRequest {
  volunteerId: number;
  totalApprovedHours: number;
  co2OffsetKg: number;
  mealsServed: number;
  peopleHelped: number;
  wasteRemovedKg: number;
  hoursOfTutoring: number;
  confidenceLevel: ConfidenceLevel;
}
