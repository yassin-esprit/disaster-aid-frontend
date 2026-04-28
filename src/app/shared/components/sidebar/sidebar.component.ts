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
    { label: 'Alerts', icon: 'emergency', route: '/alerts' },
    { label: 'Incidents', icon: 'report_problem', route: '/incidents' },
    { label: 'Help Requests', icon: 'volunteer_activism', route: '/help' },
    { label: 'Skills', icon: 'psychology', route: '/skills' },
    { label: 'Import Skills', icon: 'upload_file', route: '/skills/import' },
    { label: 'Skill Timeline', icon: 'timeline', route: '/skills/timeline' },
    { label: 'Volunteer Skills', icon: 'verified', route: '/volunteer-skills' },
    { label: 'Opportunities', icon: 'explore', route: '/opportunities' },
    { label: 'Applications', icon: 'assignment', route: '/applications' },
    { label: 'My Profile', icon: 'person', route: '/profile' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];
}
