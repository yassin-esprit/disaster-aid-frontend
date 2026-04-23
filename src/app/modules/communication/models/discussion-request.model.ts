export interface DiscussionRequest {
  requestId: number;
  citizenId: number;
  adminId?: number | null;
  subject: string;
  description: string;
  status: string;
  conversationId?: number | null;
  createdAt?: string;
  processedAt?: string;
}

export interface DiscussionRequestCreate {
  subject: string;
  description: string;
}

export interface AiPrediction {
  category: string;
  priority: string;
}