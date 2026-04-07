export type ConvoType = 'TASK_CHAT' | 'DIRECT' | 'GROUP';

export interface Conversation {
  conversationId: number;
  type: ConvoType;
  relatedEntityId: number | null;
  relatedEntityType: string | null;
  participantIds: number[];
  lastMessageAt: string | null;
  createdAt: string | null;
}

export interface ConversationRequest {
  type: ConvoType;
  relatedEntityId: number | null;
  relatedEntityType: string | null;
  participantIds: number[];
  lastMessageAt: string | null;
}