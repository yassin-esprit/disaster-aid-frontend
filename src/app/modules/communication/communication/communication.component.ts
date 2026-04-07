import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotificationsComponent } from '../notifications/notifications.component';
import { PreferencesComponent } from '../preferences/preferences.component';
import { ConversationsComponent } from '../conversations/conversations.component';
import { MessagesComponent } from '../messages/messages.component';

@Component({
  selector: 'app-communication',
  standalone: true,
  imports: [
    CommonModule,
    NotificationsComponent,
    PreferencesComponent,
    ConversationsComponent,
    MessagesComponent
  ],
  templateUrl: './communication.component.html',
  styleUrl: './communication.component.scss'
})
export class CommunicationComponent {
  activeTab: 'notifications' | 'preferences' | 'conversations' | 'messages' = 'notifications';

  setTab(tab: 'notifications' | 'preferences' | 'conversations' | 'messages'): void {
    this.activeTab = tab;
  }
}