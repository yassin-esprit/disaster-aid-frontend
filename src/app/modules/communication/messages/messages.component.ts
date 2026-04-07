import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../../core/services/message.service';
import { Message, MessageRequest } from '../models/message.model';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit {
  messages: Message[] = [];
  filteredMessages: Message[] = [];

  loading = false;
  saving = false;
  editMode = false;
  showModal = false;
  selectedId: number | null = null;
  searchTerm = '';

  form: MessageRequest = {
    conversationId: 0,
    senderId: 0,
    body: '',
    attachments: [],
    sentAt: null,
    editedAt: null,
    isDeleted: false
  };

  attachmentsText = '';

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.loading = true;
    this.messageService.getAllMessages().subscribe({
      next: (res) => {
        this.messages = res;
        this.filteredMessages = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Load messages error', err);
        this.loading = false;
      }
    });
  }

  filterMessages(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredMessages = this.messages;
      return;
    }

    this.filteredMessages = this.messages.filter(item =>
      item.senderEmail?.toLowerCase().includes(term) ||
      item.body?.toLowerCase().includes(term) ||
      String(item.conversationId).includes(term)
    );
  }

  openCreateModal(): void {
    this.editMode = false;
    this.showModal = true;
    this.selectedId = null;
    this.resetForm();
  }

  openEditModal(item: Message): void {
    this.editMode = true;
    this.showModal = true;
    this.selectedId = item.messageId;

    this.form = {
      conversationId: item.conversationId,
      senderId: item.senderId,
      body: item.body,
      attachments: [...(item.attachments || [])],
      sentAt: item.sentAt,
      editedAt: item.editedAt,
      isDeleted: item.isDeleted
    };

    this.attachmentsText = (item.attachments || []).join(', ');
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.form = {
      conversationId: 0,
      senderId: 0,
      body: '',
      attachments: [],
      sentAt: null,
      editedAt: null,
      isDeleted: false
    };
    this.attachmentsText = '';
    this.editMode = false;
    this.selectedId = null;
  }

  parseAttachments(): string[] {
    return this.attachmentsText
      .split(',')
      .map(x => x.trim())
      .filter(x => x !== '');
  }

  submit(): void {
    this.saving = true;

    const payload: MessageRequest = {
      ...this.form,
      attachments: this.parseAttachments()
    };

    const request$ = this.editMode && this.selectedId
      ? this.messageService.updateMessage(this.selectedId, payload)
      : this.messageService.createMessage(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadMessages();
      },
      error: (err) => {
        console.error('Save message error', err);
        this.saving = false;
      }
    });
  }

  remove(id: number): void {
    if (!confirm('Delete this message?')) return;

    this.messageService.deleteMessage(id).subscribe({
      next: () => this.loadMessages(),
      error: (err) => console.error('Delete message error', err)
    });
  }
}