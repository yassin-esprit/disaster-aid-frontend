import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./pages/alerts-map/alerts-map.component').then(
            (m) => m.AlertsMapComponent,
          ),
      },
      {
        path: 'incidents',
        loadComponent: () =>
          import('./pages/incident-form/incident-form.component').then(
            (m) => m.IncidentFormComponent,
          ),
      },
      {
        path: 'opportunities',
        loadComponent: () =>
          import('./pages/opportunities/opportunities.component').then(
            (m) => m.OpportunitiesComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
