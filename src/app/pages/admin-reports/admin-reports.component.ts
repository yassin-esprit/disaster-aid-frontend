import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticatedLayoutComponent } from '../../layouts/authenticated-layout/authenticated-layout.component';
import { ReviewsTrustService } from '../../core/services/reviews-trust/reviews-trust.service';
import {
  ModerationActionEntity,
  ModerationActionType,
  ReviewEntity,
  ReviewStatus,
} from '../../shared/models/reviews/reviews-trust.model';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, AuthenticatedLayoutComponent],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.scss',
})
export class AdminReportsComponent {
  flaggedReviews: ReviewEntity[] = [];
  moderationActions: ModerationActionEntity[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  searchTerm = '';
  currentPage = 1;
  pageSize = 5;
  readonly pageSizeOptions = [5, 10, 20];

  adminId = 1;

  constructor(private readonly reviewsTrustService: ReviewsTrustService) {
    this.loadFlaggedReviews();
  }

  get filteredReviews(): ReviewEntity[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.flaggedReviews;
    }

    return this.flaggedReviews.filter((item) => {
      const row = [
        String(item.reviewId),
        String(item.authorId),
        String(item.targetId),
        item.targetType,
        item.status,
        item.body,
      ]
        .join(' ')
        .toLowerCase();
      return row.includes(term);
    });
  }

  get totalItems(): number {
    return this.filteredReviews.length;
  }

  get totalPages(): number {
    const pages = Math.ceil(this.totalItems / this.pageSize);
    if (pages > 0) {
      return pages;
    }
    return 1;
  }

  get paginatedReviews(): ReviewEntity[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredReviews.slice(start, end);
  }

  get pageStart(): number {
    if (this.totalItems === 0) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    if (this.totalItems === 0) {
      return 0;
    }

    const end = this.currentPage * this.pageSize;
    if (end > this.totalItems) {
      return this.totalItems;
    }
    return end;
  }

  loadFlaggedReviews(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reviewsTrustService.getReviewsByStatus('FLAGGED').subscribe({
      next: (items) => {
        this.flaggedReviews = items;
        this.reviewsTrustService.getAllModerationActions().subscribe({
          next: (actions) => {
            this.moderationActions = actions;
            this.normalizePage();
            this.isLoading = false;
          },
          error: () => {
            this.moderationActions = [];
            this.normalizePage();
            this.isLoading = false;
          },
        });
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les signalements.';
        this.isLoading = false;
      },
    });
  }

  approve(review: ReviewEntity): void {
    this.handleDecision(review, 'PUBLISHED', 'WARN', 'Signalement approuve puis cloture.');
  }

  deleteReview(review: ReviewEntity): void {
    this.handleDecision(review, 'REMOVED', 'REMOVE', 'Avis supprime par moderation.');
  }

  suspend(review: ReviewEntity): void {
    this.handleDecision(review, 'HIDDEN', 'BAN', 'Avis suspendu suite a violation.');
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.normalizePage();
  }

  onPageSizeChange(value: string): void {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return;
    }

    this.pageSize = parsed;
    this.currentPage = 1;
    this.normalizePage();
  }

  prevPage(): void {
    if (this.currentPage <= 1) {
      return;
    }
    this.currentPage -= 1;
    this.normalizePage();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }
    this.currentPage += 1;
    this.normalizePage();
  }

  reportTypeFor(review: ReviewEntity): string {
    const action = this.latestActionFor(review);
    if (action && action.targetType) {
      return action.targetType;
    }
    return 'REVIEW';
  }

  reportReasonFor(review: ReviewEntity): string {
    const action = this.latestActionFor(review);
    if (action && action.reason) {
      return action.reason;
    }
    return 'N/A';
  }

  private handleDecision(
    review: ReviewEntity,
    nextStatus: ReviewStatus,
    actionType: ModerationActionType,
    reason: string,
  ): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reviewsTrustService.moderateReview(review.reviewId, nextStatus).subscribe({
      next: () => {
        this.reviewsTrustService
          .createModerationAction({
            adminId: Number(this.adminId),
            targetType: 'REVIEW',
            targetId: review.reviewId,
            action: actionType,
            reason,
          })
          .subscribe({
            next: () => {
              this.successMessage = `Action ${actionType} appliquee sur review #${review.reviewId}.`;
              this.isSaving = false;
              this.loadFlaggedReviews();
            },
            error: () => {
              this.errorMessage =
                'Le statut est modifie, mais la trace de moderation a echoue.';
              this.isSaving = false;
              this.loadFlaggedReviews();
            },
          });
      },
      error: () => {
        this.errorMessage = 'Echec moderation de cette review.';
        this.isSaving = false;
      },
    });
  }

  private normalizePage(): void {
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const max = this.totalPages;
    if (this.currentPage > max) {
      this.currentPage = max;
    }
  }

  private latestActionFor(review: ReviewEntity): ModerationActionEntity | null {
    const filtered = this.moderationActions
      .filter((item) => item.targetType === 'REVIEW' && item.targetId === review.reviewId)
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });

    if (filtered.length > 0) {
      return filtered[0];
    }

    return null;
  }
}
