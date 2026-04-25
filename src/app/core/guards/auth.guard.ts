import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Routes only an admin role can access */
const ADMIN_ONLY_ROUTES = [
  '/sensors',
  '/alerts/new',
  '/geofence',
  '/evacuation',
  '/spatial',
  '/users-management',
];

const ADMIN_ROLES = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN'];

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  if (!token) {
    router.navigateByUrl('/login');
    return false;
  }

  // Check if the requested URL requires admin access
  const requestedUrl = state.url;
  const requiresAdmin = ADMIN_ONLY_ROUTES.some(r => requestedUrl.startsWith(r));

  if (requiresAdmin) {
    const role = (authService.getRole() || '').trim().toUpperCase();
    if (!ADMIN_ROLES.includes(role)) {
      // Redirect non-admins to landing page
      router.navigateByUrl('/landing');
      return false;
    }
  }

  return true;
};

/** Guard that allows only admin roles */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  if (!token) {
    router.navigateByUrl('/login');
    return false;
  }

  const role = (authService.getRole() || '').trim().toUpperCase();
  if (!ADMIN_ROLES.includes(role)) {
    router.navigateByUrl('/landing');
    return false;
  }

  return true;
};
