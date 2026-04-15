import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-social-auth-success',
  standalone: true,
  template: `<p>Connexion en cours...</p>`
})
export class SocialAuthSuccessComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);

    const token = params.get('token');
    const userId = params.get('userId');
    const email = params.get('email');
    const role = params.get('role');
    const error = params.get('error');

    if (error) {
      this.router.navigateByUrl('/login');
      return;
    }

    if (token && userId && email && role) {
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('email', email);
      localStorage.setItem('role', role);

      const normalizedRole = role.trim().toUpperCase();
      const adminRoles = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN'];

      if (adminRoles.includes(normalizedRole)) {
        this.router.navigateByUrl('/dashboard');
      } else {
        this.router.navigateByUrl('/landing');
      }
    } else {
      this.router.navigateByUrl('/login');
    }
  }
}