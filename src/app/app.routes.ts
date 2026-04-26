import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { roleGuard } from './core/guards/role.guard';

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

  // ── Unauthenticated pages ─────────────────────────────────────────────────
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing',         component: LandingComponent },
  { path: 'login',           component: LoginComponent },
  { path: 'register',        component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  // Social login callback
  {
    path: 'auth/social-success',
    loadComponent: () =>
      import('./modules/identity/social-auth-success/social-auth-success.component')
        .then(m => m.SocialAuthSuccessComponent),
  },

  // Chat — auth required, no layout shell
  {
    path: 'communication/chat',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/communication/chat/chat.component')
        .then(m => m.ChatComponent),
  },

  // =========================================================================
  // ADMIN — sidebar layout, prefixed under /admin so it NEVER overlaps
  // with citizen paths. roleGuard lets only admin roles through.
  // =========================================================================
  {
    path: 'admin',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN', 'ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard tabs
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'dashboard/incidents',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { tab: 'incidents' },
      },
      {
        path: 'dashboard/coordination',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { tab: 'coordination' },
      },

      // Shared admin pages
      { path: 'alerts',     component: AlertListComponent },
      { path: 'alerts/:id', component: AlertDetailComponent },
      { path: 'alerts/new', component: AlertDetailComponent },
      {
        path: 'opportunities',
        loadComponent: () =>
          import('./pages/opportunities/opportunities.component').then(m => m.OpportunitiesComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'alerts-map',
        loadComponent: () =>
          import('./pages/alerts-map/alerts-map.component').then(m => m.AlertsMapComponent),
      },
      {
        path: 'communication',
        loadComponent: () =>
          import('./modules/communication/communication/communication.component')
            .then(m => m.CommunicationComponent),
      },
      {
        path: 'incidents',
        loadComponent: () =>
          import('./pages/incidents/incident-list/incident-list.component').then(m => m.IncidentListComponent),
      },
      {
        path: 'incidents/new',
        loadComponent: () =>
          import('./pages/incidents/incident-form/incident-form.component').then(m => m.IncidentFormComponent),
      },
      {
        path: 'incidents/:id/edit',
        loadComponent: () =>
          import('./pages/incidents/incident-form/incident-form.component').then(m => m.IncidentFormComponent),
      },
      {
        path: 'coordination',
        loadComponent: () =>
          import('./pages/coordination/help-request-list/help-request-list.component')
            .then(m => m.HelpRequestListComponent),
      },
      {
        path: 'coordination/new',
        loadComponent: () =>
          import('./pages/coordination/help-request-form/help-request-form.component')
            .then(m => m.HelpRequestFormComponent),
      },

      // Admin-only pages
      { path: 'sensors',          canActivate: [adminGuard], component: SensorListComponent },
      { path: 'sensors/:id',      canActivate: [adminGuard], component: SensorDetailComponent },
      { path: 'geofence',         canActivate: [adminGuard], component: GeofenceMapComponent },
      { path: 'evacuation',       canActivate: [adminGuard], component: EvacuationRoutesComponent },
      { path: 'evacuation/:id',   canActivate: [adminGuard], component: RouteDetailComponent },
      { path: 'spatial',          canActivate: [adminGuard], component: SpatialDashboardComponent },
      {
        path: 'users-management',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/users-management/users-management.component').then(m => m.UsersManagementComponent),
      },
    ],
  },

  // Redirect old bare /dashboard → /admin/dashboard (bookmarks / back-compat)
  { path: 'dashboard',             redirectTo: '/admin/dashboard',            pathMatch: 'full' },
  { path: 'dashboard/incidents',   redirectTo: '/admin/dashboard/incidents',  pathMatch: 'full' },
  { path: 'dashboard/coordination',redirectTo: '/admin/dashboard/coordination',pathMatch: 'full' },

  // =========================================================================
  // CITIZEN / VOLUNTEER — top-nav public layout
  // No role restriction; authGuard only checks for a valid token.
  // =========================================================================
  {
    path: '',
    component: PublicLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', loadComponent: () =>
          import('./pages/public/home/home.component').then(m => m.HomeComponent) },
      { path: 'report', loadComponent: () =>
          import('./pages/public/report-wizard/report-wizard.component').then(m => m.ReportWizardComponent) },
      { path: 'help', loadComponent: () =>
          import('./pages/public/help-portal/help-portal.component').then(m => m.HelpPortalComponent) },
      { path: 'missions', loadComponent: () =>
          import('./pages/public/mission-board/mission-board.component').then(m => m.MissionBoardComponent) },
      { path: 'frontoffice-profile', loadComponent: () =>
          import('./pages/frontoffice-profile/frontoffice-profile.component').then(m => m.FrontofficeProfileComponent) },

      // Incidents (citizen "My Reports")
      { path: 'incidents', loadComponent: () =>
          import('./pages/incidents/incident-list/incident-list.component').then(m => m.IncidentListComponent) },
      { path: 'incidents/new', loadComponent: () =>
          import('./pages/incidents/incident-form/incident-form.component').then(m => m.IncidentFormComponent) },
      { path: 'incidents/:id/edit', loadComponent: () =>
          import('./pages/incidents/incident-form/incident-form.component').then(m => m.IncidentFormComponent) },

      // Coordination
      { path: 'coordination', loadComponent: () =>
          import('./pages/coordination/help-request-list/help-request-list.component').then(m => m.HelpRequestListComponent) },
      { path: 'coordination/new', loadComponent: () =>
          import('./pages/coordination/help-request-form/help-request-form.component').then(m => m.HelpRequestFormComponent) },

      // Alerts
      { path: 'alerts',     component: AlertListComponent },
      { path: 'alerts/:id', component: AlertDetailComponent },
      { path: 'alerts/new', component: AlertDetailComponent },

      // Read-only sensor / geo / evac / spatial for citizens
      { path: 'sensors',        loadComponent: () =>
          import('./pages/sensor-list/sensor-list.component').then(m => m.SensorListComponent) },
      { path: 'sensors/:id',    loadComponent: () =>
          import('./pages/sensor-detail/sensor-detail.component').then(m => m.SensorDetailComponent) },
      { path: 'geofence',       loadComponent: () =>
          import('./pages/geofence-map/geofence-map.component').then(m => m.GeofenceMapComponent) },
      { path: 'evacuation',     loadComponent: () =>
          import('./pages/evacuation-routes/evacuation-routes.component').then(m => m.EvacuationRoutesComponent) },
      { path: 'evacuation/:id', loadComponent: () =>
          import('./pages/route-detail/route-detail.component').then(m => m.RouteDetailComponent) },
      { path: 'spatial',        loadComponent: () =>
          import('./pages/spatial-dashboard/spatial-dashboard.component').then(m => m.SpatialDashboardComponent) },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  { path: '**', redirectTo: 'landing' },
];
