import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FrontOfficeLayoutComponent } from '../../layouts/front-office-layout/front-office-layout.component';
import { ReviewsTrustService } from '../../core/services/reviews-trust/reviews-trust.service';
import {
  ReviewEntity,
  ReviewTarget,
  TrustScoreEntity,
} from '../../shared/models/reviews/reviews-trust.model';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FrontOfficeLayoutComponent],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
})
export class ReviewsComponent {
  private readonly reactionsStorageKey = 'reviews-user-reactions';
  readonly stars = [1, 2, 3, 4, 5];
  readonly reactionEmojis = ['👍', '❤️', '👏', '💡', '😂'];
  reviews: ReviewEntity[] = [];
  isLoading = false;
  message = '';
  errorMessage = '';
  selectedReactions: Record<number, string> = {};

  targetType: ReviewTarget = 'ORGANISATION';
  targetId = 1;

  trustScore: TrustScoreEntity | null = null;
  trustErrorMessage = '';

  constructor(private readonly reviewsTrustService: ReviewsTrustService) {
    this.loadStoredReactions();
    this.loadAllReviews();
  }

  get averageRating(): number {
    if (this.reviews.length === 0) {
      return 0;
    }

    const total = this.reviews.reduce((sum, item) => sum + item.rating, 0);
    return total / this.reviews.length;
  }

  get publishedCount(): number {
    return this.reviews.filter((item) => item.status === 'PUBLISHED').length;
  }

  loadAllReviews(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.message = '';
    this.trustScore = null;

    this.reviewsTrustService.getAllReviews().subscribe({
      next: (items) => {
        this.reviews = items;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load reviews.';
        this.isLoading = false;
      },
    });
  }

  loadByTarget(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.message = '';

    this.reviewsTrustService
      .getReviewsByTarget(this.targetId, this.targetType)
      .subscribe({
        next: (items) => {
          this.reviews = items;
          this.isLoading = false;
          this.message = 'Reviews filtered by target.';
          this.loadTrustScore();
        },
        error: () => {
          this.errorMessage = 'Unable to filter reviews by target.';
          this.isLoading = false;
          this.trustScore = null;
        },
      });
  }

  reactWithEmoji(review: ReviewEntity, emoji: string): void {
    const reviewId = review.reviewId;
    const previous = this.selectedReactions[reviewId];

    if (previous === emoji) {
      return;
    }

    this.selectedReactions[reviewId] = emoji;
    this.saveStoredReactions();
  }

  toggleLike(review: ReviewEntity): void {
    const reviewId = review.reviewId;
    if (this.selectedReactions[reviewId]) {
      delete this.selectedReactions[reviewId];
      this.saveStoredReactions();
      return;
    }

    this.selectedReactions[reviewId] = '👍';
    this.saveStoredReactions();
  }

  displayedLikes(review: ReviewEntity): number {
    const hasReaction = !!this.selectedReactions[review.reviewId];
    return review.helpfulVotes + (hasReaction ? 1 : 0);
  }

  selectedReactionEmoji(reviewId: number): string {
    const selected = this.selectedReactions[reviewId];
    if (selected) {
      return selected;
    }
    return '👍';
  }

  isReactionSelected(reviewId: number, emoji: string): boolean {
    return this.selectedReactions[reviewId] === emoji;
  }

  isReviewStarActive(review: ReviewEntity, star: number): boolean {
    return star <= review.rating;
  }

  targetTypeLabel(targetType: ReviewTarget): 'RESOURCE' | 'SHELTER' {
    if (targetType === 'ORGANISATION') {
      return 'RESOURCE';
    }
    return 'SHELTER';
  }

  private loadTrustScore(): void {
    this.trustErrorMessage = '';
    this.reviewsTrustService
      .getTrustScoreByEntity(this.targetId, this.targetType)
      .subscribe({
        next: (score) => {
          this.trustScore = score;
        },
        error: () => {
          this.trustScore = null;
          this.trustErrorMessage =
            'No trust score is currently available for this target.';
        },
      });
  }

  private loadStoredReactions(): void {
    try {
      const raw = localStorage.getItem(this.reactionsStorageKey);
      if (!raw) {
        this.selectedReactions = {};
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, string>;
      const normalized: Record<number, string> = {};
      for (const [key, value] of Object.entries(parsed)) {
        const reviewId = Number(key);
        if (!Number.isNaN(reviewId) && this.reactionEmojis.includes(value)) {
          normalized[reviewId] = value;
        }
      }
      this.selectedReactions = normalized;
    } catch {
      this.selectedReactions = {};
    }
  }

  private saveStoredReactions(): void {
    try {
      localStorage.setItem(
        this.reactionsStorageKey,
        JSON.stringify(this.selectedReactions),
      );
    } catch {
      // Ignore storage failures and keep reactions in memory.
    }
  }
}
