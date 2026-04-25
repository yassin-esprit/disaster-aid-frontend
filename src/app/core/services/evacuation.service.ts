import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { EvacuationRoute, RouteCheckpoint, ZoneShelterAssignment } from '../../shared/models/evacuation.model';

@Injectable({ providedIn: 'root' })
export class EvacuationService {
  constructor(private http: HttpService) {}

  getAllRoutes(): Observable<EvacuationRoute[]> {
    return this.http.get<EvacuationRoute[]>('/evacuation-routes');
  }

  getRouteById(id: number): Observable<EvacuationRoute> {
    return this.http.get<EvacuationRoute>(`/evacuation-routes/${id}`);
  }

  getRoutesByAlert(alertId: number): Observable<EvacuationRoute[]> {
    return this.http.get<EvacuationRoute[]>(`/evacuation-routes/alert/${alertId}`);
  }

  getRoutesByStatus(status: string): Observable<EvacuationRoute[]> {
    return this.http.get<EvacuationRoute[]>(`/evacuation-routes/status/${status}`);
  }

  createRoute(route: Partial<EvacuationRoute>): Observable<EvacuationRoute> {
    return this.http.post<EvacuationRoute>('/evacuation-routes', route);
  }

  updateRoute(id: number, route: Partial<EvacuationRoute>): Observable<EvacuationRoute> {
    return this.http.put<EvacuationRoute>(`/evacuation-routes/${id}`, route);
  }

  recomputeRoute(id: number): Observable<EvacuationRoute> {
    return this.http.patch<EvacuationRoute>(`/evacuation-routes/${id}/recompute`, {});
  }

  activateRoute(id: number): Observable<EvacuationRoute> {
    return this.http.patch<EvacuationRoute>(`/evacuation-routes/${id}/activate`, {});
  }

  closeRoute(id: number): Observable<EvacuationRoute> {
    return this.http.patch<EvacuationRoute>(`/evacuation-routes/${id}/close`, {});
  }

  deleteRoute(id: number): Observable<void> {
    return this.http.delete<void>(`/evacuation-routes/${id}`);
  }

  getAllCheckpoints(): Observable<RouteCheckpoint[]> {
    return this.http.get<RouteCheckpoint[]>('/route-checkpoints');
  }

  getCheckpointById(id: number): Observable<RouteCheckpoint> {
    return this.http.get<RouteCheckpoint>(`/route-checkpoints/${id}`);
  }

  getCheckpointsByRoute(routeId: number): Observable<RouteCheckpoint[]> {
    return this.http.get<RouteCheckpoint[]>(`/route-checkpoints/route/${routeId}`);
  }

  createCheckpoint(checkpoint: Partial<RouteCheckpoint>): Observable<RouteCheckpoint> {
    return this.http.post<RouteCheckpoint>('/route-checkpoints', checkpoint);
  }

  updateCheckpoint(id: number, checkpoint: Partial<RouteCheckpoint>): Observable<RouteCheckpoint> {
    return this.http.put<RouteCheckpoint>(`/route-checkpoints/${id}`, checkpoint);
  }

  deleteCheckpoint(id: number): Observable<void> {
    return this.http.delete<void>(`/route-checkpoints/${id}`);
  }

  getAllAssignments(): Observable<ZoneShelterAssignment[]> {
    return this.http.get<ZoneShelterAssignment[]>('/zone-shelter-assignments');
  }

  getAssignmentById(id: number): Observable<ZoneShelterAssignment> {
    return this.http.get<ZoneShelterAssignment>(`/zone-shelter-assignments/${id}`);
  }

  getAssignmentsByZone(zoneId: number): Observable<ZoneShelterAssignment[]> {
    return this.http.get<ZoneShelterAssignment[]>(`/zone-shelter-assignments/zone/${zoneId}`);
  }

  getAssignmentsByShelter(shelterId: number): Observable<ZoneShelterAssignment[]> {
    return this.http.get<ZoneShelterAssignment[]>(`/zone-shelter-assignments/shelter/${shelterId}`);
  }

  createAssignment(assignment: Partial<ZoneShelterAssignment>): Observable<ZoneShelterAssignment> {
    return this.http.post<ZoneShelterAssignment>('/zone-shelter-assignments', assignment);
  }

  updateAssignment(id: number, assignment: Partial<ZoneShelterAssignment>): Observable<ZoneShelterAssignment> {
    return this.http.put<ZoneShelterAssignment>(`/zone-shelter-assignments/${id}`, assignment);
  }

  deleteAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`/zone-shelter-assignments/${id}`);
  }
}
