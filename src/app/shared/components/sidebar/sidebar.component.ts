import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Output() logoutClicked = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Overview', icon: 'dashboard', route: '/dashboard' },
    { label: 'Alerts', icon: 'emergency', route: '/alerts' },
    { label: 'Incidents', icon: 'report_problem', route: '/incidents' },
    { label: 'Help Requests', icon: 'volunteer_activism', route: '/help' },
    { label: 'Opportunities', icon: 'explore', route: '/opportunities' },
    { label: 'My Profile', icon: 'person', route: '/profile' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
    { label: 'Users', icon: 'people', route: '/users-management' },
    { label: 'Communication', icon: 'forum', route: '/communication' }
  ];

  onLogout(): void {
    this.logoutClicked.emit();
  }
}