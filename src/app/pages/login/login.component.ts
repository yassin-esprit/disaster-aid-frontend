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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private redirectByRole(role: string): void {
    const normalizedRole = (role || '').trim().toUpperCase();
    const adminRoles = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN'];

    console.log('Role received:', normalizedRole);

    if (adminRoles.includes(normalizedRole)) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/landing']);
    }
  }

  onLogin(): void {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    this.isLoading = true;

    const loginData = {
      email: this.email,
      password: this.password
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.isLoading = false;
        this.redirectByRole(response.role);
      },
      error: (error) => {
        console.error('Login error:', error);
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

  onGuestLogin(): void {
    this.router.navigate(['/landing']);
  }
}