import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent }   from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent }    from '../../shared/components/header/header.component';
import { MobileNavComponent } from '../../shared/components/mobile-nav/mobile-nav.component';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent, MobileNavComponent],
  templateUrl: './authenticated-layout.component.html'
})
export class AuthenticatedLayoutComponent {
  // TODO: replace with real auth service
  // For now: change this to 'ADMIN' to test admin view, 'VOLUNTEER' for user view
  currentRole: string = 'VOLUNTEER';
}
