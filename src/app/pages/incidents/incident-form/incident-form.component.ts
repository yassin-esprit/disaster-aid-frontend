import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
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
  isEditMode = false;
  editId: number | null = null;
  uploadedFiles: Array<{ file: File; preview: string; uploading: boolean; done: boolean; evidenceId?: number }> = [];
  isDragOver = false;
  savedReportId: number | null = null;


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
  private route: ActivatedRoute,

) {}

 //ena njareb
  loadExisting(id: number): void {
    this.isLoading = true;
    this.incidentService.getById(id).subscribe({
      next: report => {
        this.form.patchValue({
          disasterType: report.disasterType,
          severity:     report.severity,
          location:     report.location,
          description:  report.description,
        });
        this.selectedSeverity = report.severity || 'LOW';
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load report for editing.';
        this.isLoading = false;
      }
    });
  }


  ngOnInit(): void {
    this.form = this.fb.group({
      disasterType: ['', Validators.required],
      severity: ['LOW', Validators.required],
      location: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]],
    });

    this.form.valueChanges.subscribe((v) => (this.previewData = v));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editId = parseInt(id, 10);
      this.loadExisting(this.editId);
    }
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

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragOver = true; }
  onDragLeave(): void { this.isDragOver = false; }
  onDrop(event: DragEvent): void {
    event.preventDefault(); this.isDragOver = false;
    Array.from(event.dataTransfer?.files || []).forEach(f => this.addFile(f));
  }
  onFileSelect(event: Event): void {
    Array.from((event.target as HTMLInputElement).files || []).forEach(f => this.addFile(f));
  }
  addFile(file: File): void {
    const reader = new FileReader();
    reader.onload = e => this.uploadedFiles.push({
      file, preview: e.target?.result as string, uploading: false, done: false
    });
    reader.readAsDataURL(file);
  }
  removeFile(i: number): void { this.uploadedFiles.splice(i, 1); }













  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMessage = '';

    const action = this.isEditMode && this.editId
      ? this.incidentService.update(this.editId, this.form.value)
      : this.incidentService.create(this.form.value);

    action.subscribe({
      next: report => {
        this.savedReportId = report.id!;
        const pending = this.uploadedFiles.filter(f => !f.done);
        if (!pending.length || this.isEditMode) {
          this.isLoading = false;
          this.successMessage = this.isEditMode ? 'Report updated.' : 'Report submitted.';
          setTimeout(() => this.router.navigate(['/incidents']), 1500);
          return;
        }
        let done = 0;
        pending.forEach(item => {
          item.uploading = true;
          this.incidentService.uploadEvidence(report.id!, item.file).subscribe({
            next: () => { item.uploading = false; item.done = true; done++; if (done === pending.length) { this.isLoading = false; this.successMessage = 'Report submitted with evidence.'; setTimeout(() => this.router.navigate(['/incidents']), 1500); } },
            error: () => { item.uploading = false; done++; if (done === pending.length) { this.isLoading = false; setTimeout(() => this.router.navigate(['/incidents']), 1500); } }
          });
        });
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Submission failed.';
      }
    });
  }
}
