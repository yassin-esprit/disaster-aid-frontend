import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusType =
  | 'ACTIVE'
  | 'APPROVED'
  | 'VERIFIED'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'ASSIGNED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'BANNED'
  | 'DRAFT'
  | 'INACTIVE'
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'OPEN'
  | 'COMPLETED'
  | 'RESOLVED';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      [ngClass]="badgeClasses"
    >
      <span
        *ngIf="showDot"
        class="w-1.5 h-1.5 rounded-full"
        [ngClass]="dotClass"
        [class.animate-pulse]="status === 'CRITICAL'"
      >
      </span>
      {{ label || status }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() status: StatusType = 'PENDING';
  @Input() label: string = '';
  @Input() showDot: boolean = false;

  get badgeClasses(): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-secondary/10 text-secondary border border-secondary/20',
      APPROVED: 'bg-secondary/10 text-secondary border border-secondary/20',
      VERIFIED: 'bg-secondary/10 text-secondary border border-secondary/20',
      RESOLVED: 'bg-secondary/10 text-secondary border border-secondary/20',
      COMPLETED: 'bg-secondary/10 text-secondary border border-secondary/20',
      OPEN: 'bg-secondary/10 text-secondary border border-secondary/20',

      PENDING: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      ASSIGNED: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',

      REJECTED: 'bg-error/10 text-error border border-error/20',
      CANCELLED: 'bg-error/10 text-error border border-error/20',
      BANNED: 'bg-error/10 text-error border border-error/20',

      DRAFT: 'bg-white/5 text-on-surface-variant border border-white/10',
      INACTIVE: 'bg-white/5 text-on-surface-variant border border-white/10',

      CRITICAL: 'bg-error/20 text-error border border-error/30',
      HIGH: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      MEDIUM: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      LOW: 'bg-secondary/10 text-secondary border border-secondary/20',
    };
    return (
      map[this.status] ||
      'bg-white/5 text-on-surface-variant border border-white/10'
    );
  }

  get dotClass(): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-secondary',
      APPROVED: 'bg-secondary',
      VERIFIED: 'bg-secondary',
      PENDING: 'bg-amber-400',
      IN_PROGRESS: 'bg-amber-400',
      REJECTED: 'bg-error',
      CANCELLED: 'bg-error',
      CRITICAL: 'bg-error',
      HIGH: 'bg-orange-400',
      MEDIUM: 'bg-amber-400',
      LOW: 'bg-secondary',
      DRAFT: 'bg-on-surface-variant',
    };
    return map[this.status] || 'bg-on-surface-variant';
  }
}
