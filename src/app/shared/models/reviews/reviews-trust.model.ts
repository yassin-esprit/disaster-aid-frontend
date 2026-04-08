export type ReviewTarget = 'VOLUNTEER' | 'ORGANISATION';

export type ReviewStatus = 'PUBLISHED' | 'HIDDEN' | 'FLAGGED' | 'REMOVED';

export type ModerationActionType = 'WARN' | 'HIDE' | 'REMOVE' | 'BAN';

export type EntityType = 'VOLUNTEER' | 'ORGANISATION';

export interface ReviewEntity {
  reviewId: number;
  authorId: number;
  targetId: number;
  targetType: ReviewTarget;
  rating: number;
  body: string;
  opportunityId: number | null;
  isVerifiedParticipant: boolean;
  status: ReviewStatus;
  helpfulVotes: number;
  createdAt: string;
}

export interface ReviewPayload {
  authorId: number;
  targetId: number;
  targetType: ReviewTarget;
  rating: number;
  body: string;
  opportunityId: number | null;
}

export interface ModerationActionEntity {
  actionId: number;
  adminId: number;
  targetType: string;
  targetId: number;
  action: ModerationActionType;
  reason: string;
  createdAt: string;
}

export interface ModerationActionPayload {
  adminId: number;
  targetType: string;
  targetId: number;
  action: ModerationActionType;
  reason: string;
}

export interface TrustScoreEntity {
  scoreId: number;
  entityId: number;
  entityType: EntityType;
  score: number;
  reviewCount: number;
  averageRating: number;
  completionRate: number;
  responseRate: number;
  lastCalculatedAt: string;
}
