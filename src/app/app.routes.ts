import { Routes } from '@angular/router';
import { LandingComponent }     from './pages/landing/landing.component';
import { LoginComponent }       from './pages/login/login.component';
import { RegisterComponent }    from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';
import { PublicLayoutComponent }        from './layouts/public-layout/public-layout.component';
import { authGuard }            from './core/guards/auth.guard';
import { roleGuard }            from './core/guards/role.guard';

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

  // ── Unauthenticated public pages ─────────────────────────────────────────
  { path: '',          redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing',   component: LandingComponent },
  { path: 'login',     component: LoginComponent },
  { path: 'register',  component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  // ===== SOCIAL LOGIN CALLBACK =====
  {
    path: 'auth/social-success',
    loadComponent: () =>
      import('./modules/identity/social-auth-success/social-auth-success.component')
        .then(m => m.SocialAuthSuccessComponent),
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
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN','ADMIN'] },
    children: [

      // Dashboard page, only accessible to authenticated users
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'dashboard/incidents',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { tab: 'incidents' }
      },
      {
        path: 'dashboard/coordination',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { tab: 'coordination' }
      },

      // ── Other admin sections ──
      {
        path: 'alerts',
        loadComponent: () => import('./pages/alerts-map/alerts-map.component')
          .then(m => m.AlertsMapComponent),
      },
      {
        path: 'opportunities',
        loadComponent: () => import('./pages/opportunities/opportunities.component')
          .then(m => m.OpportunitiesComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component')
          .then(m => m.ProfileComponent),
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
        loadComponent: () => import('./pages/users-management/users-management.component')
          .then(m => m.UsersManagementComponent),
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/users-management/users-management.component').then(m => m.UsersManagementComponent)
      },
      {
        path: 'communication',
        loadComponent: () => import('./modules/communication/communication/communication.component')
          .then(m => m.CommunicationComponent),
      },

      // ── Creation forms (still under /admin/* to preserve old links) ──
      {
        path: 'admin/incidents/new',
        loadComponent: () => import('./pages/incidents/incident-form/incident-form.component')
          .then(m => m.IncidentFormComponent),
      },
      {
        path: 'admin/incidents/:id/edit',
        loadComponent: () => import('./pages/incidents/incident-form/incident-form.component')
          .then(m => m.IncidentFormComponent),
      },
      {
        path: 'admin/coordination/new',
        loadComponent: () => import('./pages/coordination/help-request-form/help-request-form.component')
          .then(m => m.HelpRequestFormComponent),
      },

      // ── Redirects for old admin list URLs (optional) ──
      { path: 'admin/incidents', redirectTo: '/dashboard/incidents', pathMatch: 'full' },
      { path: 'admin/coordination', redirectTo: '/dashboard/coordination', pathMatch: 'full' },
    ],
  },

  // ── Chat (standalone — no sidebar layout) ────────────────────────────────
  {
    path: 'communication/chat',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/communication/chat/chat.component')
      .then(m => m.ChatComponent),
  },

  // ── VOLUNTEER / CITIZEN — public top-nav layout ───────────────────────────
  {
    path: '',
    component: PublicLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/public/home/home.component')
          .then(m => m.HomeComponent),
      },
      {
        path: 'report',
        loadComponent: () => import('./pages/public/report-wizard/report-wizard.component')
          .then(m => m.ReportWizardComponent),
      },
      {
        path: 'help',
        loadComponent: () => import('./pages/public/help-portal/help-portal.component')
          .then(m => m.HelpPortalComponent),
      },
      {
        path: 'missions',
        loadComponent: () => import('./pages/public/mission-board/mission-board.component')
          .then(m => m.MissionBoardComponent),
      },
      {
        path: 'incidents',
        loadComponent: () => import('./pages/incidents/incident-list/incident-list.component')
          .then(m => m.IncidentListComponent),
      },
      {
        path: 'incidents/new',
        loadComponent: () => import('./pages/incidents/incident-form/incident-form.component')
          .then(m => m.IncidentFormComponent),
      },
      {
        path: 'incidents/:id/edit',
        loadComponent: () => import('./pages/incidents/incident-form/incident-form.component')
          .then(m => m.IncidentFormComponent),
      },
      {
        path: 'coordination',
        loadComponent: () => import('./pages/coordination/help-request-list/help-request-list.component')
          .then(m => m.HelpRequestListComponent),
      },
      {
        path: 'coordination/new',
        loadComponent: () => import('./pages/coordination/help-request-form/help-request-form.component')
          .then(m => m.HelpRequestFormComponent),
      },
      {
        path: 'frontoffice-profile',
        loadComponent: () => import('./pages/frontoffice-profile/frontoffice-profile.component')
          .then(m => m.FrontofficeProfileComponent),
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  { path: '**', redirectTo: 'landing' },
];
