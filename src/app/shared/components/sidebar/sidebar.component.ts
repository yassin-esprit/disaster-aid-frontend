import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../models/nav-item.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnChanges {

  @Input() role: string = 'ADMIN';

  navItems: NavItem[] = [];

  // Admin nav — /admin/* prefix prevents route collision with volunteer pages
  adminNav: NavItem[] = [
    { label: 'Dashboard',    icon: 'dashboard',          route: '/dashboard'          },
    { label: 'Incidents',    icon: 'report_problem',     route: '/admin/incidents'    },
    { label: 'Coordination', icon: 'volunteer_activism', route: '/admin/coordination' },
    { label: 'Alerts',       icon: 'emergency',          route: '/alerts'             },
    { label: 'Profile',      icon: 'person',             route: '/profile'            },
  ];

  // Volunteer nav — unprefixed public routes under PublicLayoutComponent
  userNav: NavItem[] = [
    { label: 'Home',     icon: 'home',           route: '/home'     },
    { label: 'Report',   icon: 'report_problem', route: '/report'   },
    { label: 'Get Help', icon: 'sos',            route: '/help'     },
    { label: 'Missions', icon: 'explore',        route: '/missions' },
    { label: 'Profile',  icon: 'person',         route: '/profile'  },
  ];

  ngOnChanges(): void {
    this.navItems = this.role === 'ADMIN' ? this.adminNav : this.userNav;
  }

  get ctaRoute(): string {
    return this.role === 'ADMIN' ? '/admin/incidents/new' : '/report';
  }

  get ctaLabel(): string {
    return this.role === 'ADMIN' ? 'New Incident' : 'Report Incident';
  }

  get accentColor(): string {
    return this.role === 'ADMIN' ? '#3B82F6' : '#aca3ff';
  }
}
