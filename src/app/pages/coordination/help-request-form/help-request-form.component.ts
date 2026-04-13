import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CoordinationService } from '../../../core/services/coordination.service';

@Component({
  selector: 'app-help-request-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './help-request-form.component.html',
})
export class HelpRequestFormComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  requestTypes = [
    'RESCUE',
    'MEDICAL',
    'EVACUATION',
    'SUPPLY',
    'SHELTER',
    'TECHNICAL',
  ];

  constructor(
    private fb: FormBuilder,
    private svc: CoordinationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      type: ['', Validators.required],
      urgency: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      location: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  useGPS(): void {
    navigator.geolocation?.getCurrentPosition((p) =>
      this.form.patchValue({
        location: `${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`,
      }),
    );
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.svc.createRequest(this.form.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Help request submitted.';
        setTimeout(() => this.router.navigate(['/coordination']), 1200);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Submission failed.';
      },
    });
  }

  inv(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && (c.dirty || c.touched));
  }
}
