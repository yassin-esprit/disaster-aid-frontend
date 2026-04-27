import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CheckInPayload,
  ResourceEntity,
  ResourcePayload,
  ShelterEntity,
  ShelterOccupantEntity,
  ShelterPayload,
  UserEntity,
} from '../../../shared/models/resource-shelter/resource-shelter.model';

@Injectable({ providedIn: 'root' })
export class ResourceShelterService {
  private readonly apiUrl = environment.apiUrl;

  private readonly baseUrl = environment.apiUrl.replace('/api', '');

  constructor(private readonly http: HttpClient) {}

  private get headers(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    let h = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    if (token) {
      h = h.set('Authorization', `Bearer ${token}`);
    }
    return { headers: h };
  }

  getAllResources(): Observable<ResourceEntity[]> {
    return this.http.get<ResourceEntity[]>(`${this.baseUrl}/resource-shelter/resources`, this.headers);
  }

  createResource(payload: ResourcePayload): Observable<ResourceEntity> {
    return this.http.post<ResourceEntity>(`${this.baseUrl}/resource-shelter/resources`, payload, this.headers);
  }

  updateResource(resourceId: number, payload: ResourcePayload): Observable<ResourceEntity> {
    return this.http.put<ResourceEntity>(`${this.baseUrl}/resource-shelter/resources/${resourceId}`, payload, this.headers);
  }

  deleteResource(resourceId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/resource-shelter/resources/${resourceId}`, this.headers);
  }

  getAllShelters(): Observable<ShelterEntity[]> {
    return this.http.get<ShelterEntity[]>(`${this.baseUrl}/resource-shelter/shelters`, this.headers);
  }

  createShelter(payload: ShelterPayload): Observable<ShelterEntity> {
    return this.http.post<ShelterEntity>(`${this.baseUrl}/resource-shelter/shelters`, payload, this.headers);
  }

  updateShelter(shelterId: number, payload: ShelterPayload): Observable<ShelterEntity> {
    return this.http.put<ShelterEntity>(`${this.baseUrl}/resource-shelter/shelters/${shelterId}`, payload, this.headers);
  }

  deleteShelter(shelterId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/resource-shelter/shelters/${shelterId}`, this.headers);
  }

  getAllUsers(): Observable<UserEntity[]> {
    return this.http.get<UserEntity[]>(`${this.apiUrl}/identity-access/users`, this.headers);
  }

  createUser(name: string): Observable<UserEntity> {
    return this.http.post<UserEntity>(`${this.apiUrl}/identity-access/users`, { 
      firstName: name, 
      lastName: 'Agency', 
      email: `agency_${Date.now()}@test.com`, 
      password: 'Password123!', 
      role: 'AGENCY_ADMIN' 
    }, this.headers);
  }

  checkInShelter(payload: CheckInPayload): Observable<ShelterOccupantEntity> {
    return this.http.post<ShelterOccupantEntity>(`${this.baseUrl}/resource-shelter/shelter-occupants/check-in`, payload, this.headers);
  }

  getShelterOccupantsByShelter(shelterId: number): Observable<ShelterOccupantEntity[]> {
    return this.http.get<ShelterOccupantEntity[]>(`${this.baseUrl}/resource-shelter/shelter-occupants?shelterId=${shelterId}`, this.headers);
  }

  checkOutShelter(recordId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/resource-shelter/shelter-occupants/${recordId}/check-out`, {}, this.headers);
  }
}
