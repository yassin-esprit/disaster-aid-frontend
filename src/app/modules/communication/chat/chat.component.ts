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
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { ChatService } from '../../../core/services/chat.service';
import { DiscussionRequestService } from '../../../core/services/discussion-request.service';
import { environment } from '../../../../environments/environment';

import { Conversation } from '../models/conversation.model';
import { Message, MessageRequest } from '../models/message.model';

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
  currentCallSid: string | null = null;
  isCallActive = false;
  isTyping = false;
  typingUser = '';
  showScrollButton = false;
  callState: VoiceCallState = 'idle';
  isMuted = false;
  voiceErrorMessage = '';

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
  private voiceClient: Client | null = null;
  private voiceTopicSubscription: StompSubscription | null = null;
  private voiceTopicSubscriptions = new Map<number, StompSubscription>();
  private voiceConnected = false;
  private voiceConnectPromise: Promise<void> | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private activeCallId: string | null = null;
  private remoteUserId: number | null = null;
  private activeVoiceConversationId: number | null = null;
  private pendingOffer: RTCSessionDescriptionInit | null = null;

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('remoteAudio') private remoteAudio?: ElementRef<HTMLAudioElement>;

  constructor(
    private chatService: ChatService,
    private discussionRequestService: DiscussionRequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadConversations();
    this.ensureVoiceSocketConnected();
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
        this.subscribeToAllVoiceTopics();
      },
      error: (err) => { console.error('Error loading conversations:', err); }
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
      error: (err) => { console.error('Error loading messages:', err); }
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
      error: (err) => { console.error('WebSocket message error:', err); }
    });

    this.typingSubscription?.unsubscribe();
    this.typingSubscription = this.chatService.onTyping(convoId).subscribe({
      next: (data) => {
        if (data.userId !== this.currentUserId) {
          this.typingUser = data.email || 'A user';
          this.isTyping = true;
          clearTimeout(this.typingTimeout);
          this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            this.typingUser = '';
          }, 2000);
        }
      },
      error: (err) => { console.error('WebSocket typing error:', err); }
    });
  }

  async startVoiceCall(): Promise<void> {
    const conversation = this.getSelectedConversation();
    if (!conversation) return;

    const peerUserId = this.getPeerUserId(conversation);
    if (!peerUserId) {
      this.setVoiceError('Correspondant introuvable.');
      return;
    }

    if (this.callState === 'in-call' || this.callState === 'calling' || this.callState === 'ringing') {
      this.setVoiceError('Un appel est deja en cours.');
      return;
    }

    this.voiceErrorMessage = '';
    const callId = crypto.randomUUID();
    this.activeCallId = callId;
    this.remoteUserId = peerUserId;
    this.activeVoiceConversationId = conversation.conversationId;
    this.callState = 'calling';

    try {
      await this.initLocalAudio();
      this.createPeerConnection(peerUserId, callId);
      this.attachLocalAudioTracks();

      this.sendVoiceSignal({
        conversationId: conversation.conversationId,
        fromUserId: this.currentUserId,
        toUserId: peerUserId,
        callId,
        type: 'CALL_INIT'
      });

      const offer = await this.peerConnection!.createOffer({ offerToReceiveAudio: true });
      await this.peerConnection!.setLocalDescription(offer);

      this.sendVoiceSignal({
        conversationId: conversation.conversationId,
        fromUserId: this.currentUserId,
        toUserId: peerUserId,
        callId,
        type: 'WEBRTC_OFFER',
        payload: JSON.stringify(offer)
      });
    } catch (error) {
      this.setVoiceError(error instanceof Error ? error.message : 'Erreur de demarrage d appel.');
      this.cleanupPeerConnection();
    }
  }

  async acceptIncomingCall(): Promise<void> {
    if (!this.pendingOffer || !this.activeCallId || !this.remoteUserId || !this.activeVoiceConversationId) return;

    try {
      await this.initLocalAudio();
      this.createPeerConnection(this.remoteUserId, this.activeCallId);
      this.attachLocalAudioTracks();

      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(this.pendingOffer));
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      this.sendVoiceSignal({
        conversationId: this.activeVoiceConversationId,
        fromUserId: this.currentUserId,
        toUserId: this.remoteUserId,
        callId: this.activeCallId,
        type: 'CALL_ACCEPTED'
      });

      this.sendVoiceSignal({
        conversationId: this.activeVoiceConversationId,
        fromUserId: this.currentUserId,
        toUserId: this.remoteUserId,
        callId: this.activeCallId,
        type: 'WEBRTC_ANSWER',
        payload: JSON.stringify(answer)
      });

      this.pendingOffer = null;
      this.callState = 'in-call';
      this.isCallActive = true;
    } catch (error) {
      this.setVoiceError(error instanceof Error ? error.message : 'Impossible d accepter cet appel.');
      this.cleanupPeerConnection();
    }
  }

  rejectIncomingCall(): void {
    if (!this.activeCallId || !this.remoteUserId || !this.activeVoiceConversationId) return;

    this.sendVoiceSignal({
      conversationId: this.activeVoiceConversationId,
      fromUserId: this.currentUserId,
      toUserId: this.remoteUserId,
      callId: this.activeCallId,
      type: 'CALL_REJECTED',
      payload: JSON.stringify({ reason: 'user-rejected' })
    });

    this.pendingOffer = null;
    this.activeCallId = null;
    this.remoteUserId = null;
    this.callState = 'idle';
    this.isCallActive = false;
  }

  endVoiceCall(sendSignal = true): void {
    if (sendSignal && this.activeVoiceConversationId && this.activeCallId && this.remoteUserId) {
      this.sendVoiceSignal({
        conversationId: this.activeVoiceConversationId,
        fromUserId: this.currentUserId,
        toUserId: this.remoteUserId,
        callId: this.activeCallId,
        type: 'CALL_ENDED'
      });
    }

    this.cleanupPeerConnection();
    this.callState = 'ended';
    setTimeout(() => {
      if (this.callState === 'ended') {
        this.callState = 'idle';
      }
    }, 1200);
  }

  toggleMute(): void {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      this.isMuted = !track.enabled;
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
      error: (err) => { console.error('Error sending message:', err); }
    });
  }

  sendRequest(): void {
    this.requestSuccessMessage = '';
    this.requestErrorMessage = '';

    const citizenId = Number(localStorage.getItem('userId'));

    if (!citizenId) {
      this.requestErrorMessage = 'User not logged in.';
      return;
    }

    if (!this.subject.trim() || !this.description.trim()) {
      this.requestErrorMessage = 'Please fill in all fields.';
      return;
    }

    this.isSendingRequest = true;

    this.discussionRequestService.createRequest(citizenId, {
      subject: this.subject.trim(),
      description: this.description.trim()
    }).subscribe({
      next: () => {
        this.isSendingRequest = false;
        this.requestSuccessMessage = 'Request sent successfully.';
        this.subject = '';
        this.description = '';
        this.showRequestForm = false;
      },
      error: (error) => {
        this.isSendingRequest = false;
        this.requestErrorMessage =
          error?.error?.message || 'Error sending request.';
      }
    });
  }

  // ─── Helpers for display (no IDs exposed) ────────────────────────────────

  /** Returns a human-readable name for a conversation */
  getConversationName(convo: Conversation | null | undefined): string {
    if (!convo) return 'Conversation';
    // Use subject if available, otherwise fall back to type
    return (convo as any).subject || convo.type || 'Conversation';
  }

  /** Returns 2-letter initials for the conversation avatar */
  getConversationInitials(convo: Conversation): string {
    const name = this.getConversationName(convo);
    return name.substring(0, 2).toUpperCase();
  }

  /** Returns the currently selected conversation object */
  getSelectedConversation(): Conversation | null {
    return this.conversations.find(
      c => c.conversationId === this.selectedConversationId
    ) ?? null;
  }

  // ─── Generic helpers ──────────────────────────────────────────────────────

  scrollToBottomManual(): void {
    this.scrollToBottom();
  }

  getInitials(email?: string): string {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  formatTime(date?: string | null): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isMine(msg: Message): boolean {
    return msg.senderId === this.currentUserId;
  }

  getDisplayName(msg: Message): string {
    return this.isMine(msg) ? 'You' : (msg.senderEmail || 'User');
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer?.nativeElement) {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
        this.showScrollButton = false;
      }
    } catch (error) {
      console.error('Scroll error:', error);
    }
  }

  ngOnDestroy(): void {
    this.messageSubscription?.unsubscribe();
    this.typingSubscription?.unsubscribe();
    clearTimeout(this.typingTimeout);
    this.voiceTopicSubscription?.unsubscribe();
    this.voiceTopicSubscriptions.forEach((sub) => sub.unsubscribe());
    this.voiceTopicSubscriptions.clear();
    this.voiceClient?.deactivate();
    this.cleanupPeerConnection();
    this.chatService.disconnect();
  }

  private getPeerUserId(conversation: Conversation): number | null {
    const peer = conversation.participantIds?.find(id => id !== this.currentUserId);
    return peer ?? null;
  }

  private ensureVoiceSocketConnected(): void {
    if (this.voiceConnected || this.voiceConnectPromise) return;

    this.voiceConnectPromise = new Promise<void>((resolve, reject) => {
      const client = new Client({
        webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws-chat`),
        reconnectDelay: 2500
      });

      client.onConnect = () => {
        this.voiceConnected = true;
        resolve();
      };

      client.onStompError = (frame) => {
        this.setVoiceError(frame.headers['message'] || 'Erreur STOMP voice call.');
      };

      client.onWebSocketError = () => {
        const error = new Error('Erreur de transport websocket voice call.');
        this.setVoiceError(error.message);
        reject(error);
      };

      client.onWebSocketClose = () => {
        this.voiceConnected = false;
      };

      this.voiceClient = client;
      client.activate();
    }).finally(() => {
      this.voiceConnectPromise = null;
    });
  }

  private subscribeToVoiceTopic(conversationId: number): void {
    this.ensureVoiceSocketConnected();
    const waitReady = setInterval(() => {
      if (!this.voiceClient || !this.voiceConnected) return;
      clearInterval(waitReady);

      this.voiceTopicSubscription?.unsubscribe();
      this.voiceTopicSubscription = this.voiceClient.subscribe(
        `/topic/voicecall/${conversationId}`,
        (msg: IMessage) => {
          try {
            const signal = JSON.parse(msg.body) as VoiceSignalMessage;
            void this.handleVoiceSignal(signal);
          } catch {
            this.setVoiceError('Signal voice call invalide.');
          }
        }
      );
    }, 150);
  }

  private subscribeToAllVoiceTopics(): void {
    this.ensureVoiceSocketConnected();
    const waitReady = setInterval(() => {
      if (!this.voiceClient || !this.voiceConnected) return;
      clearInterval(waitReady);

      const known = new Set(this.conversations.map(c => c.conversationId));

      this.voiceTopicSubscriptions.forEach((sub, convoId) => {
        if (!known.has(convoId)) {
          sub.unsubscribe();
          this.voiceTopicSubscriptions.delete(convoId);
        }
      });

      this.conversations.forEach((convo) => {
        if (this.voiceTopicSubscriptions.has(convo.conversationId)) return;
        const sub = this.voiceClient!.subscribe(
          `/topic/voicecall/${convo.conversationId}`,
          (msg: IMessage) => {
            try {
              const signal = JSON.parse(msg.body) as VoiceSignalMessage;
              void this.handleVoiceSignal(signal);
            } catch {
              this.setVoiceError('Signal voice call invalide.');
            }
          }
        );
        this.voiceTopicSubscriptions.set(convo.conversationId, sub);
      });
    }, 150);
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
    if (signal.fromUserId === this.currentUserId) return;
    if (signal.toUserId && signal.toUserId !== this.currentUserId) return;
    switch (signal.type) {
      case 'CALL_INIT':
        if (this.callState === 'in-call' || this.callState === 'calling' || this.callState === 'ringing') {
          this.sendVoiceSignal({
            conversationId: signal.conversationId,
            fromUserId: this.currentUserId,
            toUserId: signal.fromUserId,
            callId: signal.callId,
            type: 'CALL_REJECTED',
            payload: JSON.stringify({ reason: 'busy' })
          });
          return;
        }
        this.activeCallId = signal.callId;
        this.remoteUserId = signal.fromUserId;
        this.activeVoiceConversationId = signal.conversationId;
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
        if (signal.callId === this.activeCallId) {
          this.callState = 'ringing';
        }
        return;

      case 'CALL_ACCEPTED':
        if (signal.callId === this.activeCallId) {
          this.callState = 'in-call';
          this.isCallActive = true;
        }
        return;

      case 'CALL_REJECTED':
        this.callState = 'rejected';
        this.isCallActive = false;
        this.cleanupPeerConnection();
        return;

      case 'WEBRTC_OFFER':
        this.pendingOffer = this.parsePayload<RTCSessionDescriptionInit>(signal.payload);
        if (!this.pendingOffer) {
          this.setVoiceError('Offer invalide.');
          return;
        }
        this.activeCallId = signal.callId;
        this.remoteUserId = signal.fromUserId;
        this.activeVoiceConversationId = signal.conversationId;
        this.callState = 'incoming';
        return;

      case 'WEBRTC_ANSWER': {
        const answer = this.parsePayload<RTCSessionDescriptionInit>(signal.payload);
        if (!answer || !this.peerConnection) return;
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        this.callState = 'in-call';
        this.isCallActive = true;
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
      if (!event.streams[0]) {
        this.remoteStream?.addTrack(event.track);
      }
      if (this.remoteAudio?.nativeElement) {
        this.remoteAudio.nativeElement.srcObject = stream;
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (!event.candidate || !this.activeVoiceConversationId) return;
      this.sendVoiceSignal({
        conversationId: this.activeVoiceConversationId,
        fromUserId: this.currentUserId,
        toUserId: targetUserId,
        callId,
        type: 'ICE_CANDIDATE',
        payload: JSON.stringify(event.candidate.toJSON())
      });
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state === 'failed' || state === 'disconnected') {
        this.setVoiceError('Connexion audio perdue.');
        this.endVoiceCall(true);
      }
    };
  }

  private attachLocalAudioTracks(): void {
    if (!this.peerConnection || !this.localStream) return;
    this.localStream.getAudioTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream as MediaStream);
    });
  }

  private cleanupPeerConnection(): void {
    this.peerConnection?.getSenders().forEach(sender => sender.track?.stop());
    this.localStream?.getTracks().forEach(track => track.stop());
    this.remoteStream?.getTracks().forEach(track => track.stop());
    this.peerConnection?.close();

    if (this.remoteAudio?.nativeElement) {
      this.remoteAudio.nativeElement.srcObject = null;
    }

    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.pendingOffer = null;
    this.activeCallId = null;
    this.remoteUserId = null;
    this.activeVoiceConversationId = null;
    this.isMuted = false;
    this.isCallActive = false;
  }

  private parsePayload<T>(payload?: string): T | null {
    if (!payload) return null;
    try {
      return JSON.parse(payload) as T;
    } catch {
      return null;
    }
  }

  private setVoiceError(message: string): void {
    this.voiceErrorMessage = message;
    this.callState = 'error';
    setTimeout(() => {
      if (this.callState === 'error') this.callState = 'idle';
      this.voiceErrorMessage = '';
    }, 2500);
  }

}