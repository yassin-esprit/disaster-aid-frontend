import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
export const routes: Routes = [

  // ===== PUBLIC ROUTES =====
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: LandingComponent },
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
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard],
    children: [

      // Dashboard page, only accessible to authenticated users
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent),
      },

      // Alerts, requires authentication
      {
        path: 'alerts',
        loadComponent: () =>
          import('./pages/alerts-map/alerts-map.component')
            .then(m => m.AlertsMapComponent),
      },

      // Incident reporting, requires authentication
      {
        path: 'incidents',
        loadComponent: () =>
          import('./pages/incident-form/incident-form.component')
            .then(m => m.IncidentFormComponent),
      },

      // Opportunities page, requires authentication
      {
        path: 'opportunities',
        loadComponent: () =>
          import('./pages/opportunities/opportunities.component')
            .then(m => m.OpportunitiesComponent),
      },
      
      // Profile page, only accessible to authenticated users
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component')
            .then(m => m.ProfileComponent),
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

  // ===== FALLBACK ROUTE =====
  { path: '**', redirectTo: 'landing' },
];