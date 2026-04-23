import { Routes } from '@angular/router';
import { LandingComponent }             from './pages/landing/landing.component';
import { LoginComponent }               from './pages/login/login.component';
import { RegisterComponent }            from './pages/register/register.component';
import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';
import { PublicLayoutComponent }        from './layouts/public-layout/public-layout.component';

export const routes: Routes = [
  // ── Public unauthenticated ────────────────────────────
  { path: '',         component: LandingComponent  },
  { path: 'login',    component: LoginComponent    },
  { path: 'register', component: RegisterComponent },

  // ── Volunteer / Citizen — public top-nav layout ───────
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/public/home/home.component')
          .then(m => m.HomeComponent)
      },
      {
        path: 'report',
        loadComponent: () => import('./pages/public/report-wizard/report-wizard.component')
          .then(m => m.ReportWizardComponent)
      },
      {
        path: 'help',
        loadComponent: () => import('./pages/public/help-portal/help-portal.component')
          .then(m => m.HelpPortalComponent)
      },
      {
        path: 'missions',
        loadComponent: () => import('./pages/public/mission-board/mission-board.component')
          .then(m => m.MissionBoardComponent)
      },
      {
        path: 'incidents',
        loadComponent: () => import('./pages/incidents/incident-list/incident-list.component')
          .then(m => m.IncidentListComponent)
      },
      {
        path: 'incidents/new',
        loadComponent: () => import('./pages/incidents/incident-form/incident-form.component')
          .then(m => m.IncidentFormComponent)
      },
      {
        path: 'incidents/:id/edit',
        loadComponent: () => import('./pages/incidents/incident-form/incident-form.component')
          .then(m => m.IncidentFormComponent)
      },
      {
        path: 'coordination',
        loadComponent: () => import('./pages/coordination/help-request-list/help-request-list.component')
          .then(m => m.HelpRequestListComponent)
      },
      {
        path: 'coordination/new',
        loadComponent: () => import('./pages/coordination/help-request-form/help-request-form.component')
          .then(m => m.HelpRequestFormComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component')
          .then(m => m.ProfileComponent)
      },
    ]
  },

  // ── Admin — sidebar layout ────────────────────────────
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./pages/alerts-map/alerts-map.component')
          .then(m => m.AlertsMapComponent)
      },
      {
        path: 'opportunities',
        loadComponent: () => import('./pages/opportunities/opportunities.component')
          .then(m => m.OpportunitiesComponent)
      },
    ]
  },

  { path: '**', redirectTo: '' }
];
