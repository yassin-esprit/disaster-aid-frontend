import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticatedLayoutComponent } from '../../layouts/authenticated-layout/authenticated-layout.component';

interface EvacuationRoute {
  name: string;
  distanceKm: number;
  status: 'OPEN' | 'BLOCKED';
  zone: string;
}

@Component({
  selector: 'app-evacuation-routes',
  standalone: true,
  imports: [CommonModule, AuthenticatedLayoutComponent],
  templateUrl: './evacuation-routes.component.html',
})
export class EvacuationRoutesComponent {
  routes: EvacuationRoute[] = [
    { name: 'Route A1 - Centre Nord', distanceKm: 4.2, status: 'OPEN', zone: 'Tunis Centre' },
    { name: 'Route B3 - Cote Est', distanceKm: 7.8, status: 'BLOCKED', zone: 'La Marsa' },
    { name: 'Route C7 - Sortie Ouest', distanceKm: 6.1, status: 'OPEN', zone: 'Manouba' },
    { name: 'Route D2 - Corridor Sud', distanceKm: 9.4, status: 'OPEN', zone: 'Ben Arous' },
  ];
}
