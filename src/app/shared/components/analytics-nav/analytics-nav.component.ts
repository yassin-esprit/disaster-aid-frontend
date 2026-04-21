import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-analytics-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="mb-10 flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-white/5 w-fit">
      <ng-container *ngFor="let tab of tabs; let i = index">
        <span
          *ngIf="tab.separator"
          class="w-px h-6 bg-white/10 mx-1 self-center"
        ></span>
        <a
          *ngIf="!tab.separator"
          [routerLink]="tab.route"
          routerLinkActive="bg-primary/15 text-primary border border-primary/20 shadow-[0_0_12px_rgba(172,163,255,0.15)]"
          [routerLinkActiveOptions]="{ exact: tab.exact ?? false }"
          class="px-4 py-2 text-xs font-bold rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all flex items-center gap-1.5"
        >
          <span
            class="material-symbols-outlined text-sm"
            [ngClass]="tab.iconColor ?? ''"
          >{{ tab.icon }}</span>
          {{ tab.label }}
        </a>
      </ng-container>
    </nav>
  `,
})
export class AnalyticsNavComponent {
  readonly tabs: {
    route?: string; label?: string; icon?: string;
    iconColor?: string; exact?: boolean; separator?: boolean;
  }[] = [
    { route: '/analytics', label: 'Overview', icon: 'dashboard', exact: true },
    { route: '/analytics/models', label: 'Models', icon: 'model_training', exact: false },
    { route: '/analytics/lookups', label: 'Lookups', icon: 'search', exact: false },
    { separator: true },
    { route: '/analytics/alerts', label: 'Alerts Map', icon: 'emergency', iconColor: 'text-error', exact: false },
    { route: '/analytics/emergency', label: 'Command Center', icon: 'crisis_alert', iconColor: 'text-amber-400', exact: false },
    { separator: true },
    { route: '/analytics/sla', label: 'SLA', icon: 'timer', exact: false },
    { route: '/analytics/comparison', label: 'Compare', icon: 'compare_arrows', exact: false },
    { route: '/analytics/rules', label: 'Rules', icon: 'rule', exact: false },
    { route: '/analytics/data-quality', label: 'Quality', icon: 'verified', exact: false },
    { route: '/analytics/risk-zones', label: 'Risk Zones', icon: 'map', exact: false },
  ];
}
