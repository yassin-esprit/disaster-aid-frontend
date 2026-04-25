import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

type ActiveTab = 'signin' | 'register';
type UserRole = 'VOLUNTEER' | 'ORGANISATION' | 'RESPONDER';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  activeTab: ActiveTab = 'signin';
  isLoading = false;
  showPassword = false;
  showConfirm = false;
  selectedRole: UserRole = 'VOLUNTEER';
  errorMessage = '';
  successMessage = '';

  signInForm!: FormGroup;
  registerForm!: FormGroup;

  roles = [
    {
      id: 'VOLUNTEER' as UserRole,
      label: 'Volunteer',
      desc: 'Help the community grow',
      icon: 'volunteer_activism',
      accent: 'primary',
      ringClass: 'ring-primary border-primary bg-primary/10',
      iconClass: 'text-primary bg-primary/20',
    },
    {
      id: 'ORGANISATION' as UserRole,
      label: 'Organisation',
      desc: 'Post opportunities & manage volunteers',
      icon: 'corporate_fare',
      accent: 'tertiary-dim',
      ringClass: 'ring-tertiary-dim border-tertiary-dim bg-tertiary-dim/10',
      iconClass: 'text-tertiary-dim bg-tertiary-dim/20',
    },
    {
      id: 'RESPONDER' as UserRole,
      label: 'Responder',
      desc: 'Emergency field operations',
      icon: 'emergency',
      accent: 'error',
      ringClass: 'ring-error border-error bg-error/10',
      iconClass: 'text-error bg-error/20',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        role: [this.selectedRole, Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw === cpw ? null : { passwordMismatch: true };
  }

  get passwordStrength(): { score: number; label: string; color: string } {
    const pw = this.registerForm?.get('password')?.value || '';
    let score = 0;

    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Weak', color: 'bg-error' },
      { score: 2, label: 'Fair', color: 'bg-amber-400' },
      { score: 3, label: 'Good', color: 'bg-secondary' },
      { score: 4, label: 'Strong', color: 'bg-tertiary-dim' },
    ];

    return levels[score] || levels[0];
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  getError(form: FormGroup, field: string): string {
    const c = form.get(field);
    if (!c || !c.errors) return '';

    if (c.errors['required']) return 'This field is required.';
    if (c.errors['email']) return 'Enter a valid email address.';
    if (c.errors['minlength']) {
      return `Minimum ${c.errors['minlength'].requiredLength} characters.`;
    }

    return '';
  }

  get passwordMismatch(): boolean {
    return !!(
      this.registerForm.errors?.['passwordMismatch'] &&
      this.registerForm.get('confirmPassword')?.touched
    );
  }

  selectRole(role: UserRole): void {
    this.selectedRole = role;
    this.registerForm.patchValue({ role });
  }

  getRoleActive(roleId: UserRole): boolean {
    return this.selectedRole === roleId;
  }

  switchTab(tab: ActiveTab): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

private redirectByRole(role: string): void {
  const normalizedRole = (role || '').trim().toUpperCase();
  const adminRoles = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN'];

  if (adminRoles.includes(normalizedRole)) {
    this.router.navigate(['/dashboard']);
  } else {
    this.router.navigate(['/home']);
  }
}

  onSignIn(): void {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      email: this.signInForm.value.email,
      password: this.signInForm.value.password,
    };

    this.authService.login(payload).subscribe({
      next: (res) => {
        console.log('LOGIN SUCCESS', res);
        this.isLoading = false;
        this.redirectByRole(res.role);
      },
      error: (err) => {
        console.error('LOGIN ERROR', err);
        this.isLoading = false;

        if (err?.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err?.status === 401) {
          this.errorMessage = 'Invalid email or password.';
        } else if (err?.status === 0) {
          this.errorMessage = 'Cannot connect to the server.';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      },
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.registerForm.value;

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        console.log('REGISTER SUCCESS', res);
        this.isLoading = false;
        this.successMessage = 'Account created successfully.';
        this.redirectByRole(res.role);
      },
      error: (err) => {
        console.error('REGISTER ERROR', err);
        this.isLoading = false;

        if (err?.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err?.status === 400) {
          this.errorMessage = 'Invalid registration data.';
        } else if (err?.status === 0) {
          this.errorMessage = 'Cannot connect to the server.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      },
    });
  }

  onGuestContinue(): void {
    console.log('Guest continue');
    this.router.navigate(['/landing']);
  }
}
