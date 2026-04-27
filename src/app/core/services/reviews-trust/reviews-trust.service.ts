import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  CreateModerationActionPayload,
  CreateReviewPayload,
  EntityType,
  ModerationActionEntity,
  ReviewEntity,
  ReviewStatus,
  ReviewTarget,
  TrustScoreEntity,
} from '../../../shared/models/reviews/reviews-trust.model';

@Injectable({ providedIn: 'root' })
export class ReviewsTrustService {
  private readonly apiUrl = environment.apiUrl;
  private readonly baseUrl = environment.apiUrl.replace('/api', '');

  constructor(private readonly http: HttpClient) {}

  private get headers(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    let h = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    if (token) {
      h = h.set('Authorization', `Bearer ${token}`);
    }
    return { headers: h };
  }

  getAllReviews(): Observable<ReviewEntity[]> {
    return this.http
      .get<ReviewEntity[]>(`${this.baseUrl}/reviews`, this.headers)
      .pipe(map((items) => items.map((item) => this.fromApiReview(item))));
  }

  getReviewsByTarget(targetId: number, targetType: ReviewTarget): Observable<ReviewEntity[]> {
    const apiTargetType = this.toApiTargetType(targetType);
    return this.http.get<ReviewEntity[]>(
      `${this.baseUrl}/reviews?targetId=${targetId}&targetType=${apiTargetType}`,
      this.headers
    ).pipe(map((items) => items.map((item) => this.fromApiReview(item))));
  }

  createReview(payload: CreateReviewPayload): Observable<ReviewEntity> {
    const body: CreateReviewPayload = {
      ...payload,
      targetType: this.toApiTargetType(payload.targetType),
    };
    return this.http
      .post<ReviewEntity>(`${this.baseUrl}/reviews`, body, this.headers)
      .pipe(map((item) => this.fromApiReview(item)));
  }

  moderateReview(reviewId: number, status: ReviewStatus): Observable<ReviewEntity> {
    return this.http
      .patch<ReviewEntity>(`${this.baseUrl}/reviews/${reviewId}/moderate?status=${status}`, null, this.headers)
      .pipe(map((item) => this.fromApiReview(item)));
  }

  createModerationAction(payload: CreateModerationActionPayload): Observable<ModerationActionEntity> {
    return this.http.post<ModerationActionEntity>(
      `${this.baseUrl}/reviews/moderation`,
      payload,
      this.headers,
    );
  }

  getTrustScoreByEntity(entityId: number, entityType: EntityType): Observable<TrustScoreEntity> {
    const apiEntityType = this.toApiTargetType(entityType);
    return this.http.get<TrustScoreEntity>(
      `${this.baseUrl}/reviews/trust-scores/by-entity?entityId=${entityId}&entityType=${apiEntityType}`,
      this.headers
    );
  }

  recalculateTrustScore(entityId: number, entityType: EntityType): Observable<TrustScoreEntity> {
    const apiEntityType = this.toApiTargetType(entityType);
    return this.http.post<TrustScoreEntity>(
      `${this.baseUrl}/reviews/trust-scores/recalculate?entityId=${entityId}&entityType=${apiEntityType}`,
      null,
      this.headers
    );
  }

  private toApiTargetType(targetType: ReviewTarget): ReviewTarget {
    if (targetType === 'SHELTER') {
      return 'VOLUNTEER';
    }
    return targetType;
  }

  private fromApiReview(item: ReviewEntity): ReviewEntity {
    if (item.targetType === 'VOLUNTEER') {
      return { ...item, targetType: 'SHELTER' };
    }
    return item;
  }
}
