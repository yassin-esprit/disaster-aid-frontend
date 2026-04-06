// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';

// Direct imports for new components (Modules 2 & 12)
import { SensorListComponent } from './pages/sensor-list/sensor-list.component';
import { SensorDetailComponent } from './pages/sensor-detail/sensor-detail.component';
import { AlertListComponent } from './pages/alert-list/alert-list.component';
import { AlertDetailComponent } from './pages/alert-detail/alert-detail.component';
import { GeofenceMapComponent } from './pages/geofence-map/geofence-map.component';
import { EvacuationRoutesComponent } from './pages/evacuation-routes/evacuation-routes.component';
import { RouteDetailComponent } from './pages/route-detail/route-detail.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      // Existing dashboard (lazy-loaded, works)
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },

      // Module 2: Sensors & Alerts (direct imports)
      { path: 'sensors', component: SensorListComponent },
      { path: 'sensors/:id', component: SensorDetailComponent },
      { path: 'alerts', component: AlertListComponent },
      { path: 'alerts/new', component: AlertDetailComponent },
      { path: 'alerts/:id', component: AlertDetailComponent },
      { path: 'geofence', component: GeofenceMapComponent },

      // Module 12: Evacuation Routes (direct imports)
      { path: 'evacuation', component: EvacuationRoutesComponent },
      { path: 'evacuation/:id', component: RouteDetailComponent },

      // Existing pages (lazy-loaded, keep as is)
      { path: 'incidents', loadComponent: () => import('./pages/incident-form/incident-form.component').then(m => m.IncidentFormComponent) },
      { path: 'opportunities', loadComponent: () => import('./pages/opportunities/opportunities.component').then(m => m.OpportunitiesComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
