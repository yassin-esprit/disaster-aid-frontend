import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { MobileNavComponent } from '../../shared/components/mobile-nav/mobile-nav.component';

const ADMIN_ROLES = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN', 'ADMIN'];

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, MobileNavComponent, SidebarComponent],
  templateUrl: './authenticated-layout.component.html',
})
export class AuthenticatedLayoutComponent implements OnInit {
  currentRole: string = 'PLATFORM_ADMIN';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const role = (this.authService.getRole() || '').trim().toUpperCase();

    if (!ADMIN_ROLES.includes(role)) {
      this.router.navigateByUrl('/home');
      return;
    }

    this.currentRole = ADMIN_ROLES.includes(role) ? role : 'ADMIN';
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
