import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  Application,
  Opportunity,
  OpportunityService,
} from '../../../core/services/opportunity.service';
import { Skill, SkillsService } from '../../../core/services/skills.service';

@Component({
  selector: 'app-opportunity-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './opportunity-detail.component.html',
})
export class OpportunityDetailComponent implements OnInit {
  private fb = inject(FormBuilder);

  opportunity: Opportunity | null = null;
  applications: Application[] = [];
  skillsMap: Record<number, string> = {};
  isLoading = true;
  errorMessage = '';
  showApplyForm = false;

  applyForm = this.fb.group({
    volunteerId: ['', [Validators.required, Validators.min(1)]],
    motivationLetter: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor(
    private route: ActivatedRoute,
    private opportunityService: OpportunityService,
    private skillsService: SkillsService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage = 'Invalid opportunity id.';
      this.isLoading = false;
      return;
    }
    this.loadSkillsAndData(id);
  }

  loadSkillsAndData(id: number): void {
    this.skillsService.getAll().subscribe({
      next: (skills) => {
        this.skillsMap = skills.reduce<Record<number, string>>((acc, item: Skill) => {
          if (item.id) {
            acc[item.id] = item.name;
          }
          return acc;
        }, {});
        this.loadOpportunity(id);
      },
      error: () => {
        this.errorMessage = 'Failed to load required skills.';
        this.isLoading = false;
      },
    });
  }

  loadOpportunity(id: number): void {
    this.opportunityService.getById(id).subscribe({
      next: (opp) => {
        this.opportunity = opp;
        this.loadApplications(id);
      },
      error: () => {
        this.errorMessage = 'Could not load opportunity.';
        this.isLoading = false;
      },
    });
  }

  loadApplications(id: number): void {
    this.opportunityService.getByOpportunity(id).subscribe({
      next: (apps) => {
        this.applications = apps;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load applications.';
        this.isLoading = false;
      },
    });
  }

  skillName(skillId: number): string {
    return this.skillsMap[skillId] ?? `Skill #${skillId}`;
  }

  slotsRatio(): number {
    if (!this.opportunity || !this.opportunity.slots) {
      return 0;
    }
    const ratio = ((this.opportunity.filledSlots || 0) / this.opportunity.slots) * 100;
    return Math.max(0, Math.min(100, ratio));
  }

  accept(appId?: number): void {
    if (!appId || !this.opportunity?.id) {
      return;
    }
    this.opportunityService.accept(appId).subscribe({
      next: () => this.loadApplications(this.opportunity!.id!),
      error: () => (this.errorMessage = 'Accept failed.'),
    });
  }

  reject(appId?: number): void {
    if (!appId || !this.opportunity?.id) {
      return;
    }
    this.opportunityService.reject(appId).subscribe({
      next: () => this.loadApplications(this.opportunity!.id!),
      error: () => (this.errorMessage = 'Reject failed.'),
    });
  }

  inv(field: string): boolean {
    const c = this.applyForm.get(field);
    return !!(c?.invalid && (c.dirty || c.touched));
  }

  toggleApplyForm(): void {
    this.showApplyForm = !this.showApplyForm;
  }

  submitApplication(): void {
    if (!this.opportunity?.id) {
      return;
    }
    if (this.applyForm.invalid) {
      this.applyForm.markAllAsTouched();
      return;
    }
    const payload: Application = {
      opportunityId: this.opportunity.id,
      volunteerId: Number(this.applyForm.value.volunteerId),
      motivationLetter: this.applyForm.value.motivationLetter ?? '',
    };
    this.opportunityService.apply(payload).subscribe({
      next: () => {
        this.showApplyForm = false;
        this.applyForm.reset({ volunteerId: '', motivationLetter: '' });
        this.loadApplications(this.opportunity!.id!);
      },
      error: () => (this.errorMessage = 'Apply failed.'),
    });
  }
}
