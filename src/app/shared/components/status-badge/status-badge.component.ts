// src/app/shared/components/status-badge/status-badge.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusType =
// Existing ones
  | 'ACTIVE' | 'APPROVED' | 'VERIFIED' | 'PENDING' | 'IN_PROGRESS' | 'ASSIGNED'
  | 'REJECTED' | 'CANCELLED' | 'BANNED' | 'DRAFT' | 'INACTIVE'
  | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OPEN' | 'COMPLETED' | 'RESOLVED'
  // New ones from backend
  | 'OFFLINE' | 'FAULTY' | 'MAINTENANCE'          // Sensor status
  | 'MONITORING' | 'FALSE_ALARM'                  // Alert status
  | 'PLANNED' | 'BLOCKED' | 'CLOSED'              // Route status
  | 'MODERATE'                                    // Severity (used in alerts)
  | 'WAYPOINT' | 'MEDICAL_STOP' | 'SUPPLY_POINT'; // Checkpoint types (if needed)

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
  @Input() status: string = 'PENDING';
  @Input() label: string = '';
  @Input() showDot: boolean = false;

  get badgeClasses(): string {
    const map: Record<string, string> = {
      // Positive / active
      ACTIVE: 'bg-secondary/10 text-secondary border border-secondary/20',
      APPROVED: 'bg-secondary/10 text-secondary border border-secondary/20',
      VERIFIED: 'bg-secondary/10 text-secondary border border-secondary/20',
      RESOLVED: 'bg-secondary/10 text-secondary border border-secondary/20',
      COMPLETED: 'bg-secondary/10 text-secondary border border-secondary/20',
      OPEN: 'bg-secondary/10 text-secondary border border-secondary/20',
      // Warning / pending
      PENDING: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      ASSIGNED: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      MONITORING: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      PLANNED: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      // Negative / error
      REJECTED: 'bg-error/10 text-error border border-error/20',
      CANCELLED: 'bg-error/10 text-error border border-error/20',
      BANNED: 'bg-error/10 text-error border border-error/20',
      CLOSED: 'bg-error/10 text-error border border-error/20',
      BLOCKED: 'bg-error/10 text-error border border-error/20',
      FALSE_ALARM: 'bg-error/10 text-error border border-error/20',
      OFFLINE: 'bg-error/10 text-error border border-error/20',
      FAULTY: 'bg-error/10 text-error border border-error/20',
      // Neutral / inactive
      DRAFT: 'bg-white/5 text-on-surface-variant border border-white/10',
      INACTIVE: 'bg-white/5 text-on-surface-variant border border-white/10',
      MAINTENANCE: 'bg-white/5 text-on-surface-variant border border-white/10',
      // Severity levels
      CRITICAL: 'bg-error/20 text-error border border-error/30',
      HIGH: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      MEDIUM: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      MODERATE: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      LOW: 'bg-secondary/10 text-secondary border border-secondary/20',
    };
    return map[this.status] || 'bg-white/5 text-on-surface-variant border border-white/10';
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
      MODERATE: 'bg-amber-400',
      LOW: 'bg-secondary',
      DRAFT: 'bg-on-surface-variant',
      MONITORING: 'bg-amber-400',
      PLANNED: 'bg-amber-400',
      CLOSED: 'bg-error',
      BLOCKED: 'bg-error',
      OFFLINE: 'bg-error',
      FAULTY: 'bg-error',
      MAINTENANCE: 'bg-on-surface-variant',
      FALSE_ALARM: 'bg-error',
    };
    return map[this.status] || 'bg-on-surface-variant';
  }
}
