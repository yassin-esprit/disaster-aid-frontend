export interface EvacuationRoute {
  id: number;
  alertId: number;
  toShelterId: number;
  path: string;            // WKT linestring
  estimatedDurationMin: number;
  capacity: number;
  status: 'PLANNED' | 'ACTIVE' | 'BLOCKED' | 'CLOSED';
  activatedAt: string | null;
  closedAt: string | null;
}

export interface RouteCheckpoint {
  id: number;
  routeId: number;
  location: string;        // WKT point
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
