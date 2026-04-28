import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Skill, SkillsService } from '../../../core/services/skills.service';

@Component({
  selector: 'app-skill-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './skill-list.component.html',
})
export class SkillListComponent implements OnInit {
  skills: Skill[] = [];
  filtered: Skill[] = [];
  isLoading = true;
  errorMessage = '';
  activeFilter = 'ALL';
  deleteConfirmId: number | null = null;

  readonly filters = [
    'ALL',
    'TECHNICAL',
    'MEDICAL',
    'LOGISTICS',
    'EDUCATION',
    'SOCIAL',
    'CREATIVE',
    'LANGUAGE',
  ];

  constructor(
    private skillsService: SkillsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.skillsService.getAll().subscribe({
      next: (data) => {
        this.skills = data.map(s => ({
          ...s,
          isActive: (s.isActive as any) === true || (s.isActive as any) === 1 || (s as any).active === true
        }));
        this.applyFilter(this.activeFilter);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load skills.';
        this.isLoading = false;
      },
    });
  }

  applyFilter(filter: string): void {
    this.activeFilter = filter;
    this.filtered =
      filter === 'ALL' ? this.skills : this.skills.filter((s) => s.category === filter);
  }

  openCreate(): void {
    this.router.navigate(['/admin/skills/new']);
  }

  openEdit(id?: number): void {
    if (!id) return;
    this.router.navigate([`/skills/${id}/edit`]);
  }

  toggleActive(id?: number): void {
    if (!id) return;
    this.skillsService.toggleActive(id).subscribe({
      next: (updated) => {
        const normalized = {
          ...updated,
          isActive: (updated.isActive as any) === true || (updated.isActive as any) === 1 || (updated as any).active === true
        };
        const i = this.skills.findIndex(s => s.id === id);
        if (i !== -1) this.skills[i] = normalized;
        this.applyFilter(this.activeFilter);
      },
      error: () => {
        this.errorMessage = 'Toggle failed.';
      },
    });
  }

  confirmDelete(id?: number): void {
    this.deleteConfirmId = id ?? null;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  doDelete(): void {
    if (!this.deleteConfirmId) return;
    this.skillsService.delete(this.deleteConfirmId).subscribe({
      next: () => {
        this.deleteConfirmId = null;
        this.load();
      },
      error: () => {
        this.errorMessage = 'Delete failed.';
        this.deleteConfirmId = null;
      },
    });
  }
}