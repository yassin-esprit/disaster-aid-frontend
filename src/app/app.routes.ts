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

      // M06 — Skills
      {
        path: 'skills',
        loadComponent: () =>
          import('./pages/skills/skill-list/skill-list.component').then(
            (m) => m.SkillListComponent,
          ),
      },
      {
        path: 'skills/new',
        loadComponent: () =>
          import('./pages/skills/skill-form/skill-form.component').then(
            (m) => m.SkillFormComponent,
          ),
      },
      {
        path: 'skills/import',
        loadComponent: () =>
          import('./pages/skills/skill-import/skill-import.component').then(
            (m) => m.SkillImportComponent,
          ),
      },
      {
        path: 'skills/timeline',
        loadComponent: () =>
          import('./pages/skills/skill-timeline/skill-timeline.component').then(
            (m) => m.SkillTimelineComponent,
          ),
      },
      {
        path: 'skills/:id/edit',
        loadComponent: () =>
          import('./pages/skills/skill-form/skill-form.component').then(
            (m) => m.SkillFormComponent,
          ),
      },
      {
        path: 'volunteer-skills',
        loadComponent: () =>
          import(
            './pages/volunteer-skills/volunteer-skill-list/volunteer-skill-list.component'
          ).then((m) => m.VolunteerSkillListComponent),
      },
      {
        path: 'volunteer-skills/new',
        loadComponent: () =>
          import(
            './pages/volunteer-skills/volunteer-skill-form/volunteer-skill-form.component'
          ).then((m) => m.VolunteerSkillFormComponent),
      },
      {
        path: 'volunteer-skills/:id',
        loadComponent: () =>
          import(
            './pages/volunteer-skills/volunteer-skill-detail/volunteer-skill-detail.component'
          ).then((m) => m.VolunteerSkillDetailComponent),
      },

      // M07 — Opportunities
      {
        path: 'opportunities',
        loadComponent: () =>
          import(
            './pages/opportunities/opportunity-list/opportunity-list.component'
          ).then((m) => m.OpportunityListComponent),
      },
      {
        path: 'opportunities/new',
        loadComponent: () =>
          import(
            './pages/opportunities/opportunity-form/opportunity-form.component'
          ).then((m) => m.OpportunityFormComponent),
      },
      {
        path: 'opportunities/:id/edit',
        loadComponent: () =>
          import(
            './pages/opportunities/opportunity-form/opportunity-form.component'
          ).then((m) => m.OpportunityFormComponent),
      },
      {
        path: 'opportunities/:id',
        loadComponent: () =>
          import(
            './pages/opportunities/opportunity-detail/opportunity-detail.component'
          ).then((m) => m.OpportunityDetailComponent),
      },
      {
        path: 'applications',
        loadComponent: () =>
          import(
            './pages/applications/application-list/application-list.component'
          ).then((m) => m.ApplicationListComponent),
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
  {
    path: 'credential/:id',
    loadComponent: () =>
      import('./pages/credential/credential.component').then(
        (m) => m.CredentialComponent,
      ),
  },

  { path: '**', redirectTo: '' },
];