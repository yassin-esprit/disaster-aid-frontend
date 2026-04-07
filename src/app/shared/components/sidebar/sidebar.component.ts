import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../models/nav-item.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  @Input() accentColor: string = '#6C5CE7';
  @Input() accentClass: string = 'text-[#6C5CE7]';
  @Input() ctaLabel: string = 'New Initiative';
  @Input() ctaRoute: string = '/';

  navItems: NavItem[] = [
    { label: 'Overview', icon: 'dashboard', route: '/dashboard' },
    { label: 'Incidents', icon: 'report_problem', route: '/incidents' },
    {
      label: 'Coordination',
      icon: 'volunteer_activism',
      route: '/coordination',
    },
    { label: 'Alerts', icon: 'emergency', route: '/alerts' },
    { label: 'Opportunities', icon: 'explore', route: '/opportunities' },
    { label: 'Profile', icon: 'person', route: '/profile' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];
}
