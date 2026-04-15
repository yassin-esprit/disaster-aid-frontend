import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewChecked,
  AfterViewInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { ChatService } from '../../../core/services/chat.service';
import { DiscussionRequestService } from '../../../core/services/discussion-request.service';

import { Conversation } from '../models/conversation.model';
import { Message, MessageRequest } from '../models/message.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit {
  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedConversationId: number | null = null;
  newMessage = '';
  currentUserId = Number(localStorage.getItem('userId'));
  currentUserEmail = localStorage.getItem('email') || '';

  isTyping = false;
  typingUser = '';
  showScrollButton = false;

  unreadCount: { [key: number]: number } = {};

  subject = '';
  description = '';
  showRequestForm = false;
  requestSuccessMessage = '';
  requestErrorMessage = '';
  isSendingRequest = false;

  private typingTimeout: any;
  private messageSubscription?: Subscription;
  private typingSubscription?: Subscription;
  private shouldScroll = false;

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  constructor(
    private chatService: ChatService,
    private discussionRequestService: DiscussionRequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.scrollContainer?.nativeElement) {
        this.scrollContainer.nativeElement.addEventListener('scroll', () => {
          const el = this.scrollContainer!.nativeElement;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
          this.showScrollButton = !atBottom;
        });
      }
    }, 300);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  loadConversations(): void {
    this.chatService.getMyConversations().subscribe({
      next: (data) => {
        this.conversations = data || [];
      },
      error: (err) => {
        console.error('Erreur conversations:', err);
      }
    });
  }

  selectConversation(convoId: number): void {
    this.selectedConversationId = convoId;
    this.isTyping = false;
    this.typingUser = '';
    this.unreadCount[convoId] = 0;

    this.chatService.getMessagesByConversation(convoId).subscribe({
      next: (data) => {
        this.messages = data || [];
        this.shouldScroll = true;
      },
      error: (err) => {
        console.error('Erreur messages:', err);
      }
    });

    this.chatService.connectToConversation(convoId);

    this.messageSubscription?.unsubscribe();
    this.messageSubscription = this.chatService.onMessageReceived().subscribe({
      next: (msg) => {
        const exists = this.messages.some(m => m.messageId === msg.messageId);

        if (msg.conversationId === this.selectedConversationId) {
          if (!exists) {
            this.messages.push(msg);
            this.shouldScroll = true;
          }
        } else {
          this.unreadCount[msg.conversationId] =
            (this.unreadCount[msg.conversationId] || 0) + 1;
        }
      },
      error: (err) => {
        console.error('Erreur websocket messages:', err);
      }
    });

    this.typingSubscription?.unsubscribe();
    this.typingSubscription = this.chatService.onTyping(convoId).subscribe({
      next: (data) => {
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
        console.error('Erreur websocket typing:', err);
      }
    });
  }

  onTyping(): void {
    if (this.selectedConversationId) {
      this.chatService.sendTyping(this.selectedConversationId);
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversationId) return;

    const payload: MessageRequest = {
      conversationId: this.selectedConversationId,
      senderId: this.currentUserId,
      body: this.newMessage.trim(),
      attachments: [],
      sentAt: null,
      editedAt: null,
      isDeleted: false
    };

    this.chatService.sendMessage(payload).subscribe({
      next: () => {
        this.newMessage = '';
        this.isTyping = false;
      },
      error: (err) => {
        console.error('Erreur envoi message:', err);
      }
    });
  }

  sendRequest(): void {
    this.requestSuccessMessage = '';
    this.requestErrorMessage = '';

    const citizenId = Number(localStorage.getItem('userId'));

    if (!citizenId) {
      this.requestErrorMessage = 'Utilisateur non connecté.';
      return;
    }

    if (!this.subject.trim() || !this.description.trim()) {
      this.requestErrorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    this.isSendingRequest = true;

    this.discussionRequestService.createRequest(citizenId, {
      subject: this.subject.trim(),
      description: this.description.trim()
    }).subscribe({
      next: (response) => {
        console.log('Demande créée :', response);
        this.isSendingRequest = false;
        this.requestSuccessMessage = 'Demande envoyée avec succès.';
        this.subject = '';
        this.description = '';
        this.showRequestForm = false;
      },
      error: (error) => {
        console.error('Erreur création demande :', error);
        this.isSendingRequest = false;
        this.requestErrorMessage =
          error?.error?.message || 'Erreur lors de l’envoi de la demande.';
      }
    });
  }

  scrollToBottomManual(): void {
    this.scrollToBottom();
  }

  goToLanding(): void {
    this.router.navigateByUrl('/landing');
  }

  getInitials(email?: string): string {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  formatTime(date?: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isMine(msg: Message): boolean {
    return msg.senderId === this.currentUserId;
  }

  getDisplayName(msg: Message): string {
    return this.isMine(msg) ? 'Vous' : (msg.senderEmail || ('User ' + msg.senderId));
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer?.nativeElement) {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
        this.showScrollButton = false;
      }
    } catch (error) {
      console.error('Erreur scroll:', error);
    }
  }

  ngOnDestroy(): void {
    this.messageSubscription?.unsubscribe();
    this.typingSubscription?.unsubscribe();
    clearTimeout(this.typingTimeout);
    this.chatService.disconnect();
  }
}