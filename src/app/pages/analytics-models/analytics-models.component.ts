import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsNavComponent } from '../../shared/components/analytics-nav/analytics-nav.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { DisasterAnalyticsService } from '../../modules/analytics/services/disaster-analytics.service';
import {
  ModelType,
  PredictiveModel,
  PredictiveModelRequestDto,
} from '../../modules/analytics/models/disaster-analytics.model';

@Component({
  selector: 'app-analytics-models',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, AnalyticsNavComponent],
  templateUrl: './analytics-models.component.html',
})
export class AnalyticsModelsComponent implements OnInit {
  private svc = inject(DisasterAnalyticsService);
  private fb = inject(FormBuilder);

  models: PredictiveModel[] = [];
  loading = false;
  saving = false;
  activeOnly = false;
  error: string | null = null;
  successMsg: string | null = null;

  editingId: number | null = null;

  readonly modelTypes: ModelType[] = [
    'SPREAD_PREDICTOR',
    'MATCHING_OPTIMIZER',
    'CREDIBILITY_SCORER',
    'CHURN_PREDICTOR',
    'IMPACT_ESTIMATOR',
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    version: ['', [Validators.required]],
    type: ['SPREAD_PREDICTOR' as ModelType, [Validators.required]],
    artifactUrl: [''],
    metrics: [''],
    isActive: [false],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.svc.getPredictiveModels(this.activeOnly).subscribe({
      next: (list) => {
        this.models = list;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Failed to load predictive models.';
        this.loading = false;
      },
    });
  }

  toggleActiveOnly(): void {
    this.activeOnly = !this.activeOnly;
    this.load();
  }

  startEdit(m: PredictiveModel): void {
    this.editingId = m.modelId;
    this.form.reset({
      name: m.name,
      version: m.version,
      type: m.type,
      artifactUrl: m.artifactUrl ?? '',
      metrics: m.metrics ?? '',
      isActive: m.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({
      name: '',
      version: '',
      type: 'SPREAD_PREDICTOR',
      artifactUrl: '',
      metrics: '',
      isActive: false,
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.error = null;
    this.successMsg = null;

    const payload: PredictiveModelRequestDto = {
      name: this.form.value.name!,
      version: this.form.value.version!,
      type: this.form.value.type!,
      artifactUrl: this.form.value.artifactUrl || null,
      metrics: this.form.value.metrics || null,
      isActive: this.form.value.isActive ?? false,
    };

    const req$ =
      this.editingId == null
        ? this.svc.addPredictiveModel(payload)
        : this.svc.modifyPredictiveModel(this.editingId, payload);

    req$.subscribe({
      next: () => {
        this.successMsg =
          this.editingId == null ? 'Model created.' : 'Model updated.';
        this.saving = false;
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Save failed.';
        this.saving = false;
      },
    });
  }

  remove(m: PredictiveModel): void {
    if (!confirm(`Delete model "${m.name}" v${m.version}?`)) return;
    this.svc.deletePredictiveModel(m.modelId).subscribe({
      next: () => {
        this.successMsg = 'Model deleted.';
        this.load();
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Delete failed.';
      },
    });
  }
}
