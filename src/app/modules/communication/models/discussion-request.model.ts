export interface DiscussionRequest {
  requestId: number;
  citizenId: number;
  adminId?: number | null;
  subject: string;
  description: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  conversationId?: number | null;
  createdAt?: string;
  processedAt?: string;
}