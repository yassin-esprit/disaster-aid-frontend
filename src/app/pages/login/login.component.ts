import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

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

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    this.errorMessage = '';
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }
    this.isLoading = true;
    console.log('Login attempt:', this.email);
    // Wire to auth service in next step
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }

  onGuestLogin(): void {
    console.log('Continuing as guest');
  }
}
