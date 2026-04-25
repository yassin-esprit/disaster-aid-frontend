import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router,RouterModule, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../models/nav-item.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnChanges {
  isAuthenticated = false;
  constructor(private router: Router) {}
  @Input() role: string = 'PLATFORM_ADMIN';
  @Output() logoutClicked = new EventEmitter<void>();

  navItems: NavItem[] = [];

  private adminRoles = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN'];

  // Admin nav – now uses /dashboard/incidents and /dashboard/coordination
  private adminNav: NavItem[] = [
    { label: 'Overview',      icon: 'dashboard',          route: '/dashboard'              },
    { label: 'Incidents',     icon: 'report_problem',     route: '/dashboard/incidents'     },
    { label: 'Coordination',  icon: 'volunteer_activism', route: '/dashboard/coordination'  },
    { label: 'Alerts',        icon: 'emergency',          route: '/alerts'                  },
    { label: 'Opportunities', icon: 'explore',            route: '/opportunities'           },
    { label: 'Users',         icon: 'people',             route: '/users-management'        },
    { label: 'Communication', icon: 'forum',              route: '/communication'           },
    { label: 'My Profile',    icon: 'person',             route: '/profile'                 },
  ];

  // Volunteer/Citizen nav (unchanged)
  private userNav: NavItem[] = [
    { label: 'Home',          icon: 'home',               route: '/home'               },
    { label: 'Report',        icon: 'report_problem',     route: '/report'             },
    { label: 'Get Help',      icon: 'sos',                route: '/help'               },
    { label: 'Missions',      icon: 'explore',            route: '/missions'           },
    { label: 'My Reports',    icon: 'list_alt',           route: '/incidents'          },
    { label: 'Communication', icon: 'forum',              route: '/communication'      },
    { label: 'My Profile',    icon: 'person',             route: '/frontoffice-profile'},
  ];

  get isAdmin(): boolean {
    return this.adminRoles.includes((this.role || '').toUpperCase());
  }

  get accentColor(): string {
    return this.isAdmin ? '#3B82F6' : '#aca3ff';
  }

  get ctaRoute(): string {
    return this.isAdmin ? '/admin/incidents/new' : '/report';
  }

  get ctaLabel(): string {
    return this.isAdmin ? 'New Incident' : 'Report Incident';
  }

  ngOnChanges(): void {
    this.navItems = this.isAdmin ? this.adminNav : this.userNav;
  }

  onLogout(): void {
    localStorage.clear();
    this.isAuthenticated = false;
    this.router.navigateByUrl('/landing');  }
}
