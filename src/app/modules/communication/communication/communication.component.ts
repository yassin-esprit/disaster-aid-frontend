import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NotificationsComponent } from '../notifications/notifications.component';
import { PreferencesComponent } from '../preferences/preferences.component';
import { ConversationsComponent } from '../conversations/conversations.component';
import { MessagesComponent } from '../messages/messages.component';
import { ManageDiscussionRequestsComponent } from '../manage-discussion-requests/manage-discussion-requests.component';

type CommunicationTab =
  | 'notifications'
  | 'preferences'
  | 'conversations'
  | 'messages'
  | 'requests';

@Component({
  selector: 'app-communication',
  standalone: true,
  imports: [
    CommonModule,
    NotificationsComponent,
    PreferencesComponent,
    ConversationsComponent,
    MessagesComponent,
    ManageDiscussionRequestsComponent,
    FormsModule
  ],
  templateUrl: './communication.component.html',
  styleUrl: './communication.component.scss'
})
export class CommunicationComponent implements OnInit {
  private readonly lastConversationStorageKey = 'bo_selected_conversation_id';
  currentUserRole = (localStorage.getItem('role') || '').toUpperCase();
  selectedConversationId: number | null = null;

  activeTab: CommunicationTab = this.isAdmin() ? 'requests' : 'conversations';

  ngOnInit(): void {
    const storedConversationId = Number(localStorage.getItem(this.lastConversationStorageKey));
    this.selectedConversationId = Number.isFinite(storedConversationId) && storedConversationId > 0
      ? storedConversationId
      : null;
  }

  isAdmin(): boolean {
    return [
      'PLATFORM_ADMIN',
      'ORG_ADMIN',
      'AGENCY_ADMIN',
      'ADMIN'
    ].includes(this.currentUserRole);
  }

  setTab(tab: CommunicationTab): void {
    this.activeTab = tab;
  }

  onRequestAccepted(conversationId: number): void {
    this.selectedConversationId = conversationId;
    localStorage.setItem(this.lastConversationStorageKey, String(conversationId));
    this.activeTab = 'messages';
  }
}