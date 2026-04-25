import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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

  // Admin roles matching master UserRole enum
  private adminRoles = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN'];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private redirectByRole(role: string): void {
    const normalized = (role || '').trim().toUpperCase();
    if (this.adminRoles.includes(normalized)) {
      // Admin → sidebar dashboard
      this.router.navigateByUrl('/dashboard');
    } else {
      // CITIZEN, VOLUNTEER, RESPONDER → public front office
      this.router.navigateByUrl('/home');
    }
  }

  onLogin(): void {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    this.isLoading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.redirectByRole(response.role);
      },
      error: (error) => {
        this.isLoading = false;
        if (error?.error?.message)      this.errorMessage = error.error.message;
        else if (error?.status === 401) this.errorMessage = 'Invalid email or password.';
        else if (error?.status === 0)   this.errorMessage = 'Cannot connect to the server.';
        else                             this.errorMessage = 'Login failed. Please try again.';
      }
    });
  }

  onGuestLogin(): void {
    this.router.navigateByUrl('/landing');
  }

  loginWithGoogle(): void {
    window.location.href = 'http://localhost:8089/oauth2/authorization/google';
  }

  loginWithFacebook(): void {
    window.location.href = 'http://localhost:8089/oauth2/authorization/facebook';
  }
}
