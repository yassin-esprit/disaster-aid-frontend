import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { Message, MessageRequest } from '../../modules/communication/models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private httpService: HttpService) {}

  getAllMessages(): Observable<Message[]> {
    return this.httpService.get<Message[]>('/communication/messages/retrieve-all');
  }

  getMyMessages(): Observable<Message[]> {
    return this.httpService.get<Message[]>('/communication/messages/me');
  }

  getMessageById(id: number): Observable<Message> {
    return this.httpService.get<Message>(`/communication/messages/${id}`);
  }

  createMessage(data: MessageRequest): Observable<Message> {
    return this.httpService.post<Message>('/communication/messages/add', data);
  }

  updateMessage(id: number, data: MessageRequest): Observable<Message> {
    return this.httpService.put<Message>(`/communication/messages/update/${id}`, data);
  }

  deleteMessage(id: number): Observable<void> {
    return this.httpService.delete<void>(`/communication/messages/delete/${id}`);
  }
  getMessagesByConversation(conversationId: number): Observable<Message[]> {
    return this.httpService.get<Message[]>(`/communication/messages/conversation/${conversationId}`);
  }
}