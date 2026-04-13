import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';
import { AdminLayoutComponent } from './pages/admin/admin-layout/admin-layout.component';

export const routes: Routes = [
  // Public
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  // ===== SOCIAL LOGIN CALLBACK =====
  {
    path: 'auth/social-success',
    loadComponent: () =>
      import('./modules/identity/social-auth-success/social-auth-success.component')
        .then(m => m.SocialAuthSuccessComponent),
  },
  {
        path: 'frontoffice-profile',
        loadComponent: () =>
          import('./pages/frontoffice-profile/frontoffice-profile.component')
            .then(m => m.FrontofficeProfileComponent),
  },

  // ===== CHAT (AUTH REQUIRED) =====
  {
    path: 'communication/chat',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/communication/chat/chat.component')
        .then(m => m.ChatComponent),
  },

  // ===== AUTHENTICATED LAYOUT =====
  // Front Office — authenticated layout
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
        path: 'incidents',
        loadComponent: () =>
          import('./pages/incidents/incident-list/incident-list.component').then(
            (m) => m.IncidentListComponent,
          ),
      },

      // Incident reporting, requires authentication
      {
        path: 'incidents/new',
        loadComponent: () =>
          import('./pages/incidents/incident-form/incident-form.component').then(
            (m) => m.IncidentFormComponent,
          ),
      },
      {
        path: 'coordination',
        loadComponent: () =>
          import('./pages/coordination/help-request-list/help-request-list.component').then(
            (m) => m.HelpRequestListComponent,
          ),
      },
      {
        path: 'coordination/new',
        loadComponent: () =>
          import('./pages/coordination/help-request-form/help-request-form.component').then(
            (m) => m.HelpRequestFormComponent,
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
        path: 'opportunities',
        loadComponent: () =>
          import('./pages/opportunities/opportunities.component').then(
            (m) => m.OpportunitiesComponent,
          ),
      },

      // Profile page, only accessible to authenticated users
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },

      // Users management page (Admin only)
      {
        path: 'users-management',
        loadComponent: () =>
          import('./pages/users-management/users-management.component')
            .then(m => m.UsersManagementComponent),
      },

      // Communication page, only accessible to authenticated users
      {
        path: 'communication',
        loadComponent: () =>
          import('./modules/communication/communication/communication.component')
            .then(m => m.CommunicationComponent),
      },
    ],
  },

  // Back Office — admin layout
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'incidents', pathMatch: 'full' },
      {
        path: 'incidents',
        loadComponent: () =>
          import('./pages/admin/admin-incidents/admin-incidents.component').then(
            (m) => m.AdminIncidentsComponent,
          ),
      },
      {
        path: 'coordination',
        loadComponent: () =>
          import('./pages/admin/admin-coordination/admin-coordination.component').then(
            (m) => m.AdminCoordinationComponent,
          ),
      },
    ],
  },

  { path: '**', redirectTo: '' },
  // ===== FALLBACK ROUTE =====
  { path: '**', redirectTo: 'landing' },
];
