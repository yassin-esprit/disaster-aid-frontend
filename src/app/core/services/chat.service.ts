import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Message, MessageRequest } from '../../modules/communication/models/message.model';
import { Conversation } from '../../modules/communication/models/conversation.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl;
  private stompClient: Client | null = null;
  private messageSubject = new Subject<Message>();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getMyConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(
      `${this.apiUrl}/communication/conversations/me`,
      { headers: this.getAuthHeaders() }
    );
  }

  getMessagesByConversation(conversationId: number): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.apiUrl}/communication/messages/conversation/${conversationId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  sendMessage(payload: MessageRequest): Observable<Message> {
    return this.http.post<Message>(
      `${this.apiUrl}/communication/messages/add`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  connectToConversation(conversationId: number): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${this.apiUrl}/ws-chat`),
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP:', str)
    });

    this.stompClient.onConnect = () => {
      this.stompClient?.subscribe(
        `/topic/conversations/${conversationId}`,
        (message: IMessage) => {
          const chatMessage: Message = JSON.parse(message.body);
          this.messageSubject.next(chatMessage);
        }
      );
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker error:', frame);
    };

    this.stompClient.activate();
  }

  sendTyping(conversationId: number): void {
    if (!this.stompClient || !this.stompClient.active) {
      return;
    }

    this.stompClient.publish({
      destination: '/app/typing',
      body: JSON.stringify({
        conversationId,
        userId: Number(localStorage.getItem('userId')),
        email: localStorage.getItem('email')
      })
    });
  }

  onTyping(conversationId: number): Observable<any> {
    return new Observable<any>((observer) => {
      let subscription: StompSubscription | null = null;

      const waitForConnection = setInterval(() => {
        if (this.stompClient && this.stompClient.active) {
          clearInterval(waitForConnection);

          subscription = this.stompClient.subscribe(
            `/topic/typing/${conversationId}`,
            (msg: IMessage) => {
              observer.next(JSON.parse(msg.body));
            }
          );
        }
      }, 200);

      return () => {
        clearInterval(waitForConnection);
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    });
  }

  onMessageReceived(): Observable<Message> {
    return this.messageSubject.asObservable();
  }

  disconnect(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
    }
  }
}