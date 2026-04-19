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

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'sensors', component: SensorListComponent },
      { path: 'sensors/:id', component: SensorDetailComponent },
      { path: 'alerts', component: AlertListComponent },
      { path: 'alerts/new', component: AlertDetailComponent },
      { path: 'alerts/:id', component: AlertDetailComponent },
      { path: 'geofence', component: GeofenceMapComponent },
      { path: 'evacuation', component: EvacuationRoutesComponent },
      { path: 'evacuation/:id', component: RouteDetailComponent },
      { path: 'spatial', component: SpatialDashboardComponent },
      { path: 'incidents', loadComponent: () => import('./pages/incident-form/incident-form.component').then(m => m.IncidentFormComponent) },
      { path: 'opportunities', loadComponent: () => import('./pages/opportunities/opportunities.component').then(m => m.OpportunitiesComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
