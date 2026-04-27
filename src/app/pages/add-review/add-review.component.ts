import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { FrontOfficeLayoutComponent } from '../../layouts/front-office-layout/front-office-layout.component';
import { ReviewsTrustService } from '../../core/services/reviews-trust/reviews-trust.service';
import {
  EntityType,
  ReviewEntity,
  ReviewTarget,
} from '../../shared/models/reviews/reviews-trust.model';

@Component({
  selector: 'app-add-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FrontOfficeLayoutComponent],
  templateUrl: './add-review.component.html',
  styleUrl: './add-review.component.scss',
})
export class AddReviewComponent {
  private readonly fb = inject(FormBuilder);

  readonly stars = [1, 2, 3, 4, 5];
  hoverRating = 0;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    targetType: ['ORGANISATION' as ReviewTarget, Validators.required],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    body: ['', [Validators.required, Validators.minLength(5)]],
  });

  constructor(private readonly reviewsTrustService: ReviewsTrustService) {}

  setRating(value: number): void {
    this.form.controls.rating.setValue(value);
    this.form.controls.rating.markAsTouched();
  }

  displayStarValue(star: number): boolean {
    const preview = this.hoverRating > 0 ? this.hoverRating : this.form.controls.rating.value;
    return star <= preview;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const raw = this.form.getRawValue();
    const entityType: EntityType = raw.targetType;

    this.resolveReviewContext(raw.targetType)
      .pipe(
        switchMap((context) =>
          this.reviewsTrustService.createReview({
            authorId: context.authorId,
            targetId: context.targetId,
            targetType: raw.targetType,
            rating: Number(raw.rating),
            body: raw.body.trim(),
            opportunityId: null,
          }),
        ),
        switchMap((created) =>
          this.reviewsTrustService.recalculateTrustScore(created.targetId, entityType),
        ),
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'Review submitted successfully. Trust score was updated.';
          this.isSubmitting = false;
          this.hoverRating = 0;
          this.form.reset({
            targetType: raw.targetType,
            rating: 5,
            body: '',
          });
        },
        error: (err) => {
          this.errorMessage = this.extractErrorMessage(err);
          this.isSubmitting = false;
        },
      });
  }

  private resolveReviewContext(targetType: ReviewTarget) {
    return this.reviewsTrustService.getAllReviews().pipe(
      catchError(() => of([] as ReviewEntity[])),
      map((items) => {
        const sameType = items.find((item) => item.targetType === targetType);
        const fallback = items[0];

        return {
          authorId: this.resolveAuthorId(sameType ?? fallback),
          targetId: this.resolveTargetId(targetType, sameType ?? fallback),
        };
      }),
    );
  }

  private extractErrorMessage(err: unknown): string {
    console.error('Submit Error:', err);
    if (err instanceof Error) {
      return `Error: ${err.message}`;
    }
    if (typeof err === 'object' && err !== null) {
      const withError = err as any;
      if (withError.error?.message) {
        return withError.error.message;
      }
      if (withError.message) {
        return withError.message;
      }
      return `API Error: ${JSON.stringify(err)}`;
    }
    return 'Unable to submit the review right now. Please try again.';
  }

  private resolveAuthorId(item?: ReviewEntity): number {
    const userId = Number(localStorage.getItem('userId'));
    return userId > 0 ? userId : 1;
  }

  private resolveTargetId(targetType: ReviewTarget, item?: ReviewEntity): number {
    if (
      item &&
      item.targetType === targetType &&
      typeof item.targetId === 'number' &&
      item.targetId > 0
    ) {
      return item.targetId;
    }

    if (item && typeof item.targetId === 'number' && item.targetId > 0) {
      return item.targetId;
    }

    return 1;
  }
}
