import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ResourceEntity,
  ResourcePayload,
  ShelterOccupantEntity,
  ShelterOccupantPayload,
  ResourceShelterUser,
  ShelterEntity,
  ShelterPayload,
} from '../../../shared/models/resource-shelter/resource-shelter.model';

@Injectable({
  providedIn: 'root',
})
export class ResourceShelterService {
  private readonly baseUrl = `${environment.backendUrl}/resource-shelter`;

  constructor(private readonly http: HttpClient) {}

  getAllResources(): Observable<ResourceEntity[]> {
    return this.http.get<ResourceEntity[]>(`${this.baseUrl}/resources`);
  }

  createResource(payload: ResourcePayload): Observable<ResourceEntity> {
    return this.http.post<ResourceEntity>(`${this.baseUrl}/resources`, payload);
  }

  updateResource(
    id: number,
    payload: ResourcePayload,
  ): Observable<ResourceEntity> {
    return this.http.put<ResourceEntity>(`${this.baseUrl}/resources/${id}`, payload);
  }

  deleteResource(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/resources/${id}`);
  }

  getAllShelters(): Observable<ShelterEntity[]> {
    return this.http.get<ShelterEntity[]>(`${this.baseUrl}/shelters`);
  }

  createShelter(payload: ShelterPayload): Observable<ShelterEntity> {
    return this.http.post<ShelterEntity>(`${this.baseUrl}/shelters`, payload);
  }

  updateShelter(id: number, payload: ShelterPayload): Observable<ShelterEntity> {
    return this.http.put<ShelterEntity>(`${this.baseUrl}/shelters/${id}`, payload);
  }

  deleteShelter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/shelters/${id}`);
  }

  checkInShelter(payload: ShelterOccupantPayload): Observable<ShelterOccupantEntity> {
    return this.http.post<ShelterOccupantEntity>(
      `${this.baseUrl}/shelter-occupants/check-in`,
      payload,
    );
  }

  checkOutShelter(recordId: number): Observable<ShelterOccupantEntity> {
    return this.http.post<ShelterOccupantEntity>(
      `${this.baseUrl}/shelter-occupants/${recordId}/check-out`,
      {},
    );
  }

  getShelterOccupantsByShelter(
    shelterId: number,
  ): Observable<ShelterOccupantEntity[]> {
    return this.http.get<ShelterOccupantEntity[]>(
      `${this.baseUrl}/shelter-occupants/by-shelter/${shelterId}`,
    );
  }

  getAllUsers(): Observable<ResourceShelterUser[]> {
    return this.http.get<ResourceShelterUser[]>(`${this.baseUrl}/users`);
  }

  createUser(name: string): Observable<ResourceShelterUser> {
    return this.http.post<ResourceShelterUser>(`${this.baseUrl}/users`, { name });
  }
}
