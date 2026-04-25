import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CoordinationService } from '../../../core/services/coordination.service';

@Component({
  selector: 'app-help-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './help-portal.component.html'
})
export class HelpPortalComponent implements OnInit {

  step: 'select' | 'form' | 'submitted' = 'select';
  selectedNeed: any = null;
  isLoading = false;
  errorMessage = '';
  submittedId: number | null = null;
  form!: FormGroup;

  needs = [
    {
      type: 'RESCUE',
      label: 'I need rescue',
      icon: 'sos',
      color: 'text-error',
      bg: 'bg-error',
      cardBg: 'border-error/40 bg-error/10',
      glow: 'shadow-[0_0_30px_rgba(255,110,132,0.3)]',
      desc: 'Trapped, stranded, or in immediate danger',
      urgency: 5
    },
    {
      type: 'MEDICAL',
      label: 'Medical help',
      icon: 'medical_services',
      color: 'text-red-300',
      bg: 'bg-red-500',
      cardBg: 'border-red-400/40 bg-red-400/10',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
      desc: 'Injury, illness, or someone needs first aid',
      urgency: 5
    },
    {
      type: 'EVACUATION',
      label: 'Need evacuation',
      icon: 'directions_run',
      color: 'text-orange-400',
      bg: 'bg-orange-500',
      cardBg: 'border-orange-400/40 bg-orange-400/10',
      glow: 'shadow-[0_0_25px_rgba(249,115,22,0.25)]',
      desc: 'Need transport to leave a dangerous area',
      urgency: 4
    },
    {
      type: 'SUPPLY',
      label: 'Food & Supplies',
      icon: 'inventory_2',
      color: 'text-amber-400',
      bg: 'bg-amber-500',
      cardBg: 'border-amber-400/40 bg-amber-400/10',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      desc: 'Food, water, medicine, or essentials',
      urgency: 3
    },
    {
      type: 'SHELTER',
      label: 'Need shelter',
      icon: 'home',
      color: 'text-secondary',
      bg: 'bg-secondary',
      cardBg: 'border-secondary/40 bg-secondary/10',
      glow: 'shadow-[0_0_20px_rgba(105,156,255,0.2)]',
      desc: 'Need a safe place to stay',
      urgency: 4
    },
    {
      type: 'TECHNICAL',
      label: 'Technical help',
      icon: 'build',
      color: 'text-primary',
      bg: 'bg-primary',
      cardBg: 'border-primary/40 bg-primary/10',
      glow: 'shadow-[0_0_20px_rgba(172,163,255,0.2)]',
      desc: 'Power, communications, or infrastructure',
      urgency: 2
    },
  ];

  constructor(private fb: FormBuilder, private svc: CoordinationService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      type:        ['', Validators.required],
      urgency:     [3, Validators.required],
      location:    ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  selectNeed(need: any): void {
    this.selectedNeed = need;
    this.form.patchValue({ type: need.type, urgency: need.urgency });
    this.step = 'form';
  }

  useGPS(): void {
    navigator.geolocation?.getCurrentPosition(p =>
      this.form.patchValue({ location: `${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}` })
    );
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    this.svc.createRequest(this.form.value).subscribe({
      next: r => { this.isLoading = false; this.submittedId = r.id!; this.step = 'submitted'; },
      error: err => { this.isLoading = false; this.errorMessage = err?.error?.message || 'Submission failed.'; }
    });
  }

  inv(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && (c.dirty || c.touched));
  }
}
