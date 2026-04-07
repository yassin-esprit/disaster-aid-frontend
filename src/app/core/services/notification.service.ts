import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { Notification, NotificationRequest } from '../../modules/communication/models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private httpService: HttpService) {}

  getAllNotifications(): Observable<Notification[]> {
    return this.httpService.get<Notification[]>('/communication/notifications/retrieve-all-notifications');
  }

  getMyNotifications(): Observable<Notification[]> {
    return this.httpService.get<Notification[]>('/communication/notifications/my-notifications');
  }

  getNotificationById(id: number): Observable<Notification> {
    return this.httpService.get<Notification>(`/communication/notifications/retrieve-notification/${id}`);
  }

  createNotification(data: NotificationRequest): Observable<Notification> {
    return this.httpService.post<Notification>('/communication/notifications/add-notification', data);
  }

  updateNotification(id: number, data: NotificationRequest): Observable<Notification> {
    return this.httpService.put<Notification>(`/communication/notifications/update-notification/${id}`, data);
  }

  deleteNotification(id: number): Observable<void> {
    return this.httpService.delete<void>(`/communication/notifications/remove-notification/${id}`);
  }
}