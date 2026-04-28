import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { MobileNavComponent } from '../../shared/components/mobile-nav/mobile-nav.component';
import { RouterOutlet } from '@angular/router';

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
  ],
  templateUrl: './authenticated-layout.component.html',
})
export class AuthenticatedLayoutComponent {
  @Input() pageTitle: string = 'Dashboard';
  @Input() breadcrumb: string = '';
}
