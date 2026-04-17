import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CoordinationStats {
  openRequests: number;
  resolvedToday: number;
  activeAssignments: number;
  avgResponseTimeMin: number;
  pendingIncidents: number;
  avgCredibilityScore: number;
}

export interface HelpRequest {
  id?: number;
  reporterId?: number;
  alertId?: number;
  type: string;
  urgency: number;
  location: string;
  description: string;
  status?: string;
  assignedResponderId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskAssignment {
  id?: number;
  helpRequestId?: number;
  responderId?: number;
  status?: string;
  mlScoreAtAssignment?: number;
  notes?: string;
  completionNote?: string;
  rating?: number;
  responseTimeMin?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VolunteerOffer {
  id?: number;
  volunteerId?: number;
  skills?: string;
  location?: string;
  availableFrom?: string;
  availableTo?: string;
  maxRadiusKm?: number;
  status?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CoordinationService {
  private helpBase = `${environment.apiUrl}/help-requests`;
  private taskBase = `${environment.apiUrl}/assignments`;
  private offerBase = `${environment.apiUrl}/volunteer-offers`;

  constructor(private http: HttpClient) {}

  // Help Requests
  getAllRequests(): Observable<HelpRequest[]> {
    return this.http
      .get<ApiResponse<HelpRequest[]>>(this.helpBase)
      .pipe(map((r) => r.data));
  }

  createRequest(req: HelpRequest): Observable<HelpRequest> {
    return this.http
      .post<ApiResponse<HelpRequest>>(this.helpBase, req)
      .pipe(map((r) => r.data));
  }

  updateRequest(id: number, req: HelpRequest): Observable<HelpRequest> {
    return this.http
      .put<ApiResponse<HelpRequest>>(`${this.helpBase}/${id}`, req)
      .pipe(map((r) => r.data));
  }

  deleteRequest(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.helpBase}/${id}`)
      .pipe(map(() => void 0));
  }

  getRequestsByStatus(status: string): Observable<HelpRequest[]> {
    return this.http
      .get<ApiResponse<HelpRequest[]>>(`${this.helpBase}/status/${status}`)
      .pipe(map((r) => r.data));
  }

  // Task Assignments
  getAllAssignments(): Observable<TaskAssignment[]> {
    return this.http
      .get<ApiResponse<TaskAssignment[]>>(this.taskBase)
      .pipe(map((r) => r.data));
  }

  getAssignmentsByRequest(requestId: number): Observable<TaskAssignment[]> {
    return this.http
      .get<
        ApiResponse<TaskAssignment[]>
      >(`${this.taskBase}/help-request/${requestId}`)
      .pipe(map((r) => r.data));
  }

  createAssignment(
    requestId: number,
    a: TaskAssignment,
  ): Observable<TaskAssignment> {
    return this.http
      .post<
        ApiResponse<TaskAssignment>
      >(`${this.taskBase}/help-request/${requestId}`, a)
      .pipe(map((r) => r.data));
  }

  updateAssignmentStatus(
    id: number,
    status: string,
  ): Observable<TaskAssignment> {
    return this.http
      .patch<
        ApiResponse<TaskAssignment>
      >(`${this.taskBase}/${id}/status?status=${status}`, {})
      .pipe(map((r) => r.data));
  }

  deleteAssignment(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.taskBase}/${id}`)
      .pipe(map(() => void 0));
  }

  // Volunteer Offers
  getAllOffers(): Observable<VolunteerOffer[]> {
    return this.http
      .get<ApiResponse<VolunteerOffer[]>>(this.offerBase)
      .pipe(map((r) => r.data));
  }

  createOffer(offer: VolunteerOffer): Observable<VolunteerOffer> {
    return this.http
      .post<ApiResponse<VolunteerOffer>>(this.offerBase, offer)
      .pipe(map((r) => r.data));
  }

  deleteOffer(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.offerBase}/${id}`)
      .pipe(map(() => void 0));
  }

  getStats(): Observable<CoordinationStats> {
    return this.http.get<ApiResponse<CoordinationStats>>(`${environment.apiUrl}/coordination/stats`)
      .pipe(map(r => r.data));
  }
}
