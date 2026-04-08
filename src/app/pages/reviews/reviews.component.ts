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
  reviews: ReviewEntity[] = [];
  isLoading = false;
  message = '';
  errorMessage = '';

  targetType: ReviewTarget = 'ORGANISATION';
  targetId = 1;

  trustScore: TrustScoreEntity | null = null;
  trustErrorMessage = '';

  constructor(private readonly reviewsTrustService: ReviewsTrustService) {
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
        this.errorMessage = 'Impossible de charger les avis.';
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
          this.message = 'Avis filtres par cible.';
          this.loadTrustScore();
        },
        error: () => {
          this.errorMessage = 'Impossible de filtrer les avis par cible.';
          this.isLoading = false;
          this.trustScore = null;
        },
      });
  }

  markHelpful(review: ReviewEntity): void {
    this.reviewsTrustService.markHelpful(review.reviewId).subscribe({
      next: (updated) => {
        this.reviews = this.reviews.map((item) => {
          if (item.reviewId === updated.reviewId) {
            return updated;
          }
          return item;
        });
      },
      error: () => {
        this.errorMessage = 'Impossible de marquer cet avis comme utile.';
      },
    });
  }

  stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
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
            'Aucun trust score calcule pour cette cible actuellement.';
        },
      });
  }
}
