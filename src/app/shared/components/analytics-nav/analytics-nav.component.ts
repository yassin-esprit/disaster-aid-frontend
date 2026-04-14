import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-analytics-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="mb-10 flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5 w-fit">
      <a
        *ngFor="let tab of tabs"
        [routerLink]="tab.route"
        routerLinkActive="bg-primary/15 text-primary border border-primary/20 shadow-[0_0_12px_rgba(172,163,255,0.15)]"
        [routerLinkActiveOptions]="{ exact: tab.exact }"
        class="px-5 py-2.5 text-sm font-bold rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all flex items-center gap-1.5"
      >
        <span
          class="material-symbols-outlined text-sm"
          [ngClass]="tab.iconColor ?? ''"
        >{{ tab.icon }}</span>
        {{ tab.label }}
      </a>
    </nav>
  `,
})
export class AnalyticsNavComponent {
  readonly tabs = [
    { route: '/analytics', label: 'Overview', icon: 'dashboard', exact: true },
    { route: '/analytics/models', label: 'Predictive Models', icon: 'model_training', exact: false },
    { route: '/analytics/lookups', label: 'Lookups', icon: 'search', exact: false },
    { route: '/analytics/alerts', label: 'Alerts Map', icon: 'emergency', iconColor: 'text-error', exact: false },
    { route: '/analytics/emergency', label: 'Command Center', icon: 'crisis_alert', iconColor: 'text-amber-400', exact: false },
  ];
}
