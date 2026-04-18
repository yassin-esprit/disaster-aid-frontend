import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthenticatedLayoutComponent } from '../../../layouts/authenticated-layout/authenticated-layout.component';
import {IncidentReport, IncidentService} from '../../../core/services/incident.service';

@Component({
  selector: 'app-incident-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './incident-form.component.html',
})


export class IncidentFormComponent implements OnInit {

  duplicateReport: IncidentReport | null = null;
  showDuplicateWarning = false;
  pendingSubmit = false;


  form!: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  selectedSeverity = 'LOW';

  disasterTypes = [
    { value: 'FLOOD', label: 'Flood', icon: 'water' },
    { value: 'EARTHQUAKE', label: 'Earthquake', icon: 'crisis_alert' },
    { value: 'WILDFIRE', label: 'Wildfire', icon: 'local_fire_department' },
    { value: 'HURRICANE', label: 'Hurricane', icon: 'tornado' },
    { value: 'TSUNAMI', label: 'Tsunami', icon: 'waves' },
    { value: 'DROUGHT', label: 'Drought', icon: 'wb_sunny' },
  ];

  severities = [
    {
      value: 'LOW',
      label: 'Low',
      colorClass: 'peer-checked:border-secondary peer-checked:bg-secondary/10',
      dotClass: 'bg-secondary',
    },
    {
      value: 'MEDIUM',
      label: 'Medium',
      colorClass: 'peer-checked:border-amber-400 peer-checked:bg-amber-400/10',
      dotClass: 'bg-amber-400',
    },
    {
      value: 'HIGH',
      label: 'High',
      colorClass: 'peer-checked:border-error peer-checked:bg-error/10',
      dotClass: 'bg-error',
    },
    {
      value: 'CRITICAL',
      label: 'Critical',
      colorClass: 'peer-checked:border-error-dim peer-checked:bg-error-dim/20',
      dotClass: 'bg-error-dim animate-pulse',
    },
  ];

  previewData: any = {};

  constructor(
    private fb: FormBuilder,
    private incidentService: IncidentService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      disasterType: ['', Validators.required],
      severity: ['LOW', Validators.required],
      location: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]],
    });

    this.form.valueChanges.subscribe((v) => (this.previewData = v));
  }

  selectSeverity(value: string): void {
    this.selectedSeverity = value;
    this.form.patchValue({ severity: value });
  }

  useGPS(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        this.form.patchValue({ location: loc });
      });
    }
  }

  get completeness(): number {
    const fields = ['disasterType', 'severity', 'location', 'description'];
    const filled = fields.filter((f) => this.form.get(f)?.value).length;
    return Math.round((filled / fields.length) * 100);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    if (this.pendingSubmit) {
      this.doSubmit();
      return;
    }

    // Check for duplicates first
    this.incidentService.checkDuplicate({
      disasterType: this.form.value.disasterType
    }).subscribe({
      next: result => {
        if (result.message === 'DUPLICATE_FOUND' && result.data) {
          this.duplicateReport = result.data;
          this.showDuplicateWarning = true;
        } else {
          this.doSubmit();
        }
      },
      error: () => this.doSubmit() // if check fails, proceed anyway
    });
  }

  doSubmit(): void {
    this.showDuplicateWarning = false;
    this.pendingSubmit = false;
    this.isLoading = true;
    this.errorMessage = '';
    this.incidentService.create(this.form.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Incident report submitted successfully.';
        setTimeout(() => this.router.navigate(['/incidents']), 1500);
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Submission failed.';
      }
    });
  }

  submitAnyway(): void {
    this.pendingSubmit = true;
    this.doSubmit();
  }

  cancelDuplicate(): void {
    this.showDuplicateWarning = false;
    this.duplicateReport = null;
  }



  get liveCredibility(): number {
    const v = this.form.value;
    let score = 0;
    if (v.description?.length > 100) score += 0.15;
    else if (v.description?.length > 50) score += 0.10;
    if (v.location?.trim()) score += 0.15;
    if (v.severity === 'HIGH' || v.severity === 'CRITICAL') score += 0.10;
    if (v.disasterType) score += 0.10;
    // Evidence not uploaded yet, reporter ID not set — these will boost after save
    return Math.min(Math.round(score * 100), 100);
  }
}
