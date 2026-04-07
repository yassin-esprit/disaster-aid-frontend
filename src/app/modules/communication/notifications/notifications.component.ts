import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification, NotificationRequest, Channel, NotifType } from '../models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];

  loading = false;
  saving = false;
  editMode = false;
  showModal = false;
  selectedId: number | null = null;
  searchTerm = '';

  channels: Channel[] = ['PUSH', 'SMS', 'EMAIL', 'IN_APP'];
  notifTypes: NotifType[] = [
    'ALERT_BROADCAST',
    'TASK_ASSIGNED',
    'APPLICATION_UPDATE',
    'ACHIEVEMENT_EARNED',
    'SYSTEM',
    'CHAT'
  ];

  form: NotificationRequest = {
    recipientId: 0,
    type: 'SYSTEM',
    title: '',
    body: '',
    data: '',
    channel: 'IN_APP',
    isRead: false,
    isCritical: false,
    sentAt: null,
    readAt: null
  };

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getAllNotifications().subscribe({
      next: (res) => {
        this.notifications = res;
        this.filteredNotifications = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Load notifications error', err);
        this.loading = false;
      }
    });
  }

  filterNotifications(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredNotifications = this.notifications;
      return;
    }

    this.filteredNotifications = this.notifications.filter(item =>
      item.title?.toLowerCase().includes(term) ||
      item.recipientEmail?.toLowerCase().includes(term) ||
      item.type?.toLowerCase().includes(term) ||
      item.channel?.toLowerCase().includes(term)
    );
  }

  openCreateModal(): void {
    this.editMode = false;
    this.showModal = true;
    this.selectedId = null;
    this.resetForm();
  }

  openEditModal(item: Notification): void {
    this.editMode = true;
    this.showModal = true;
    this.selectedId = item.notificationId;

    this.form = {
      recipientId: item.recipientId,
      type: item.type,
      title: item.title,
      body: item.body,
      data: item.data,
      channel: item.channel,
      isRead: item.isRead,
      isCritical: item.isCritical,
      sentAt: item.sentAt,
      readAt: item.readAt
    };
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.form = {
      recipientId: 0,
      type: 'SYSTEM',
      title: '',
      body: '',
      data: '',
      channel: 'IN_APP',
      isRead: false,
      isCritical: false,
      sentAt: null,
      readAt: null
    };
    this.editMode = false;
    this.selectedId = null;
  }

  submit(): void {
    this.saving = true;

    const request$ = this.editMode && this.selectedId
      ? this.notificationService.updateNotification(this.selectedId, this.form)
      : this.notificationService.createNotification(this.form);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadNotifications();
      },
      error: (err) => {
        console.error('Save notification error', err);
        this.saving = false;
      }
    });
  }

  remove(id: number): void {
    if (!confirm('Delete this notification?')) return;

    this.notificationService.deleteNotification(id).subscribe({
      next: () => this.loadNotifications(),
      error: (err) => console.error('Delete notification error', err)
    });
  }
}