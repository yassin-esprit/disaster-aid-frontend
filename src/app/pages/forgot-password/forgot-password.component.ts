import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type Step = 'email' | 'code' | 'reset' | 'done';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  step: Step = 'email';

  // Step 1
  email = '';

  // Step 2
  code = '';

  // Step 3
  newPassword = '';
  confirmPassword = '';
  showNew = false;
  showConfirm = false;

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  private api = environment.apiUrl + '/auth';

  constructor(private http: HttpClient, private router: Router) {}

  // ── Step 1 : send code ────────────────────────────────────────────────────
  sendCode(): void {
    this.errorMessage = '';
    if (!this.email.trim()) { this.errorMessage = 'Please enter your email.'; return; }

    this.isLoading = true;
    this.http.post(`${this.api}/forgot-password`, { email: this.email }, { responseType: 'text' })
      .subscribe({
        next: () => { this.isLoading = false; this.step = 'code'; },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error || 'No account found with this email.';
        }
      });
  }

  // ── Step 2 : verify code ──────────────────────────────────────────────────
  verifyCode(): void {
    this.errorMessage = '';
    if (!this.code.trim()) { this.errorMessage = 'Please enter the code.'; return; }

    this.isLoading = true;
    this.http.post(`${this.api}/verify-reset-code`, { email: this.email, code: this.code }, { responseType: 'text' })
      .subscribe({
        next: () => { this.isLoading = false; this.step = 'reset'; },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error || 'Invalid or expired code.';
        }
      });
  }

  // ── Step 3 : reset password ───────────────────────────────────────────────
  resetPassword(): void {
    this.errorMessage = '';
    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.'; return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.'; return;
    }

    this.isLoading = true;
    this.http.post(`${this.api}/reset-password`,
      { email: this.email, code: this.code, newPassword: this.newPassword },
      { responseType: 'text' }
    ).subscribe({
      next: () => { this.isLoading = false; this.step = 'done'; },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error || 'Error resetting password.';
      }
    });
  }

  resendCode(): void {
    this.code = '';
    this.errorMessage = '';
    this.sendCode();
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}