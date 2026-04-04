import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './mobile-nav.component.html',
})
export class MobileNavComponent {
  items = [
    { label: 'Home', icon: 'dashboard', route: '/dashboard' },
    { label: 'Alerts', icon: 'emergency', route: '/alerts' },
    { label: 'Browse', icon: 'explore', route: '/opportunities' },
    { label: 'Profile', icon: 'person', route: '/profile' },
  ];
}
