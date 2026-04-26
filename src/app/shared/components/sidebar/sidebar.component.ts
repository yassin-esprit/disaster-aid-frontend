import { Component, EventEmitter, Input, OnInit, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../models/nav-item.model';
import { AuthService } from '../../../core/services/auth.service';

const ADMIN_ROLES = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN'];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit, OnChanges {
  @Input() role: string = 'PLATFORM_ADMIN';
  @Output() logoutClicked = new EventEmitter<void>();

  // Declare missing properties
  userName: string = 'User';
  userRole: string = '';

  navItems: NavItem[] = [];

  // Unified admin navigation (using the correct dashboard routes)
  private adminNav: NavItem[] = [
    { label: 'Overview',      icon: 'dashboard',          route: '/dashboard'              },
    { label: 'Communication', icon: 'forum',              route: '/communication'          },
    { label: 'Sensors',         icon: 'sensors',        route: '/sensors'      },
    { label: 'Alerts',          icon: 'emergency',      route: '/alerts'       },
    { label: 'Geofence Zones',  icon: 'map',            route: '/geofence'     },
    { label: 'Evacuation',      icon: 'directions',     route: '/evacuation'   },
    { label: 'Spatial Queries', icon: 'travel_explore', route: '/spatial'      },
    { label: 'Incidents',     icon: 'report_problem',     route: '/dashboard/incidents'    },
    { label: 'Coordination',  icon: 'volunteer_activism', route: '/dashboard/coordination' },
    { label: 'Opportunities', icon: 'explore',            route: '/opportunities'          },
    { label: 'Users',         icon: 'people',             route: '/users-management'       },
    { label: 'My Profile',    icon: 'person',             route: '/profile'                },


  ];

  private userNav: NavItem[] = [
    { label: 'Home',          icon: 'home',               route: '/home'               },
    { label: 'Report',        icon: 'report_problem',     route: '/report'             },
    { label: 'Get Help',      icon: 'sos',                route: '/help'               },
    { label: 'Missions',      icon: 'explore',            route: '/missions'           },
    { label: 'My Reports',    icon: 'list_alt',           route: '/incidents'          },
    { label: 'Communication', icon: 'forum',              route: '/communication'      },
    { label: 'My Profile',    icon: 'person',             route: '/frontoffice-profile'},
  ];

  // Read-only getter – do NOT assign to it
  get isAdmin(): boolean {
    return ADMIN_ROLES.includes((this.role || '').toUpperCase());
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

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const roleFromService = (this.authService.getRole() || '').trim().toUpperCase();
    // If @Input role is not provided, fallback to service role
    if (!this.role || this.role === 'PLATFORM_ADMIN') {
      this.role = roleFromService;
    }
    this.userRole = this.role;
    this.userName = localStorage.getItem('email')?.split('@')[0] || 'User';
    this.updateNavItems();
  }

  ngOnChanges(): void {
    this.updateNavItems();
  }

  private updateNavItems(): void {
    this.navItems = this.isAdmin ? this.adminNav : this.userNav;
  }

  onLogout(): void {
    localStorage.clear();
    this.authService.logout(); // if your service has a logout method
    this.router.navigateByUrl('/landing');
  }
}
