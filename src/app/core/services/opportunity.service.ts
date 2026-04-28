import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Opportunity {
  id?: number;
  orgId?: number;
  title: string;
  description?: string;
  category: string;
  location?: string;
  isRemote?: boolean;
  scheduledDate?: string;
  durationHours?: number;
  slots: number;
  filledSlots?: number;
  status?: string;
  minAge?: number;
  requiresBackgroundCheck?: boolean;
  requiredSkillIds?: number[];
  closedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Application {
  id?: number;
  opportunityId: number;
  volunteerId: number;
  status?: string;
  motivationLetter?: string;
  mlMatchScore?: number;
  decidedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OpportunityStats {
  totalOpportunities: number;
  openOpportunities: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class OpportunityService {
  private opportunitiesBase = `${environment.apiUrl}/v1/opportunities`;
  private applicationsBase = `${environment.apiUrl}/v1/applications`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Opportunity[]> {
    return this.http
      .get<ApiResponse<Opportunity[]>>(this.opportunitiesBase)
      .pipe(map((r) => r.data));
  }

  getById(id: number): Observable<Opportunity> {
    return this.http
      .get<ApiResponse<Opportunity>>(`${this.opportunitiesBase}/${id}`)
      .pipe(map((r) => r.data));
  }

  getByStatus(status: string): Observable<Opportunity[]> {
    return this.http
      .get<ApiResponse<Opportunity[]>>(`${this.opportunitiesBase}/status/${status}`)
      .pipe(map((r) => r.data));
  }

  getByOrgId(orgId: number): Observable<Opportunity[]> {
    return this.http
      .get<ApiResponse<Opportunity[]>>(`${this.opportunitiesBase}/org/${orgId}`)
      .pipe(map((r) => r.data));
  }

  getByCategory(category: string): Observable<Opportunity[]> {
    return this.http
      .get<ApiResponse<Opportunity[]>>(`${this.opportunitiesBase}/category/${category}`)
      .pipe(map((r) => r.data));
  }

  create(opportunity: Opportunity): Observable<Opportunity> {
    return this.http
      .post<ApiResponse<Opportunity>>(this.opportunitiesBase, opportunity)
      .pipe(map((r) => r.data));
  }

  update(id: number, opportunity: Opportunity): Observable<Opportunity> {
    return this.http
      .put<ApiResponse<Opportunity>>(
        `${this.opportunitiesBase}/${id}`,
        opportunity,
      )
      .pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.opportunitiesBase}/${id}`)
      .pipe(map(() => void 0));
  }

  close(id: number): Observable<Opportunity> {
    return this.http
      .patch<ApiResponse<Opportunity>>(`${this.opportunitiesBase}/${id}/close`, {})
      .pipe(map((r) => r.data));
  }

  getStats(): Observable<OpportunityStats> {
    return this.http
      .get<ApiResponse<OpportunityStats>>(`${this.opportunitiesBase}/stats`)
      .pipe(map((r) => r.data));
  }

  getAllApplications(): Observable<Application[]> {
    return this.http
      .get<ApiResponse<Application[]>>(this.applicationsBase)
      .pipe(map((r) => r.data));
  }

  getByOpportunity(opportunityId: number): Observable<Application[]> {
    return this.http
      .get<ApiResponse<Application[]>>(
        `${this.applicationsBase}/opportunity/${opportunityId}`,
      )
      .pipe(map((r) => r.data));
  }

  getByVolunteer(volunteerId: number): Observable<Application[]> {
    return this.http
      .get<ApiResponse<Application[]>>(
        `${this.applicationsBase}/volunteer/${volunteerId}`,
      )
      .pipe(map((r) => r.data));
  }

  apply(application: Application): Observable<Application> {
    return this.http
      .post<ApiResponse<Application>>(this.applicationsBase, application)
      .pipe(map((r) => r.data));
  }

  accept(id: number): Observable<Application> {
    return this.http
      .patch<ApiResponse<Application>>(`${this.applicationsBase}/${id}/accept`, {})
      .pipe(map((r) => r.data));
  }

  reject(id: number): Observable<Application> {
    return this.http
      .patch<ApiResponse<Application>>(`${this.applicationsBase}/${id}/reject`, {})
      .pipe(map((r) => r.data));
  }

  withdraw(id: number): Observable<Application> {
    return this.http
      .patch<ApiResponse<Application>>(`${this.applicationsBase}/${id}/withdraw`, {})
      .pipe(map((r) => r.data));
  }
}
