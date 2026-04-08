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
  @Input() ctaLabel: string = 'Back Office';
  @Input() ctaRoute: string = '/backoffice/resources';

  navItems: NavItem[] = [
    { label: 'Overview', icon: 'dashboard', route: '/dashboard' },
    { label: 'Alerts', icon: 'emergency', route: '/alerts' },
    { label: 'Resource', icon: 'inventory_2', route: '/resource' },
    { label: 'Shelter', icon: 'home_work', route: '/shelter' },
    { label: 'Nearby Shelters', icon: 'location_on', route: '/nearby-shelters' },
    {
      label: 'Evac Routes',
      icon: 'alt_route',
      route: '/evacuation-routes',
    },
    {
      label: 'Reviews',
      icon: 'reviews',
      route: '/reviews',
    },


    {
      label: 'BO Resources',
      icon: 'admin_panel_settings',
      route: '/backoffice/resources',
    },
    {
      label: 'BO Shelters',
      icon: 'shield_person',
      route: '/backoffice/shelters',
    },

  ];
}
