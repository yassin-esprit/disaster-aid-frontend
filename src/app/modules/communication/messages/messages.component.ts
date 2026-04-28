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
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { MessageService } from '../../../core/services/message.service';
import { ChatService } from '../../../core/services/chat.service';
import { Message, MessageRequest } from '../models/message.model';
import { environment } from '../../../../environments/environment';

type VoiceSignalType =
  | 'CALL_INIT'
  | 'CALL_RINGING'
  | 'CALL_ACCEPTED'
  | 'CALL_REJECTED'
  | 'WEBRTC_OFFER'
  | 'WEBRTC_ANSWER'
  | 'ICE_CANDIDATE'
  | 'CALL_ENDED';

interface VoiceSignalMessage {
  conversationId: number;
  fromUserId: number;
  toUserId?: number;
  callId: string;
  type: VoiceSignalType;
  payload?: string;
  timestamp?: string;
}

type VoiceCallState = 'idle' | 'calling' | 'ringing' | 'incoming' | 'in-call' | 'ended' | 'rejected' | 'error';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit, AfterViewChecked {

  private readonly lastConversationStorageKey = 'bo_selected_conversation_id';

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
  callState: VoiceCallState = 'idle';
  isMuted = false;
  voiceErrorMessage = '';

  private messageSubscription?: Subscription;
  private typingSubscription?: Subscription;
  private typingTimeout: any;
  private shouldScrollToBottom = false;
  private forceScrollToBottom = false;
  private voiceClient: Client | null = null;
  private voiceTopicSubscription: StompSubscription | null = null;
  private voiceConnected = false;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private activeCallId: string | null = null;
  private remoteUserId: number | null = null;
  private pendingOffer: RTCSessionDescriptionInit | null = null;

  @ViewChild('remoteAudio') remoteAudio?: ElementRef<HTMLAudioElement>;

  constructor(
    private messageService: MessageService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.ensureVoiceSocketConnected();
    if (this.preselectedConversationId) {
      this.conversationId = this.preselectedConversationId;
      this.loadConversation(true);
      return;
    }

    const storedConversationId = Number(localStorage.getItem(this.lastConversationStorageKey));
    if (Number.isFinite(storedConversationId) && storedConversationId > 0) {
      this.conversationId = storedConversationId;
      this.loadConversation(true);
      return;
    }

    this.loadLatestConversation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preselectedConversationId']?.currentValue) {
      this.conversationId = changes['preselectedConversationId'].currentValue;
      localStorage.setItem(this.lastConversationStorageKey, String(this.conversationId));
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
    if (this.conversationId) {
      localStorage.setItem(this.lastConversationStorageKey, String(this.conversationId));
    }
    this.loadMessagesByConversation(forceScroll);
    this.connectRealtime();
    this.subscribeVoiceTopic();
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

  async startVoiceCall(): Promise<void> {
    if (!this.conversationId) return;
    const peerUserId = this.getOtherUserId();
    if (!peerUserId) {
      this.setVoiceError('Correspondant introuvable pour cet appel.');
      return;
    }
    if (this.callState === 'in-call' || this.callState === 'calling' || this.callState === 'ringing') {
      this.setVoiceError('Un appel est deja en cours.');
      return;
    }

    const callId = crypto.randomUUID();
    this.activeCallId = callId;
    this.remoteUserId = peerUserId;
    this.callState = 'calling';

    try {
      await this.initLocalAudio();
      this.createPeerConnection(peerUserId, callId);
      this.attachLocalTracks();

      this.sendVoiceSignal({
        conversationId: this.conversationId,
        fromUserId: this.currentUserId,
        toUserId: peerUserId,
        callId,
        type: 'CALL_INIT'
      });

      const offer = await this.peerConnection!.createOffer({ offerToReceiveAudio: true });
      await this.peerConnection!.setLocalDescription(offer);
      this.sendVoiceSignal({
        conversationId: this.conversationId,
        fromUserId: this.currentUserId,
        toUserId: peerUserId,
        callId,
        type: 'WEBRTC_OFFER',
        payload: JSON.stringify(offer)
      });
    } catch (error) {
      this.setVoiceError(error instanceof Error ? error.message : 'Erreur appel vocal.');
      this.cleanupCall();
    }
  }

  async acceptIncomingCall(): Promise<void> {
    if (!this.conversationId || !this.pendingOffer || !this.activeCallId || !this.remoteUserId) return;
    try {
      await this.initLocalAudio();
      this.createPeerConnection(this.remoteUserId, this.activeCallId);
      this.attachLocalTracks();

      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(this.pendingOffer));
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      this.sendVoiceSignal({
        conversationId: this.conversationId,
        fromUserId: this.currentUserId,
        toUserId: this.remoteUserId,
        callId: this.activeCallId,
        type: 'CALL_ACCEPTED'
      });
      this.sendVoiceSignal({
        conversationId: this.conversationId,
        fromUserId: this.currentUserId,
        toUserId: this.remoteUserId,
        callId: this.activeCallId,
        type: 'WEBRTC_ANSWER',
        payload: JSON.stringify(answer)
      });

      this.pendingOffer = null;
      this.callState = 'in-call';
    } catch (error) {
      this.setVoiceError(error instanceof Error ? error.message : 'Impossible d accepter cet appel.');
      this.cleanupCall();
    }
  }

  rejectIncomingCall(): void {
    if (!this.conversationId || !this.activeCallId || !this.remoteUserId) return;
    this.sendVoiceSignal({
      conversationId: this.conversationId,
      fromUserId: this.currentUserId,
      toUserId: this.remoteUserId,
      callId: this.activeCallId,
      type: 'CALL_REJECTED'
    });
    this.cleanupCall();
  }

  endVoiceCall(sendSignal = true): void {
    if (sendSignal && this.conversationId && this.activeCallId && this.remoteUserId) {
      this.sendVoiceSignal({
        conversationId: this.conversationId,
        fromUserId: this.currentUserId,
        toUserId: this.remoteUserId,
        callId: this.activeCallId,
        type: 'CALL_ENDED'
      });
    }
    this.cleanupCall();
    this.callState = 'ended';
    setTimeout(() => {
      if (this.callState === 'ended') this.callState = 'idle';
    }, 1000);
  }

  toggleMute(): void {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      this.isMuted = !track.enabled;
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
    this.voiceTopicSubscription?.unsubscribe();
    this.voiceClient?.deactivate();
    this.cleanupCall();
    this.chatService.disconnect();
  }

  private subscribeVoiceTopic(): void {
    if (!this.conversationId) return;
    this.ensureVoiceSocketConnected();
    const waitReady = setInterval(() => {
      if (!this.voiceClient || !this.voiceConnected || !this.conversationId) return;
      clearInterval(waitReady);
      this.voiceTopicSubscription?.unsubscribe();
      this.voiceTopicSubscription = this.voiceClient.subscribe(
        `/topic/voicecall/${this.conversationId}`,
        (frame: IMessage) => {
          try {
            const signal = JSON.parse(frame.body) as VoiceSignalMessage;
            void this.handleVoiceSignal(signal);
          } catch {
            this.setVoiceError('Signal voice invalide.');
          }
        }
      );
    }, 150);
  }

  private ensureVoiceSocketConnected(): void {
    if (this.voiceClient?.active) {
      this.voiceConnected = true;
      return;
    }
    const client = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws-chat`),
      reconnectDelay: 2500
    });
    client.onConnect = () => { this.voiceConnected = true; };
    client.onWebSocketClose = () => { this.voiceConnected = false; };
    client.onStompError = (frame) => this.setVoiceError(frame.headers['message'] || 'Erreur STOMP voice call.');
    this.voiceClient = client;
    client.activate();
  }

  private sendVoiceSignal(signal: VoiceSignalMessage): void {
    if (!this.voiceClient || !this.voiceConnected) {
      this.setVoiceError('Voice socket non connecte.');
      return;
    }
    this.voiceClient.publish({
      destination: '/app/voicecall.signal',
      body: JSON.stringify(signal)
    });
  }

  private async handleVoiceSignal(signal: VoiceSignalMessage): Promise<void> {
    if (!this.conversationId || signal.conversationId !== this.conversationId) return;
    if (signal.fromUserId === this.currentUserId) return;
    if (signal.toUserId && signal.toUserId !== this.currentUserId) return;

    switch (signal.type) {
      case 'CALL_INIT':
        this.activeCallId = signal.callId;
        this.remoteUserId = signal.fromUserId;
        this.callState = 'incoming';
        this.sendVoiceSignal({
          conversationId: signal.conversationId,
          fromUserId: this.currentUserId,
          toUserId: signal.fromUserId,
          callId: signal.callId,
          type: 'CALL_RINGING'
        });
        return;
      case 'CALL_RINGING':
        this.callState = 'ringing';
        return;
      case 'CALL_ACCEPTED':
        this.callState = 'in-call';
        return;
      case 'CALL_REJECTED':
        this.callState = 'rejected';
        this.cleanupCall();
        return;
      case 'WEBRTC_OFFER':
        this.pendingOffer = this.parsePayload<RTCSessionDescriptionInit>(signal.payload);
        this.activeCallId = signal.callId;
        this.remoteUserId = signal.fromUserId;
        this.callState = 'incoming';
        return;
      case 'WEBRTC_ANSWER': {
        const answer = this.parsePayload<RTCSessionDescriptionInit>(signal.payload);
        if (!answer || !this.peerConnection) return;
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        this.callState = 'in-call';
        return;
      }
      case 'ICE_CANDIDATE': {
        const candidate = this.parsePayload<RTCIceCandidateInit>(signal.payload);
        if (!candidate || !this.peerConnection) return;
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        return;
      }
      case 'CALL_ENDED':
        this.endVoiceCall(false);
        return;
    }
  }

  private async initLocalAudio(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      throw new Error('Micro refuse ou indisponible.');
    }
  }

  private createPeerConnection(targetUserId: number, callId: string): void {
    this.peerConnection?.close();
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    this.remoteStream = new MediaStream();

    this.peerConnection.ontrack = (event) => {
      const stream = event.streams[0] || this.remoteStream;
      if (!event.streams[0]) this.remoteStream?.addTrack(event.track);
      if (this.remoteAudio?.nativeElement) {
        this.remoteAudio.nativeElement.srcObject = stream;
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (!event.candidate || !this.conversationId) return;
      this.sendVoiceSignal({
        conversationId: this.conversationId,
        fromUserId: this.currentUserId,
        toUserId: targetUserId,
        callId,
        type: 'ICE_CANDIDATE',
        payload: JSON.stringify(event.candidate.toJSON())
      });
    };
  }

  private attachLocalTracks(): void {
    if (!this.peerConnection || !this.localStream) return;
    this.localStream.getAudioTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, this.localStream as MediaStream);
    });
  }

  private cleanupCall(): void {
    this.peerConnection?.getSenders().forEach((sender) => sender.track?.stop());
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.remoteStream?.getTracks().forEach((track) => track.stop());
    this.peerConnection?.close();
    if (this.remoteAudio?.nativeElement) {
      this.remoteAudio.nativeElement.srcObject = null;
    }
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.activeCallId = null;
    this.remoteUserId = null;
    this.pendingOffer = null;
    this.isMuted = false;
  }

  private parsePayload<T>(payload?: string): T | null {
    if (!payload) return null;
    try {
      return JSON.parse(payload) as T;
    } catch {
      return null;
    }
  }

  private getOtherUserId(): number | null {
    const candidate = this.messages.find((m) => m.senderId !== this.currentUserId);
    return candidate?.senderId ?? null;
  }

  private setVoiceError(message: string): void {
    this.voiceErrorMessage = message;
    this.callState = 'error';
    setTimeout(() => {
      if (this.callState === 'error') this.callState = 'idle';
      this.voiceErrorMessage = '';
    }, 2500);
  }

  private loadLatestConversation(): void {
    this.chatService.getMyConversations().subscribe({
      next: (conversations) => {
        const list = conversations || [];
        if (!list.length) return;

        const sorted = [...list].sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        });

        this.conversationId = sorted[0].conversationId;
        localStorage.setItem(this.lastConversationStorageKey, String(this.conversationId));
        this.loadConversation(true);
      },
      error: () => {
        this.errorMessage = 'Aucune conversation prechargee.';
      }
    });
  }
}