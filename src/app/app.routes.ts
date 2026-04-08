import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
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
      import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'resource',
    loadComponent: () =>
      import('./pages/resource-form').then(
        (m) => m.ResourceFormComponent,
      ),
  },
  {
    path: 'resources',
    loadComponent: () =>
      import('./pages/resource-form').then(
        (m) => m.ResourceFormComponent,
      ),
  },
  {
    path: 'resources/add',
    loadComponent: () =>
      import('./pages/resource-form').then(
        (m) => m.ResourceFormComponent,
      ),
  },
  {
    path: 'shelter',
    loadComponent: () =>
      import('./pages/shelter-form').then(
        (m) => m.ShelterFormComponent,
      ),
  },
  {
    path: 'shelters',
    loadComponent: () =>
      import('./pages/shelter-form').then(
        (m) => m.ShelterFormComponent,
      ),
  },
  {
    path: 'shelters/add',
    loadComponent: () =>
      import('./pages/shelter-form').then(
        (m) => m.ShelterFormComponent,
      ),
  },
  {
    path: 'backoffice/resources',
    loadComponent: () =>
      import('./pages/backoffice-resources/backoffice-resources.component').then(
        (m) => m.BackofficeResourcesComponent,
      ),
  },
  {
    path: 'backoffice/shelters',
    loadComponent: () =>
      import('./pages/backoffice-shelters/backoffice-shelters.component').then(
        (m) => m.BackofficeSheltersComponent,
      ),
  },
  {
    path: 'nearby-shelters',
    loadComponent: () =>
      import('./pages/nearby-shelters/nearby-shelters.component').then(
        (m) => m.NearbySheltersComponent,
      ),
  },
  {
    path: 'shelter-details/:id',
    loadComponent: () =>
      import('./pages/shelter-details/shelter-details.component').then(
        (m) => m.ShelterDetailsComponent,
      ),
  },
  {
    path: 'evacuation-routes',
    loadComponent: () =>
      import('./pages/evacuation-routes/evacuation-routes.component').then(
        (m) => m.EvacuationRoutesComponent,
      ),
  },
  {
    path: 'reviews',
    loadComponent: () =>
      import('./pages/reviews/reviews.component').then(
        (m) => m.ReviewsComponent,
      ),
  },
  {
    path: 'add-review',
    loadComponent: () =>
      import('./pages/add-review/add-review.component').then(
        (m) => m.AddReviewComponent,
      ),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports/reports.component').then(
        (m) => m.ReportsComponent,
      ),
  },
  {
    path: 'admin/reports',
    loadComponent: () =>
      import('./pages/admin-reports/admin-reports.component').then(
        (m) => m.AdminReportsComponent,
      ),
  },

  { path: '**', redirectTo: '' },
];
