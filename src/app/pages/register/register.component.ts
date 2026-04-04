import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

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

  constructor(private fb: FormBuilder) {}

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
      { validators: this.passwordMatchValidator },
    );
  }

  // ── Validators ──────────────────────────────────
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw === cpw ? null : { passwordMismatch: true };
  }

  // ── Password strength ────────────────────────────
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

  // ── Field helpers ────────────────────────────────
  isInvalid(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  getError(form: FormGroup, field: string): string {
    const c = form.get(field);
    if (!c || !c.errors) return '';
    if (c.errors['required']) return 'This field is required.';
    if (c.errors['email']) return 'Enter a valid email address.';
    if (c.errors['minlength'])
      return `Minimum ${c.errors['minlength'].requiredLength} characters.`;
    return '';
  }

  get passwordMismatch(): boolean {
    return !!(
      this.registerForm.errors?.['passwordMismatch'] &&
      this.registerForm.get('confirmPassword')?.touched
    );
  }

  // ── Role selection ───────────────────────────────
  selectRole(role: UserRole): void {
    this.selectedRole = role;
    this.registerForm.patchValue({ role });
  }

  getRoleActive(roleId: UserRole): boolean {
    return this.selectedRole === roleId;
  }

  // ── Tab switching ────────────────────────────────
  switchTab(tab: ActiveTab): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ── Submit handlers ──────────────────────────────
  onSignIn(): void {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    console.log('Sign in:', this.signInForm.value);
    // Wire to AuthService later
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    console.log('Register:', this.registerForm.value);
    // Wire to AuthService later
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage =
        'Account created! Please check your email to verify.';
    }, 1500);
  }

  onGuestContinue(): void {
    console.log('Guest continue');
  }
}
