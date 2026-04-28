import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export type VoiceSignalType =
  | 'CALL_INIT'
  | 'CALL_RINGING'
  | 'CALL_ACCEPTED'
  | 'CALL_REJECTED'
  | 'WEBRTC_OFFER'
  | 'WEBRTC_ANSWER'
  | 'ICE_CANDIDATE'
  | 'CALL_ENDED';

export interface VoiceSignalMessage {
  conversationId: number;
  fromUserId: number;
  toUserId?: number;
  callId: string;
  type: VoiceSignalType;
  payload?: string;
  timestamp?: string;
}

export interface VoiceSocketConfig {
  wsEndpoint: string;
  publishDestination: string;
  topicPrefix: string;
  debug?: boolean;
}

export type VoiceSocketUnsubscribe = () => void;

export class VoiceSocket {
  private client: Client | null = null;
  private connected = false;
  private connectPromise: Promise<void> | null = null;

  constructor(private readonly config: VoiceSocketConfig) {}

  isConnected(): boolean {
    return this.connected;
  }

  async connect(onError?: (error: Error) => void): Promise<void> {
    if (this.connected) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const client = new Client({
        webSocketFactory: () => new SockJS(this.config.wsEndpoint),
        reconnectDelay: 2500,
        debug: this.config.debug ? (line) => console.debug('[voice-stomp]', line) : undefined,
        onConnect: () => {
          this.connected = true;
          resolve();
        },
        onStompError: (frame) => {
          const error = new Error(frame.headers.message || 'STOMP protocol error');
          onError?.(error);
        },
        onWebSocketClose: () => {
          this.connected = false;
        },
      });

      client.onWebSocketError = () => {
        const error = new Error('WebSocket transport error');
        onError?.(error);
        reject(error);
      };

      this.client = client;
      client.activate();
    });

    return this.connectPromise.finally(() => {
      this.connectPromise = null;
    });
  }

  disconnect(): void {
    if (!this.client) return;
    this.client.deactivate();
    this.client = null;
    this.connected = false;
  }

  subscribeConversation(
    conversationId: number,
    onMessage: (message: VoiceSignalMessage) => void,
    onError?: (error: Error) => void
  ): VoiceSocketUnsubscribe {
    if (!this.client || !this.connected) {
      throw new Error('VoiceSocket is not connected');
    }

    const destination = `${this.config.topicPrefix}/${conversationId}`;
    const subscription: StompSubscription = this.client.subscribe(destination, (frame: IMessage) => {
      try {
        const parsed = JSON.parse(frame.body) as VoiceSignalMessage;
        onMessage(parsed);
      } catch {
        onError?.(new Error('Invalid voice signal payload'));
      }
    });

    return () => subscription.unsubscribe();
  }

  sendSignal(message: VoiceSignalMessage): void {
    if (!this.client || !this.connected) {
      throw new Error('VoiceSocket is not connected');
    }

    this.client.publish({
      destination: this.config.publishDestination,
      body: JSON.stringify(message),
    });
  }
}
