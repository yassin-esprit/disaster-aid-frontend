import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';
import { SensorListComponent } from './pages/sensor-list/sensor-list.component';
import { SensorDetailComponent } from './pages/sensor-detail/sensor-detail.component';
import { AlertListComponent } from './pages/alert-list/alert-list.component';
import { AlertDetailComponent } from './pages/alert-detail/alert-detail.component';
import { GeofenceMapComponent } from './pages/geofence-map/geofence-map.component';
import { EvacuationRoutesComponent } from './pages/evacuation-routes/evacuation-routes.component';
import { RouteDetailComponent } from './pages/route-detail/route-detail.component';
import { SpatialDashboardComponent } from './pages/spatial-dashboard/spatial-dashboard.component';
import { authGuard, adminGuard } from './core/guards/auth.guard';
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
      // Shared routes (all authenticated users)
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      { path: 'alerts', component: AlertListComponent },                          // view-only for all
      { path: 'alerts/:id', component: AlertDetailComponent },                   // view-only for all
      { path: 'incidents', loadComponent: () => import('./pages/incident-form/incident-form.component').then(m => m.IncidentFormComponent) },
      { path: 'opportunities', loadComponent: () => import('./pages/opportunities/opportunities.component').then(m => m.OpportunitiesComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'alerts-map', loadComponent: () => import('./pages/alerts-map/alerts-map.component').then(m => m.AlertsMapComponent) },
      { path: 'communication', loadComponent: () => import('./modules/communication/communication/communication.component').then(m => m.CommunicationComponent) },

      // ===== ADMIN-ONLY ROUTES =====
      { path: 'sensors',        canActivate: [adminGuard], component: SensorListComponent },
      { path: 'sensors/:id',    canActivate: [adminGuard], component: SensorDetailComponent },
      { path: 'alerts/new',     canActivate: [adminGuard], component: AlertDetailComponent },
      { path: 'geofence',       canActivate: [adminGuard], component: GeofenceMapComponent },
      { path: 'evacuation',     canActivate: [adminGuard], component: EvacuationRoutesComponent },
      { path: 'evacuation/:id', canActivate: [adminGuard], component: RouteDetailComponent },
      { path: 'spatial',        canActivate: [adminGuard], component: SpatialDashboardComponent },
      {
        path: 'users-management',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/users-management/users-management.component').then(m => m.UsersManagementComponent)
      },
    ]
  },

  // ===== FALLBACK ROUTE =====
  { path: '**', redirectTo: 'landing' }
];
