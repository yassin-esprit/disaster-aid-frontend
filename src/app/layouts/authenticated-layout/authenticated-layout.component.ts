import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { MobileNavComponent } from '../../shared/components/mobile-nav/mobile-nav.component';
@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    HeaderComponent,       // ✅ AJOUTÉ
    MobileNavComponent     // ✅ AJOUTÉ
  ],
  templateUrl: './authenticated-layout.component.html',
  styleUrl: './authenticated-layout.component.scss'
})
export class AuthenticatedLayoutComponent {

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