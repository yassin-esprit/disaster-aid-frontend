import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { switchMap } from 'rxjs';
import { FrontOfficeLayoutComponent } from '../../layouts/front-office-layout/front-office-layout.component';
import { ReviewsTrustService } from '../../core/services/reviews-trust/reviews-trust.service';
import { ReviewEntity } from '../../shared/models/reviews/reviews-trust.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FrontOfficeLayoutComponent],
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
          this.form.patchValue({ reviewId: items[0].reviewId });
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les avis a signaler.';
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
            'Signalement envoye. La revue est marquee pour moderation.';
          this.isSubmitting = false;
          this.form.patchValue({ reason: '', description: '' });
          this.loadReviews();
        },
        error: () => {
          this.errorMessage =
            'Impossible de soumettre le signalement pour le moment.';
          this.isSubmitting = false;
        },
      });
  }

  shortBody(review: ReviewEntity): string {
    if (review.body.length <= 100) {
      return review.body;
    }
    return `${review.body.slice(0, 100)}...`;
  }
}
