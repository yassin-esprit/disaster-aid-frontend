import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  Opportunity,
  OpportunityService,
} from '../../../core/services/opportunity.service';
import { Skill, SkillsService } from '../../../core/services/skills.service';

@Component({
  selector: 'app-opportunity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './opportunity-form.component.html',
})
export class OpportunityFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  isEdit = false;
  opportunityId: number | null = null;
  skills: Skill[] = [];
  isLoading = false;
  errorMessage = '';

  readonly categories = [
    'EDUCATION',
    'HEALTH',
    'ENVIRONMENT',
    'RELIEF',
    'LOGISTICS',
    'SOCIAL',
    'TECHNICAL',
  ];

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    category: ['EDUCATION', Validators.required],
    location: [''],
    isRemote: [false],
    scheduledDate: [''],
    durationHours: [1, [Validators.required, Validators.min(1)]],
    slots: [1, [Validators.required, Validators.min(1)]],
    minAge: [''],
    requiresBackgroundCheck: [false],
    status: ['DRAFT', Validators.required],
    requiredSkillIds: [[] as number[]],
  });

  constructor(
    private opportunityService: OpportunityService,
    private skillsService: SkillsService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSkills();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.opportunityId = Number(id);
      this.loadOpportunity(this.opportunityId);
    }
  }

  loadSkills(): void {
    this.skillsService.getAll().subscribe({
      next: (data) => {
        this.skills = data.filter((s) => s.isActive !== false);
      },
      error: () => {
        this.errorMessage = 'Failed to load skills.';
      },
    });
  }

  loadOpportunity(id: number): void {
    this.isLoading = true;
    this.opportunityService.getById(id).subscribe({
      next: (opp) => {
        this.form.patchValue({
          title: opp.title,
          description: opp.description ?? '',
          category: opp.category,
          location: opp.location ?? '',
          isRemote: !!opp.isRemote,
          scheduledDate: opp.scheduledDate ?? '',
          durationHours: opp.durationHours ?? 1,
          slots: opp.slots,
          minAge: opp.minAge ? String(opp.minAge) : '',
          requiresBackgroundCheck: !!opp.requiresBackgroundCheck,
          status: opp.status ?? 'DRAFT',
          requiredSkillIds: opp.requiredSkillIds ?? [],
        });
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load opportunity.';
        this.isLoading = false;
      },
    });
  }

  inv(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && (c.dirty || c.touched));
  }

  toggleBoolean(field: 'isRemote' | 'requiresBackgroundCheck'): void {
    const current = this.form.get(field)?.value;
    this.form.patchValue({ [field]: !current });
  }

  toggleSkill(skillId: number): void {
    const current = this.form.value.requiredSkillIds ?? [];
    const next = current.includes(skillId)
      ? current.filter((id) => id !== skillId)
      : [...current, skillId];
    this.form.patchValue({ requiredSkillIds: next });
  }

  hasSkill(skillId?: number): boolean {
    if (!skillId) {
      return false;
    }
    return (this.form.value.requiredSkillIds ?? []).includes(skillId);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: Opportunity = {
      title: this.form.value.title ?? '',
      description: this.form.value.description ?? '',
      category: this.form.value.category ?? 'EDUCATION',
      location: this.form.value.isRemote ? '' : this.form.value.location ?? '',
      isRemote: !!this.form.value.isRemote,
      scheduledDate: this.form.value.scheduledDate ?? '',
      durationHours: Number(this.form.value.durationHours ?? 1),
      slots: Number(this.form.value.slots ?? 1),
      minAge: this.form.value.minAge ? Number(this.form.value.minAge) : undefined,
      requiresBackgroundCheck: !!this.form.value.requiresBackgroundCheck,
      requiredSkillIds: this.form.value.requiredSkillIds ?? [],
      status: this.form.value.status ?? 'DRAFT',
      orgId: 1,
    };

    this.isLoading = true;
    const request$ =
      this.isEdit && this.opportunityId
        ? this.opportunityService.update(this.opportunityId, payload)
        : this.opportunityService.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/opportunities']),
      error: () => {
        this.errorMessage = this.isEdit ? 'Update failed.' : 'Creation failed.';
        this.isLoading = false;
      },
    });
  }
}
