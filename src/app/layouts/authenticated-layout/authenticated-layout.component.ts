import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent }   from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent }    from '../../shared/components/header/header.component';
import { MobileNavComponent } from '../../shared/components/mobile-nav/mobile-nav.component';
@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent,
    MobileNavComponent,
    RouterOutlet,
    SidebarComponent,
    HeaderComponent,       // ✅ AJOUTÉ
    MobileNavComponent
  ],
  templateUrl: './authenticated-layout.component.html',
})
export class AuthenticatedLayoutComponent {
  // This layout is admin-only — always ADMIN role
  currentRole: string = 'ADMIN';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
