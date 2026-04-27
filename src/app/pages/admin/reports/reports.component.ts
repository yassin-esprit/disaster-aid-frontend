import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthenticatedLayoutComponent } from '../../../layouts/authenticated-layout/authenticated-layout.component';
import { ReviewsTrustService } from '../../../core/services/reviews-trust/reviews-trust.service';
import { ReviewEntity } from '../../../shared/models/reviews/reviews-trust.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AuthenticatedLayoutComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  private readonly fb = inject(FormBuilder);

  reviews: ReviewEntity[] = [];
  isLoading = false;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  selectedReviewId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    reporterId: [1, [Validators.required, Validators.min(1)]],
    reviewId: [1, [Validators.required, Validators.min(1)]],
    reason: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor(private readonly reviewsTrustService: ReviewsTrustService) {
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.reviewsTrustService.getAllReviews().subscribe({
      next: (items) => {
        this.reviews = items;
        if (items.length > 0) {
          this.selectReview(items[0]);
        } else {
          this.selectedReviewId = null;
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load reviews for moderation.';
        this.isLoading = false;
      },
    });
  }

  submitReport(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const raw = this.form.getRawValue();
    const reviewId = Number(raw.reviewId);

    this.reviewsTrustService
      .moderateReview(reviewId, 'FLAGGED')
      .pipe(
        switchMap(() =>
          this.reviewsTrustService.createModerationAction({
            adminId: Number(raw.reporterId),
            targetType: 'REVIEW',
            targetId: reviewId,
            action: 'WARN',
            reason: `${raw.reason.trim()} | ${raw.description.trim()}`,
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'Report submitted. The selected review has been flagged for moderation.';
          this.isSubmitting = false;
          this.form.patchValue({ reason: '', description: '' });
          this.loadReviews();
        },
        error: () => {
          this.errorMessage =
            'Unable to submit this report right now.';
          this.isSubmitting = false;
        },
      });
  }

  selectReview(review: ReviewEntity): void {
    this.selectedReviewId = review.reviewId;
    this.form.patchValue({
      reporterId: review.authorId,
      reviewId: review.reviewId,
    });
  }

  shortBody(review: ReviewEntity): string {
    if (review.body.length <= 100) {
      return review.body;
    }
    return `${review.body.slice(0, 100)}...`;
  }
}
