import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Skill, SkillsService, VolunteerSkill } from '../../../core/services/skills.service';

@Component({
  selector: 'app-volunteer-skill-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './volunteer-skill-form.component.html',
})
export class VolunteerSkillFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  skills: Skill[] = [];
  isLoading = false;
  errorMessage = '';

  readonly proficiencies = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

  form = this.fb.group({
    volunteerId: ['', [Validators.required, Validators.min(1)]],
    skillId: ['', Validators.required],
    proficiency: ['BEGINNER', Validators.required],
    verificationDocUrl: [''],
  });

  constructor(
    private skillsService: SkillsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSkills();
  }

  loadSkills(): void {
    this.isLoading = true;
    this.skillsService.getAll().subscribe({
      next: (data) => {
        this.skills = data.filter((s) => s.isActive !== false);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load skills.';
        this.isLoading = false;
      },
    });
  }

  inv(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && (c.dirty || c.touched));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: VolunteerSkill = {
      volunteerId: Number(this.form.value.volunteerId),
      skillId: Number(this.form.value.skillId),
      proficiency: this.form.value.proficiency ?? 'BEGINNER',
      verificationDocUrl: this.form.value.verificationDocUrl || undefined,
    };

    this.isLoading = true;
    this.skillsService.addSkillToVolunteer(payload).subscribe({
      next: () => this.router.navigate(['/admin/volunteer-skills']),
      error: () => {
        this.errorMessage = 'Assignment failed.';
        this.isLoading = false;
      },
    });
  }
}
