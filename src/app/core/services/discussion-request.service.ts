import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AiPrediction,
  DiscussionRequest,
  DiscussionRequestCreate
} from '../../modules/communication/models/discussion-request.model';

@Injectable({
  providedIn: 'root'
})
export class DiscussionRequestService {
  private apiUrl = `${environment.apiUrl}/api/conversation-requests`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  createRequest(citizenId: number, payload: DiscussionRequestCreate): Observable<DiscussionRequest> {
    return this.http.post<DiscussionRequest>(
      `${this.apiUrl}/citizen/${citizenId}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  getPendingRequests(): Observable<DiscussionRequest[]> {
    return this.http.get<DiscussionRequest[]>(
      `${this.apiUrl}/pending`,
      { headers: this.getAuthHeaders() }
    );
  }

  getRequestsByCitizen(citizenId: number): Observable<DiscussionRequest[]> {
    return this.http.get<DiscussionRequest[]>(
      `${this.apiUrl}/citizen/${citizenId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getRequestsByAdmin(adminId: number): Observable<DiscussionRequest[]> {
    return this.http.get<DiscussionRequest[]>(
      `${this.apiUrl}/admin/${adminId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  acceptRequest(requestId: number, adminId: number): Observable<DiscussionRequest> {
    return this.http.put<DiscussionRequest>(
      `${this.apiUrl}/${requestId}/accept/admin/${adminId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  rejectRequest(requestId: number, adminId: number): Observable<DiscussionRequest> {
    return this.http.put<DiscussionRequest>(
      `${this.apiUrl}/${requestId}/reject/admin/${adminId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  predictRequest(data: { subject: string; description: string }): Observable<AiPrediction> {
    return this.http.post<AiPrediction>(
      `${this.apiUrl}/predict`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }
}