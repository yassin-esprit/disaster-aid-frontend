export interface Message {
  messageId: number;
  conversationId: number;
  senderId: number;
  senderEmail: string;
  body: string;
  attachments: string[];
  sentAt: string | null;
  editedAt: string | null;
  isDeleted: boolean;
}

export interface MessageRequest {
  conversationId: number;
  senderId: number;
  body: string;
  attachments: string[];
  sentAt: string | null;
  editedAt: string | null;
  isDeleted: boolean;
}