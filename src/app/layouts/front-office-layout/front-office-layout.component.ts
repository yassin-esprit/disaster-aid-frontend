import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-front-office-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './front-office-layout.component.html',
  styleUrl: './front-office-layout.component.scss',
})
export class FrontOfficeLayoutComponent {
  links = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Resource', route: '/resource' },
    { label: 'Shelter', route: '/shelter' },
    { label: 'Reviews', route: '/reviews' },
    { label: 'Reports', route: '/reports' },
    { label: 'Nearby Shelters', route: '/nearby-shelters' },
    { label: 'Evacuation Routes', route: '/evacuation-routes' },
  ];

}
