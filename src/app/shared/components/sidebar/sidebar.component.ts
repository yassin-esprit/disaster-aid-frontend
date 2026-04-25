import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../models/nav-item.model';
import { AuthService } from '../../../core/services/auth.service';

const ADMIN_ROLES = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN'];

const ADMIN_NAV: NavItem[] = [
  { label: 'Overview',        icon: 'dashboard',        route: '/dashboard'         },
  { label: 'Sensors',         icon: 'sensors',          route: '/sensors'           },
  { label: 'Alerts',          icon: 'emergency',        route: '/alerts'            },
  { label: 'Geofence Zones',  icon: 'map',              route: '/geofence'          },
  { label: 'Evacuation',      icon: 'directions',       route: '/evacuation'        },
  { label: 'Spatial Queries', icon: 'travel_explore',   route: '/spatial'           },
  { label: 'Incidents',       icon: 'report_problem',   route: '/incidents'         },
  { label: 'Opportunities',   icon: 'explore',          route: '/opportunities'     },
  { label: 'Communication',   icon: 'forum',            route: '/communication'     },
  { label: 'Users',           icon: 'people',           route: '/users-management'  },
  { label: 'My Profile',      icon: 'person',           route: '/profile'           },
];

const VOLUNTEER_NAV: NavItem[] = [
  { label: 'Home',            icon: 'home',             route: '/landing'           },
  { label: 'Alerts',          icon: 'emergency',        route: '/alerts'            },
  { label: 'Incidents',       icon: 'report_problem',   route: '/incidents'         },
  { label: 'Opportunities',   icon: 'explore',          route: '/opportunities'     },
  { label: 'Communication',   icon: 'forum',            route: '/communication'     },
  { label: 'My Profile',      icon: 'person',           route: '/profile'           },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  @Input() accentColor: string = '#6C5CE7';
  @Output() logoutClicked = new EventEmitter<void>();
  @Input() ctaLabel: string = 'Report Incident';
  @Input() ctaRoute: string = '/incidents';

  navItems: NavItem[] = [];
  isAdmin = false;
  userName = 'User';
  userRole = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const role = (this.authService.getRole() || '').trim().toUpperCase();
    this.isAdmin = ADMIN_ROLES.includes(role);
    this.navItems = this.isAdmin ? ADMIN_NAV : VOLUNTEER_NAV;
    this.userName = localStorage.getItem('email')?.split('@')[0] || 'User';
    this.userRole = role;
  }

  onLogout(): void {
    this.logoutClicked.emit();
  }
}
