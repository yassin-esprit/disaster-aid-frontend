import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EntityType,
  ModerationActionEntity,
  ModerationActionPayload,
  ReviewEntity,
  ReviewPayload,
  ReviewStatus,
  ReviewTarget,
  TrustScoreEntity,
} from '../../../shared/models/reviews/reviews-trust.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewsTrustService {
  private readonly reviewsBaseUrl = `${environment.backendUrl}/reviews`;

  constructor(private readonly http: HttpClient) {}

  getAllReviews(): Observable<ReviewEntity[]> {
    return this.http.get<ReviewEntity[]>(this.reviewsBaseUrl);
  }

  createReview(payload: ReviewPayload): Observable<ReviewEntity> {
    return this.http.post<ReviewEntity>(this.reviewsBaseUrl, payload);
  }

  getReviewsByTarget(
    targetId: number,
    targetType: ReviewTarget,
  ): Observable<ReviewEntity[]> {
    return this.http.get<ReviewEntity[]>(
      `${this.reviewsBaseUrl}/by-target/${targetId}?targetType=${targetType}`,
    );
  }

  getReviewsByStatus(status: ReviewStatus): Observable<ReviewEntity[]> {
    return this.http.get<ReviewEntity[]>(
      `${this.reviewsBaseUrl}/by-status?status=${status}`,
    );
  }

  markHelpful(id: number): Observable<ReviewEntity> {
    return this.http.post<ReviewEntity>(`${this.reviewsBaseUrl}/${id}/helpful`, {});
  }

  moderateReview(id: number, status: ReviewStatus): Observable<ReviewEntity> {
    return this.http.patch<ReviewEntity>(
      `${this.reviewsBaseUrl}/${id}/moderate?status=${status}`,
      {},
    );
  }

  getAllModerationActions(): Observable<ModerationActionEntity[]> {
    return this.http.get<ModerationActionEntity[]>(
      `${this.reviewsBaseUrl}/moderation`,
    );
  }

  createModerationAction(
    payload: ModerationActionPayload,
  ): Observable<ModerationActionEntity> {
    return this.http.post<ModerationActionEntity>(
      `${this.reviewsBaseUrl}/moderation`,
      payload,
    );
  }

  getTrustScoreByEntity(
    entityId: number,
    entityType: EntityType,
  ): Observable<TrustScoreEntity> {
    return this.http.get<TrustScoreEntity>(
      `${this.reviewsBaseUrl}/trust-scores/by-entity?entityId=${entityId}&entityType=${entityType}`,
    );
  }

  recalculateTrustScore(
    entityId: number,
    entityType: EntityType,
  ): Observable<TrustScoreEntity> {
    return this.http.post<TrustScoreEntity>(
      `${this.reviewsBaseUrl}/trust-scores/recalculate?entityId=${entityId}&entityType=${entityType}`,
      {},
    );
  }
}
