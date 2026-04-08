import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { switchMap } from 'rxjs';
import { FrontOfficeLayoutComponent } from '../../layouts/front-office-layout/front-office-layout.component';
import { ReviewsTrustService } from '../../core/services/reviews-trust/reviews-trust.service';
import { EntityType, ReviewTarget } from '../../shared/models/reviews/reviews-trust.model';

@Component({
  selector: 'app-add-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FrontOfficeLayoutComponent],
  templateUrl: './add-review.component.html',
  styleUrl: './add-review.component.scss',
})
export class AddReviewComponent {
  private readonly fb = inject(FormBuilder);

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    authorId: [1, [Validators.required, Validators.min(1)]],
    targetId: [1, [Validators.required, Validators.min(1)]],
    targetType: ['ORGANISATION' as ReviewTarget, Validators.required],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    body: ['', [Validators.required, Validators.minLength(5)]],
    opportunityId: [''],
  });

  constructor(private readonly reviewsTrustService: ReviewsTrustService) {}

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
    const opportunityId = this.parseOptionalNumber(raw.opportunityId);

    this.reviewsTrustService
      .createReview({
        authorId: Number(raw.authorId),
        targetId: Number(raw.targetId),
        targetType: raw.targetType,
        rating: Number(raw.rating),
        body: raw.body.trim(),
        opportunityId,
      })
      .pipe(
        switchMap(() =>
          this.reviewsTrustService.recalculateTrustScore(
            Number(raw.targetId),
            entityType,
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'Avis soumis avec succes. Le trust score a ete mis a jour.';
          this.isSubmitting = false;
          this.form.reset({
            authorId: Number(raw.authorId),
            targetId: Number(raw.targetId),
            targetType: raw.targetType,
            rating: 5,
            body: '',
            opportunityId: '',
          });
        },
        error: () => {
          this.errorMessage =
            'Erreur lors de la soumission de l avis. Verifiez les IDs et reessayez.';
          this.isSubmitting = false;
        },
      });
  }

  private parseOptionalNumber(value: string): number | null {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }
    return Number(normalized);
  }
}
