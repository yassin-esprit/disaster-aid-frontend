import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SidebarComponent }   from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent }    from '../../shared/components/header/header.component';
import { MobileNavComponent } from '../../shared/components/mobile-nav/mobile-nav.component';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, MobileNavComponent, SidebarComponent],
  templateUrl: './authenticated-layout.component.html',
})
export class AuthenticatedLayoutComponent implements OnInit {

  // Real role from JWT stored in localStorage by AuthService
  currentRole: string = 'PLATFORM_ADMIN';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const role = this.authService.getRole();
    this.currentRole = role ?? 'PLATFORM_ADMIN';
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
