import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const ADMIN_ROLES = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN', 'ADMIN'];

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  if (!token) {
    router.navigateByUrl('/login');
    return false;
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
    router.navigateByUrl('/home');
    return false;
  }

  return true;
};
