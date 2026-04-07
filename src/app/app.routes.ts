import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // TODO: move under the main authGuard block once the auth branch is merged
  {
    path: 'analytics',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/analytics-dashboard/analytics-dashboard.component').then(
            (m) => m.AnalyticsDashboardComponent
          ),
      },
      {
        path: 'models',
        loadComponent: () =>
          import('./pages/analytics-models/analytics-models.component').then(
            (m) => m.AnalyticsModelsComponent
          ),
      },
      {
        path: 'lookups',
        loadComponent: () =>
          import('./pages/analytics-lookups/analytics-lookups.component').then(
            (m) => m.AnalyticsLookupsComponent
          ),
      },
    ],
  },

  {
    path: '',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard],   // ✅ PROTECTION
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./pages/alerts-map/alerts-map.component').then(
            (m) => m.AlertsMapComponent
          ),
      },
      {
        path: 'incidents',
        loadComponent: () =>
          import('./pages/incident-form/incident-form.component').then(
            (m) => m.IncidentFormComponent
          ),
      },
      {
        path: 'opportunities',
        loadComponent: () =>
          import('./pages/opportunities/opportunities.component').then(
            (m) => m.OpportunitiesComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
      {
        path: 'users-management',
        loadComponent: () =>
          import('./pages/users-management/users-management.component').then(
            (m) => m.UsersManagementComponent
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'landing' },
];