import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const ADMIN_ROLES = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN'];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private redirectByRole(role: string): void {
    const normalizedRole = (role || '').trim().toUpperCase();

    if (ADMIN_ROLES.includes(normalizedRole)) {
      // Admins go to the back-office dashboard
      this.router.navigateByUrl('/dashboard');
    } else {
      // Volunteers, Citizens, Responders go to the front-office landing page
      this.router.navigateByUrl('/landing');
    }
  }

  onLogin(): void {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    this.isLoading = true;

    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.redirectByRole(response.role);
      },
      error: (error) => {
        this.isLoading = false;

        if (error?.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error?.status === 401) {
          this.errorMessage = 'Invalid email or password.';
        } else if (error?.status === 0) {
          this.errorMessage = 'Cannot connect to the server.';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }

  loginWithGoogle(): void {
    window.location.href = 'http://localhost:8089/oauth2/authorization/google';
  }

  loginWithFacebook(): void {
    window.location.href = 'http://localhost:8089/oauth2/authorization/facebook';
  }
}
