import { Routes } from '@angular/router';
import { LandingComponent }     from './pages/landing/landing.component';
import { LoginComponent }       from './pages/login/login.component';
import { RegisterComponent }    from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';
import { PublicLayoutComponent }        from './layouts/public-layout/public-layout.component';
import { authGuard }            from './core/guards/auth.guard';
import { roleGuard }            from './core/guards/role.guard';

export const routes: Routes = [

  // ── Unauthenticated public pages ─────────────────────────────────────────
  { path: '',          redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing',   component: LandingComponent },
  { path: 'login',     component: LoginComponent },
  { path: 'register',  component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  // OAuth2 social login callback
  {
    path: 'auth/social-success',
    loadComponent: () =>
      import('./modules/identity/social-auth-success/social-auth-success.component')
        .then(m => m.SocialAuthSuccessComponent),
  },

  // ── ADMIN — sidebar layout (/dashboard + /admin/*) ────────────────────────
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN','ADMIN'] },
    children: [

      // ── Unified Dashboard (overview / incidents / coordination tabs) ──
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
      {
        path: 'users-management',
        loadComponent: () => import('./pages/users-management/users-management.component')
          .then(m => m.UsersManagementComponent),
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
