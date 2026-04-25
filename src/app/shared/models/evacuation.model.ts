export interface EvacuationRoute {
  id: number;
  alertId: number;
  alertTitle: string | null;
  toShelterId: number | null;
  shelterName: string | null;
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
  path: string;
  distanceKm: number | null;
  estimatedDurationMin: number | null;
  capacity: number | null;
  status: 'PLANNED' | 'ACTIVE' | 'BLOCKED' | 'CLOSED';
  activatedAt: string | null;
  closedAt: string | null;
}

export interface RouteCheckpoint {
  id: number;
  routeId: number;
  location: string;
  label: string;
  type: 'WAYPOINT' | 'MEDICAL_STOP' | 'SUPPLY_POINT';
  responderIds: number[];
  isActive: boolean;
}

export interface ZoneShelterAssignment {
  id: number;
  geofenceZoneId: number;
  shelterId: number;
  priority: number;
  estimatedUsersCount: number;
  createdAt: string;
}
