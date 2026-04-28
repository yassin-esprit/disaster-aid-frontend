import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  Skill,
  SkillsService,
  VolunteerSkill,
} from '../../../core/services/skills.service';

@Component({
  selector: 'app-volunteer-skill-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './volunteer-skill-list.component.html',
})
export class VolunteerSkillListComponent implements OnInit {
  assignments: VolunteerSkill[] = [];
  filtered: VolunteerSkill[] = [];
  skillsMap: Record<number, string> = {};
  isLoading = true;
  errorMessage = '';
  activeFilter = 'ALL';
  deleteConfirmId: number | null = null;

  readonly filters = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

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
      next: (skills) => {
        this.buildSkillsMap(skills);
        this.loadAssignments();
      },
      error: () => {
        this.errorMessage = 'Could not load skills map.';
        this.isLoading = false;
      },
    });
  }

  loadAssignments(): void {
    this.skillsService.getAllVolunteerSkills().subscribe({
      next: (data) => {
        this.assignments = data;
        this.applyFilter(this.activeFilter);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load volunteer skill assignments.';
        this.isLoading = false;
      },
    });
  }

  buildSkillsMap(skills: Skill[]): void {
    this.skillsMap = skills.reduce<Record<number, string>>((acc, item) => {
      if (item.id) {
        acc[item.id] = item.name;
      }
      return acc;
    }, {});
  }

  applyFilter(filter: string): void {
    this.activeFilter = filter;
    this.filtered =
      filter === 'ALL'
        ? this.assignments
        : this.assignments.filter((a) => a.proficiency === filter);
  }

  skillName(skillId: number): string {
    return this.skillsMap[skillId] ?? `Skill #${skillId}`;
  }

  endorse(id?: number): void {
    if (!id) {
      return;
    }
    this.skillsService.endorse(id).subscribe({
      next: () => this.loadAssignments(),
      error: () => (this.errorMessage = 'Endorse failed.'),
    });
  }

  verify(id?: number): void {
    if (!id) {
      return;
    }
    this.skillsService.verify(id).subscribe({
      next: () => this.loadAssignments(),
      error: () => (this.errorMessage = 'Verify failed.'),
    });
  }

  confirmDelete(id?: number): void {
    this.deleteConfirmId = id ?? null;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  doDelete(): void {
    if (!this.deleteConfirmId) {
      return;
    }
    this.skillsService.deleteVolunteerSkill(this.deleteConfirmId).subscribe({
      next: () => {
        this.deleteConfirmId = null;
        this.loadAssignments();
      },
      error: () => {
        this.errorMessage = 'Delete failed.';
        this.deleteConfirmId = null;
      },
    });
  }

  openAssign(): void {
    this.router.navigate(['/volunteer-skills/new']);
  }

  openDetail(id?: number): void {
    if (!id) {
      return;
    }
    this.router.navigate(['/volunteer-skills', id]);
  }
}
