import { Component, EventEmitter, Input, OnInit, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../models/nav-item.model';
import { AuthService } from '../../../core/services/auth.service';
import { ReportService } from '../../../core/services/report.service';

const ADMIN_ROLES = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN', 'ADMIN'];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit, OnChanges {
  @Input() role: string = 'PLATFORM_ADMIN';
  @Output() logoutClicked = new EventEmitter<void>();

  userName: string = 'User';
  userRole: string = '';
  navItems: NavItem[] = [];

  private adminNav: NavItem[] = [
    { label: 'Overview',        icon: 'dashboard',          route: '/admin/dashboard'              },
    { label: 'Incidents',       icon: 'report_problem',     route: '/admin/dashboard/incidents'    },
    { label: 'Coordination',    icon: 'volunteer_activism', route: '/admin/dashboard/coordination' },
    { label: 'Analytics',       icon: 'analytics',          route: '/analytics'                    },
    { label: 'Resource Agency / Resource', icon: 'inventory_2', route: '/admin/resource-form'      },
    { label: 'Shelter Agency / Shelter',   icon: 'home_work',    route: '/admin/shelter-form'       },
    { label: 'Back Office / Resources',    icon: 'warehouse',    route: '/admin/backoffice-resources' },
    { label: 'Back Office / Shelters',     icon: 'domain',       route: '/admin/backoffice-shelters' },
    { label: 'Back Office / Reports',      icon: 'assessment',   route: '/admin/backoffice-reports' },
    { label: 'Alerts',          icon: 'emergency',          route: '/admin/alerts'                 },
    { label: 'Sensors',         icon: 'sensors',            route: '/admin/sensors'                },
    { label: 'Geofence Zones',  icon: 'map',                route: '/admin/geofence'               },
    { label: 'Evacuation',      icon: 'directions',         route: '/admin/evacuation'             },
    { label: 'Spatial Queries', icon: 'travel_explore',     route: '/admin/spatial'                },
    { label: 'Communication',   icon: 'forum',              route: '/admin/communication'          },
    { label: 'Opportunities',   icon: 'explore',            route: '/admin/opportunities'          },
    { label: 'Skills',           icon: 'psychology',      route: '/admin/skills'           },
    { label: 'Import Skills',    icon: 'upload_file',     route: '/admin/skills/import'    },
    { label: 'Skill Timeline',   icon: 'timeline',        route: '/admin/skills/timeline'  },
    { label: 'Volunteer Skills', icon: 'verified',        route: '/admin/volunteer-skills' },
    { label: 'Opp. Management',  icon: 'work',            route: '/admin/opportunity-list' },
    { label: 'Applications',     icon: 'assignment',      route: '/admin/applications'     },
    { label: 'Users',           icon: 'people',             route: '/admin/users-management'       },
    { label: 'My Profile',      icon: 'person',             route: '/admin/profile'                },
    { label: 'Hours', icon: 'watch', route: '/admin/hours' },
    { label: 'Gamification', icon: 'celebration', route: '/admin/gamification' },
  ];

  private userNav: NavItem[] = [
    { label: 'Home',          icon: 'home',           route: '/home'                },
    { label: 'Report',        icon: 'report_problem', route: '/report'              },
    { label: 'Get Help',      icon: 'sos',            route: '/help'                },
    { label: 'Missions',      icon: 'explore',        route: '/missions'            },
    { label: 'Browse Skills', icon: 'psychology',     route: '/skills-browse'       },
    { label: 'My Reports',    icon: 'list_alt',       route: '/incidents'           },
    { label: 'Alerts',        icon: 'emergency',      route: '/alerts'              },
    { label: 'Communication', icon: 'forum',          route: '/communication/chat'  },
    { label: 'My Profile',    icon: 'person',         route: '/frontoffice-profile' },
  ];

  get isAdmin(): boolean {
    return ADMIN_ROLES.includes((this.role || '').trim().toUpperCase());
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

  downloadingReport = false;
  reportError = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private reportService: ReportService,
  ) {}

  downloadReport(): void {
    if (this.downloadingReport) return;
    this.downloadingReport = true;
    this.reportError = '';
    this.reportService.downloadAnalyticsReport().subscribe({
      next: (res) => {
        const blob = res.body;
        if (!blob) {
          this.reportError = 'Empty response';
          this.downloadingReport = false;
          return;
        }
        const filename = this.reportService.filenameFromResponse(
          res.headers,
          `analytics_report_${new Date().toISOString().slice(0, 10)}.pdf`,
        );
        this.reportService.saveBlob(blob, filename);
        this.downloadingReport = false;
      },
      error: (err) => {
        console.error('Report download failed', err);
        this.reportError = err?.error?.message || 'Failed to generate report';
        this.downloadingReport = false;
        setTimeout(() => (this.reportError = ''), 5000);
      },
    });
  }

  ngOnInit(): void {
    const roleFromService = (this.authService.getRole() || '').trim().toUpperCase();
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
    this.authService.logout();
    this.router.navigateByUrl('/landing');
  }
}
