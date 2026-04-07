import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationService } from '../../../core/services/conversation.service';
import {
  Conversation,
  ConversationRequest,
  ConvoType
} from '../models/conversation.model';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conversations.component.html',
  styleUrl: './conversations.component.scss'
})
export class ConversationsComponent implements OnInit {
  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];

  loading = false;
  saving = false;
  editMode = false;
  showModal = false;
  selectedId: number | null = null;
  searchTerm = '';

  convoTypes: ConvoType[] = ['TASK_CHAT', 'DIRECT', 'GROUP'];

  form: ConversationRequest = {
    type: 'DIRECT',
    relatedEntityId: null,
    relatedEntityType: '',
    participantIds: [],
    lastMessageAt: null
  };

  participantIdsText = '';

  constructor(private conversationService: ConversationService) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(): void {
    this.loading = true;
    this.conversationService.getAllConversations().subscribe({
      next: (res) => {
        this.conversations = res;
        this.filteredConversations = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Load conversations error', err);
        this.loading = false;
      }
    });
  }

  filterConversations(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredConversations = this.conversations;
      return;
    }

    this.filteredConversations = this.conversations.filter(item =>
      item.type?.toLowerCase().includes(term) ||
      item.relatedEntityType?.toLowerCase().includes(term) ||
      item.participantIds?.join(',').includes(term)
    );
  }

  openCreateModal(): void {
    this.editMode = false;
    this.showModal = true;
    this.selectedId = null;
    this.resetForm();
  }

  openEditModal(item: Conversation): void {
    this.editMode = true;
    this.showModal = true;
    this.selectedId = item.conversationId;

    this.form = {
      type: item.type,
      relatedEntityId: item.relatedEntityId,
      relatedEntityType: item.relatedEntityType,
      participantIds: [...(item.participantIds || [])],
      lastMessageAt: item.lastMessageAt
    };

    this.participantIdsText = (item.participantIds || []).join(', ');
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.form = {
      type: 'DIRECT',
      relatedEntityId: null,
      relatedEntityType: '',
      participantIds: [],
      lastMessageAt: null
    };
    this.participantIdsText = '';
    this.editMode = false;
    this.selectedId = null;
  }

  parseParticipantIds(): number[] {
    return this.participantIdsText
      .split(',')
      .map(x => x.trim())
      .filter(x => x !== '')
      .map(x => Number(x))
      .filter(x => !isNaN(x));
  }

  submit(): void {
    this.saving = true;

    const payload: ConversationRequest = {
      ...this.form,
      participantIds: this.parseParticipantIds()
    };

    const request$ = this.editMode && this.selectedId
      ? this.conversationService.updateConversation(this.selectedId, payload)
      : this.conversationService.createConversation(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadConversations();
      },
      error: (err) => {
        console.error('Save conversation error', err);
        this.saving = false;
      }
    });
  }

  remove(id: number): void {
    if (!confirm('Delete this conversation?')) return;

    this.conversationService.deleteConversation(id).subscribe({
      next: () => this.loadConversations(),
      error: (err) => console.error('Delete conversation error', err)
    });
  }
}