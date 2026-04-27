export type ReviewTarget = 'ORGANISATION' | 'SHELTER' | 'VOLUNTEER';
export type EntityType = ReviewTarget;
export type ReviewStatus =
  | 'PUBLISHED'
  | 'PENDING'
  | 'REJECTED'
  | 'HIDDEN'
  | 'FLAGGED'
  | 'REMOVED';
export type ModerationActionType = 'WARN' | 'HIDE' | 'REMOVE' | 'BAN';

export interface CreateModerationActionPayload {
  adminId: number;
  targetType: string;
  targetId: number;
  action: ModerationActionType;
  reason: string;
}

export interface ModerationActionEntity {
  actionId: number;
  adminId: number;
  targetType: string;
  targetId: number;
  action: ModerationActionType;
  reason: string;
  createdAt?: string;
}

export interface ReviewEntity {
  reviewId: number;
  authorId: number;
  targetId: number;
  targetType: ReviewTarget;
  rating: number;
  body: string;
  status: ReviewStatus;
  helpfulVotes: number;
  createdAt?: string;
}

export interface CreateReviewPayload {
  authorId: number;
  targetId: number;
  targetType: ReviewTarget;
  rating: number;
  body: string;
  opportunityId: number | null;
}

export interface TrustScoreEntity {
  entityId: number;
  entityType: EntityType;
  score: number;
  reviewCount: number;
  averageRating: number;
  lastCalculatedAt?: string;
  confidence?: number;
  updatedAt?: string;
}
