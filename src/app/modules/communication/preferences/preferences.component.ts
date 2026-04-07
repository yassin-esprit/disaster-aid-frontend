import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationPreferenceService } from '../../../core/services/notification-preference.service';
import {
  NotificationPreference,
  NotificationPreferenceRequest,
  Channel,
  NotifType
} from '../models/notification-preference.model';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.scss'
})
export class PreferencesComponent implements OnInit {
  preferences: NotificationPreference[] = [];
  filteredPreferences: NotificationPreference[] = [];

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

  form: NotificationPreferenceRequest = {
    userId: 0,
    type: 'SYSTEM',
    channels: [],
    enabled: true,
    quietHoursFrom: null,
    quietHoursTo: null
  };

  constructor(private preferenceService: NotificationPreferenceService) {}

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.loading = true;
    this.preferenceService.getAllPreferences().subscribe({
      next: (res) => {
        this.preferences = res;
        this.filteredPreferences = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Load preferences error', err);
        this.loading = false;
      }
    });
  }

  filterPreferences(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredPreferences = this.preferences;
      return;
    }

    this.filteredPreferences = this.preferences.filter(item =>
      item.userEmail?.toLowerCase().includes(term) ||
      item.type?.toLowerCase().includes(term)
    );
  }

  openCreateModal(): void {
    this.editMode = false;
    this.showModal = true;
    this.selectedId = null;
    this.resetForm();
  }

  openEditModal(item: NotificationPreference): void {
    this.editMode = true;
    this.showModal = true;
    this.selectedId = item.prefId;

    this.form = {
      userId: item.userId,
      type: item.type,
      channels: [...item.channels],
      enabled: item.enabled,
      quietHoursFrom: item.quietHoursFrom,
      quietHoursTo: item.quietHoursTo
    };
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.form = {
      userId: 0,
      type: 'SYSTEM',
      channels: [],
      enabled: true,
      quietHoursFrom: null,
      quietHoursTo: null
    };
    this.editMode = false;
    this.selectedId = null;
  }

  onChannelToggle(channel: Channel, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.form.channels.includes(channel)) {
        this.form.channels = [...this.form.channels, channel];
      }
    } else {
      this.form.channels = this.form.channels.filter(c => c !== channel);
    }
  }

  isChannelSelected(channel: Channel): boolean {
    return this.form.channels.includes(channel);
  }

  submit(): void {
    this.saving = true;

    const request$ = this.editMode && this.selectedId
      ? this.preferenceService.updatePreference(this.selectedId, this.form)
      : this.preferenceService.createPreference(this.form);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadPreferences();
      },
      error: (err) => {
        console.error('Save preference error', err);
        this.saving = false;
      }
    });
  }

  remove(id: number): void {
    if (!confirm('Delete this preference?')) return;

    this.preferenceService.deletePreference(id).subscribe({
      next: () => this.loadPreferences(),
      error: (err) => console.error('Delete preference error', err)
    });
  }
}