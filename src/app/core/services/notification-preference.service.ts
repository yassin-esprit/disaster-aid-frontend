import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import {
  NotificationPreference,
  NotificationPreferenceRequest
} from '../../modules/communication/models/notification-preference.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationPreferenceService {
  constructor(private httpService: HttpService) {}

  getAllPreferences(): Observable<NotificationPreference[]> {
    return this.httpService.get<NotificationPreference[]>('/communication/preferences/retrieve-all');
  }

  getMyPreferences(): Observable<NotificationPreference[]> {
    return this.httpService.get<NotificationPreference[]>('/communication/preferences/me');
  }

  getPreferenceById(id: number): Observable<NotificationPreference> {
    return this.httpService.get<NotificationPreference>(`/communication/preferences/${id}`);
  }

  createPreference(data: NotificationPreferenceRequest): Observable<NotificationPreference> {
    return this.httpService.post<NotificationPreference>('/communication/preferences/add', data);
  }

  updatePreference(id: number, data: NotificationPreferenceRequest): Observable<NotificationPreference> {
    return this.httpService.put<NotificationPreference>(`/communication/preferences/update/${id}`, data);
  }

  deletePreference(id: number): Observable<void> {
    return this.httpService.delete<void>(`/communication/preferences/delete/${id}`);
  }
}