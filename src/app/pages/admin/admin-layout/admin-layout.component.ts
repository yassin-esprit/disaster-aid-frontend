import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  navItems = [
    { label: 'Incidents', icon: 'report_problem', route: '/admin/incidents' },
    {
      label: 'Coordination',
      icon: 'volunteer_activism',
      route: '/admin/coordination',
    },
  ];
}
