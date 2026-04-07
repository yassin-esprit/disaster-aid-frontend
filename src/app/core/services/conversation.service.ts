import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import {
  Conversation,
  ConversationRequest
} from '../../modules/communication/models/conversation.model';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  constructor(private httpService: HttpService) {}

  getAllConversations(): Observable<Conversation[]> {
    return this.httpService.get<Conversation[]>('/communication/conversations/retrieve-all');
  }

  getMyConversations(): Observable<Conversation[]> {
    return this.httpService.get<Conversation[]>('/communication/conversations/me');
  }

  getConversationById(id: number): Observable<Conversation> {
    return this.httpService.get<Conversation>(`/communication/conversations/${id}`);
  }

  createConversation(data: ConversationRequest): Observable<Conversation> {
    return this.httpService.post<Conversation>('/communication/conversations/add', data);
  }

  updateConversation(id: number, data: ConversationRequest): Observable<Conversation> {
    return this.httpService.put<Conversation>(`/communication/conversations/update/${id}`, data);
  }

  deleteConversation(id: number): Observable<void> {
    return this.httpService.delete<void>(`/communication/conversations/delete/${id}`);
  }
}