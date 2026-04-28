import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Skill, SkillsService } from '../../../core/services/skills.service';

interface TimelineSkill extends Skill {
  isActive: boolean;
  parsedDate: Date | null;
  displayTime: string;
}

interface TimelineGroup {
  dateLabel: string;
  sortValue: number;
  skills: TimelineSkill[];
}

@Component({
  selector: 'app-skill-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skill-timeline.component.html',
})
export class SkillTimelineComponent implements OnInit {
  isLoading = true;
  errorMessage = '';
  activeCategory = 'ALL';

  allSkills: TimelineSkill[] = [];
  categories: string[] = [];
  timelineGroups: TimelineGroup[] = [];
  filteredGroups: TimelineGroup[] = [];

  totalSkills = 0;
  distinctCategoriesCount = 0;
  mostActiveDay = '-';

  constructor(private skillsService: SkillsService) {}

  ngOnInit(): void {
    this.loadSkills();
  }

  setCategory(category: string): void {
    this.activeCategory = category;
    this.applyFilter();
  }

  private loadSkills(): void {
    this.isLoading = true;
    this.skillsService.getAll().subscribe({
      next: (skills) => {
        this.allSkills = skills.map((s) => this.toTimelineSkill(s));
        this.categories = this.getDistinctCategories(this.allSkills);
        this.timelineGroups = this.groupByDate(this.allSkills);
        this.totalSkills = this.allSkills.length;
        this.distinctCategoriesCount = this.categories.length;
        this.mostActiveDay = this.getMostActiveDay(this.timelineGroups);
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load skills timeline.';
        this.isLoading = false;
      },
    });
  }

  private applyFilter(): void {
    if (this.activeCategory === 'ALL') {
      this.filteredGroups = this.timelineGroups.filter((group) => group.skills.length > 0);
      return;
    }

    this.filteredGroups = this.timelineGroups
      .map((group) => ({
        ...group,
        skills: group.skills.filter((skill) => skill.category === this.activeCategory),
      }))
      .filter((group) => group.skills.length > 0);
  }

  private toTimelineSkill(skill: Skill): TimelineSkill {
    const parsedDate = skill.createdAt ? new Date(skill.createdAt) : null;
    const validDate =
      parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
    return {
      ...skill,
      isActive: (skill.isActive as any) === true || (skill.isActive as any) === 1,
      parsedDate: validDate,
      displayTime: validDate
        ? validDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '--:--',
    };
  }

  private groupByDate(skills: TimelineSkill[]): TimelineGroup[] {
    const groups = new Map<string, TimelineGroup>();

    skills.forEach((skill) => {
      const dateLabel = skill.parsedDate
        ? skill.parsedDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Unknown date';
      const sortValue = skill.parsedDate ? skill.parsedDate.getTime() : 0;
      const existing = groups.get(dateLabel);

      if (existing) {
        existing.skills.push(skill);
        if (sortValue > existing.sortValue) {
          existing.sortValue = sortValue;
        }
        return;
      }

      groups.set(dateLabel, {
        dateLabel,
        sortValue,
        skills: [skill],
      });
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        skills: [...group.skills].sort(
          (a, b) => (b.parsedDate?.getTime() ?? 0) - (a.parsedDate?.getTime() ?? 0),
        ),
      }))
      .sort((a, b) => b.sortValue - a.sortValue);
  }

  private getDistinctCategories(skills: TimelineSkill[]): string[] {
    const set = new Set(
      skills
        .map((s) => (s.category || '').trim())
        .filter((category) => category.length > 0),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  private getMostActiveDay(groups: TimelineGroup[]): string {
    if (groups.length === 0) {
      return '-';
    }
    return [...groups].sort((a, b) => b.skills.length - a.skills.length)[0].dateLabel;
  }
}
