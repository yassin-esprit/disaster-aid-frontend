import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Skill, SkillsService } from '../../../core/services/skills.service';

@Component({
  selector: 'app-skill-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './skill-form.component.html',
})
export class SkillFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  isEdit = false;
  skillId: number | null = null;
  isLoading = false;
  errorMessage = '';

  readonly categories = [
    'TECHNICAL',
    'MEDICAL',
    'LOGISTICS',
    'EDUCATION',
    'SOCIAL',
    'CREATIVE',
    'LANGUAGE',
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', Validators.required],
    category: ['TECHNICAL', Validators.required],
    parentSkillId: [''],
    description: [''],
    isVerifiable: [false],
    isActive: [true],
  });

  constructor(
    private skillsService: SkillsService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.skillId = Number(id);
      this.load(this.skillId);
    }
  }

  load(id: number): void {
    this.isLoading = true;
    this.skillsService.getById(id).subscribe({
      next: (skill) => {
        this.form.patchValue({
          name: skill.name,
          slug: skill.slug ?? '',
          category: skill.category,
          parentSkillId: skill.parentSkillId ? String(skill.parentSkillId) : '',
          description: skill.description ?? '',
          isVerifiable: !!skill.isVerifiable,
          isActive: skill.isActive ?? true,
        });
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load skill.';
        this.isLoading = false;
      },
    });
  }

  generateSlug(): void {
    const nameValue = this.form.get('name')?.value ?? '';
    const slug = nameValue
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    this.form.patchValue({ slug });
  }

  toggleBoolean(field: 'isVerifiable' | 'isActive'): void {
    const current = this.form.get(field)?.value;
    this.form.patchValue({ [field]: !current });
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

    const rawParent = this.form.value.parentSkillId ?? '';
    const payload: Skill = {
      name: this.form.value.name ?? '',
      slug: this.form.value.slug ?? '',
      category: this.form.value.category ?? 'TECHNICAL',
      parentSkillId: rawParent ? Number(rawParent) : undefined,
      description: this.form.value.description ?? '',
      isVerifiable: !!this.form.value.isVerifiable,
      isActive: !!this.form.value.isActive,
    };

    this.isLoading = true;
    const request$ =
      this.isEdit && this.skillId
        ? this.skillsService.update(this.skillId, payload)
        : this.skillsService.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/admin/skills']),
      error: () => {
        this.errorMessage = this.isEdit ? 'Update failed.' : 'Create failed.';
        this.isLoading = false;
      },
    });
  }
}
