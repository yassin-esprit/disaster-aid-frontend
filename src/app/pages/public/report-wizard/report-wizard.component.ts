import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IncidentService } from '../../../core/services/incident.service';

interface DisasterType {
  value: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
}

@Component({
  selector: 'app-report-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './report-wizard.component.html'
})
export class ReportWizardComponent implements OnInit {

  currentStep = 1;
  totalSteps = 3;
  isLoading = false;
  submitted = false;
  submittedId: number | null = null;
  errorMessage = '';
  isDragOver = false;

  selectedType: DisasterType | null = null;
  selectedSeverity = '';
  uploadedFiles: Array<{ file: File; preview: string; uploading: boolean; done: boolean }> = [];

  form!: FormGroup;

  disasterTypes: DisasterType[] = [
    { value: 'FLOOD',      label: 'Flood',      icon: 'water',                  color: 'text-blue-400',   bg: 'border-blue-400/40 bg-blue-400/10',   description: 'Rising water, flooded roads or homes'           },
    { value: 'WILDFIRE',   label: 'Wildfire',   icon: 'local_fire_department',  color: 'text-orange-400', bg: 'border-orange-400/40 bg-orange-400/10', description: 'Fire spreading through vegetation or buildings' },
    { value: 'EARTHQUAKE', label: 'Earthquake', icon: 'crisis_alert',           color: 'text-amber-400',  bg: 'border-amber-400/40 bg-amber-400/10', description: 'Ground shaking, structural damage'              },
    { value: 'HURRICANE',  label: 'Storm',      icon: 'storm',                  color: 'text-purple-400', bg: 'border-purple-400/40 bg-purple-400/10', description: 'Severe wind, cyclone or hurricane'             },
    { value: 'TSUNAMI',    label: 'Tsunami',    icon: 'waves',                  color: 'text-cyan-400',   bg: 'border-cyan-400/40 bg-cyan-400/10',   description: 'Large ocean wave, coastal threat'               },
    { value: 'OTHER',      label: 'Other',      icon: 'warning',                color: 'text-on-surface-variant', bg: 'border-white/20 bg-white/5', description: 'Any other emergency situation'                   },
  ];

  severities = [
    { value: 'LOW',      label: 'Minor',    desc: 'Situation is manageable',          dot: 'bg-secondary',  ring: 'ring-secondary'  },
    { value: 'MEDIUM',   label: 'Moderate', desc: 'Needs attention soon',             dot: 'bg-amber-400',  ring: 'ring-amber-400'  },
    { value: 'HIGH',     label: 'Serious',  desc: 'Immediate response needed',        dot: 'bg-orange-400', ring: 'ring-orange-400' },
    { value: 'CRITICAL', label: 'Critical', desc: 'Life threatening — act NOW',       dot: 'bg-error',      ring: 'ring-error'      },
  ];

  constructor(
    private fb: FormBuilder,
    private svc: IncidentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      disasterType: ['', Validators.required],
      severity:     ['', Validators.required],
      location:     ['', Validators.required],
      description:  ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  selectType(t: DisasterType): void {
    this.selectedType = t;
    this.form.patchValue({ disasterType: t.value });
  }

  selectSeverity(s: string): void {
    this.selectedSeverity = s;
    this.form.patchValue({ severity: s });
  }

  useGPS(): void {
    navigator.geolocation?.getCurrentPosition(p => {
      this.form.patchValue({
        location: `${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`
      });
    });
  }

  canProceed(): boolean {
    if (this.currentStep === 1) return !!(this.selectedType && this.selectedSeverity);
    if (this.currentStep === 2) {
      const c = this.form.get;
      return this.form.get('location')?.valid === true &&
        this.form.get('description')?.valid === true;
    }
    return true;
  }

  next(): void {
    if (this.canProceed() && this.currentStep < this.totalSteps) this.currentStep++;
  }

  back(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragOver = true; }
  onDragLeave(): void { this.isDragOver = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault(); this.isDragOver = false;
    Array.from(e.dataTransfer?.files || []).forEach(f => this.addFile(f));
  }
  onFileSelect(e: Event): void {
    Array.from((e.target as HTMLInputElement).files || []).forEach(f => this.addFile(f));
  }

  addFile(file: File): void {
    const reader = new FileReader();
    reader.onload = ev => this.uploadedFiles.push({
      file, preview: ev.target?.result as string, uploading: false, done: false
    });
    reader.readAsDataURL(file);
  }

  removeFile(i: number): void { this.uploadedFiles.splice(i, 1); }

  submit(): void {
    if (this.form.invalid) return;
    this.isLoading = true;

    this.svc.create(this.form.value).subscribe({
      next: report => {
        const pending = this.uploadedFiles.filter(f => !f.done);
        if (!pending.length) {
          this.isLoading = false;
          this.submitted = true;
          this.submittedId = report.id!;
          return;
        }
        let done = 0;
        pending.forEach(item => {
          item.uploading = true;
          this.svc.uploadEvidence(report.id!, item.file).subscribe({
            next: () => { item.uploading = false; item.done = true; done++; if (done === pending.length) { this.isLoading = false; this.submitted = true; this.submittedId = report.id!; } },
            error: () => { item.uploading = false; done++; if (done === pending.length) { this.isLoading = false; this.submitted = true; this.submittedId = report.id!; } }
          });
        });
      },
      error: err => { this.isLoading = false; this.errorMessage = err?.error?.message || 'Submission failed.'; }
    });
  }

  get progressPct(): number { return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100; }

  get liveCredibility(): number {
    const v = this.form.value;
    let s = 0;
    if (v.description?.length > 100) s += 15;
    else if (v.description?.length > 50) s += 10;
    if (v.location?.trim()) s += 15;
    if (v.severity === 'HIGH' || v.severity === 'CRITICAL') s += 10;
    if (v.disasterType) s += 10;
    if (this.uploadedFiles.length > 0) s += 30;
    return Math.min(s, 100);
  }



  getSeverityLabel(): string {
    return this.severities.find(s => s.value === this.selectedSeverity)?.label || '';
  }

  appendTip(tip: string): void {
    const current = this.form.get('description')?.value || '';
    this.form.patchValue({ description: current + ' ' + tip });
  }

  getColorBg(colorClass: string): string {
    return colorClass.replace('text-', 'bg-');
  }
}
