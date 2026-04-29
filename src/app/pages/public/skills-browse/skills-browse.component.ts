import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Skill, SkillsService } from '../../../core/services/skills.service';

@Component({
  selector: 'app-skills-browse',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './skills-browse.component.html',
})
export class SkillsBrowseComponent implements OnInit {
  skills: Skill[] = [];
  filtered: Skill[] = [];
  isLoading = true;
  errorMessage = '';
  activeFilter = 'ALL';
  categories: string[] = [];

  constructor(private skillsService: SkillsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.skillsService.getAll().subscribe({
      next: (data) => {
        this.skills = (data || [])
          .map((s) => ({
            ...s,
            isActive: (s.isActive as any) === true || (s.isActive as any) === 1,
          }))
          .filter((s) => s.isActive === true);

        this.categories = [...new Set(this.skills.map((s) => s.category || 'Uncategorized'))].sort();
        this.applyFilter(this.activeFilter);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load skills.';
        this.isLoading = false;
      },
    });
  }

  applyFilter(f: string): void {
    this.activeFilter = f;
    this.filtered =
      f === 'ALL'
        ? [...this.skills]
        : this.skills.filter((s) => (s.category || 'Uncategorized') === f);
  }
}
