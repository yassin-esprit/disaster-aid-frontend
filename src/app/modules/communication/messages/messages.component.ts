import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { MessageService } from '../../../core/services/message.service';
import { ChatService } from '../../../core/services/chat.service';
import { Message, MessageRequest } from '../models/message.model';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit, AfterViewChecked {

  @Input() preselectedConversationId: number | null = null;

  @ViewChild('messagesContainer')
  messagesContainer?: ElementRef<HTMLDivElement>;

  messages: Message[] = [];
  loading = false;
  sending = false;
  errorMessage = '';
  successMessage = '';

  conversationId: number | null = null;
  newMessage = '';
  currentUserId = Number(localStorage.getItem('userId'));

  isTyping = false;
  typingUser = '';

  showScrollButton = false;
  newMessageBadge = false;

  private messageSubscription?: Subscription;
  private typingSubscription?: Subscription;
  private typingTimeout: any;
  private shouldScrollToBottom = false;
  private forceScrollToBottom = false;

  constructor(
    private messageService: MessageService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    if (this.preselectedConversationId) {
      this.conversationId = this.preselectedConversationId;
      this.loadConversation(true);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preselectedConversationId']?.currentValue) {
      this.conversationId = changes['preselectedConversationId'].currentValue;
      this.loadConversation(true);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (!el) return;

      el.addEventListener('scroll', () => {
        const atBottom = this.isAtBottom();
        this.showScrollButton = !atBottom;

        if (atBottom) {
          this.newMessageBadge = false;
        }
      });
    }, 200);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom || this.forceScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
      this.forceScrollToBottom = false;
    }
  }

  loadConversation(forceScroll = false): void {
    this.loadMessagesByConversation(forceScroll);
    this.connectRealtime();
  }

  loadMessagesByConversation(forceScroll = false): void {
    if (!this.conversationId) {
      this.errorMessage = 'Veuillez choisir une conversation.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.messageService.getMessagesByConversation(this.conversationId).subscribe({
      next: (res) => {
        this.messages = res || [];
        this.loading = false;
        this.newMessageBadge = false;
        this.forceScrollToBottom = forceScroll || true;
      },
      error: (err) => {
        console.error('Load messages error', err);
        this.errorMessage = 'Erreur lors du chargement des messages.';
        this.loading = false;
      }
    });
  }

  connectRealtime(): void {
    if (!this.conversationId) return;

    this.messageSubscription?.unsubscribe();
    this.typingSubscription?.unsubscribe();
    clearTimeout(this.typingTimeout);

    this.chatService.disconnect();
    this.chatService.connectToConversation(this.conversationId);

    this.messageSubscription = this.chatService.onMessageReceived().subscribe({
      next: (msg) => {
        if (msg.conversationId !== this.conversationId) return;

        const exists = this.messages.some(m => m.messageId === msg.messageId);
        if (exists) return;

        const atBottomBeforeInsert = this.isAtBottom();

        this.messages = [...this.messages, msg];

        if (atBottomBeforeInsert || this.isMine(msg)) {
          this.shouldScrollToBottom = true;
          this.newMessageBadge = false;
        } else {
          this.newMessageBadge = true;
          this.showScrollButton = true;
        }
      },
      error: (err) => {
        console.error('Realtime message error', err);
      }
    });

    this.typingSubscription = this.chatService.onTyping(this.conversationId).subscribe({
      next: (data: any) => {
        if (data.userId !== this.currentUserId) {
          this.typingUser = data.email || 'Un utilisateur';
          this.isTyping = true;

          clearTimeout(this.typingTimeout);
          this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            this.typingUser = '';
          }, 2000);
        }
      },
      error: (err) => {
        console.error('Realtime typing error', err);
      }
    });
  }

  onTyping(): void {
    if (!this.conversationId) return;
    this.chatService.sendTyping(this.conversationId);
  }

  sendMessage(): void {
    if (!this.conversationId || !this.newMessage.trim()) return;

    this.sending = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: MessageRequest = {
      conversationId: this.conversationId,
      senderId: this.currentUserId,
      body: this.newMessage.trim(),
      attachments: [],
      sentAt: null,
      editedAt: null,
      isDeleted: false
    };

    this.messageService.createMessage(payload).subscribe({
      next: () => {
        this.newMessage = '';
        this.successMessage = 'Message envoyé.';
        this.sending = false;
        this.shouldScrollToBottom = true;
        this.isTyping = false;
        this.typingUser = '';
      },
      error: (err) => {
        console.error('Send message error', err);
        this.errorMessage = 'Erreur lors de l’envoi du message.';
        this.sending = false;
      }
    });
  }

handleEnter(event: Event): void {
  const keyboardEvent = event as KeyboardEvent;

  if (keyboardEvent.shiftKey) return;

  keyboardEvent.preventDefault();
  this.sendMessage();
}

  scrollToBottomManual(): void {
    this.scrollToBottom();
    this.newMessageBadge = false;
  }

  isMine(message: Message): boolean {
    return message.senderId === this.currentUserId;
  }

  getDisplayName(message: Message): string {
    return this.isMine(message)
      ? 'Vous'
      : (message.senderEmail || ('User ' + message.senderId));
  }

  formatTime(date?: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (!el) return;

      el.scrollTop = el.scrollHeight;
      this.showScrollButton = false;
    } catch (error) {
      console.error('Scroll error', error);
    }
  }

  private isAtBottom(): boolean {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return true;

    return el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }

  ngOnDestroy(): void {
    this.messageSubscription?.unsubscribe();
    this.typingSubscription?.unsubscribe();
    clearTimeout(this.typingTimeout);
    this.chatService.disconnect();
  }
}