import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import QRCode from 'qrcode';
import {
  Skill,
  SkillsService,
  VolunteerSkill,
  VolunteerSkillsService,
} from '../../core/services/skills.service';

@Component({
  selector: 'app-credential',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credential.component.html',
})
export class CredentialComponent implements OnInit, AfterViewInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  id!: number;
  volunteerSkill: VolunteerSkill | null = null;
  skillName = '';
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private skillsService: SkillsService,
    private volunteerSkillsService: VolunteerSkillsService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) {
        this.errorMessage = 'Invalid credential id.';
        this.isLoading = false;
        return;
      }

      this.id = id;
      this.loadData();
    });
  }

  ngAfterViewInit(): void {
    this.renderQr();
  }

  retry(): void {
    this.loadData();
  }

  badgeClass(proficiency?: string): string {
    switch (proficiency) {
      case 'BEGINNER':
        return 'bg-outline/20 text-on-surface-variant';
      case 'INTERMEDIATE':
        return 'bg-secondary/20 text-secondary';
      case 'ADVANCED':
        return 'bg-primary/20 text-primary';
      default:
        return '';
    }
  }

  isExpert(proficiency?: string): boolean {
    return proficiency === 'EXPERT';
  }

  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      skills: this.skillsService.getAll(),
      volunteerSkill: this.volunteerSkillsService.getById(this.id),
    }).subscribe({
      next: ({ skills, volunteerSkill }) => {
        this.volunteerSkill = {
          ...volunteerSkill,
          isVerified: this.normalizeVerified(volunteerSkill.isVerified),
        };
        this.skillName = this.resolveSkillName(skills, volunteerSkill.skillId);
        this.isLoading = false;
        setTimeout(() => {
          this.renderQr();
        }, 0);
      },
      error: () => {
        this.errorMessage = 'Failed to load credential.';
        this.isLoading = false;
      },
    });
  }

  private renderQr(): void {
    if (!this.qrCanvas) {
      return;
    }

    QRCode.toCanvas(this.qrCanvas.nativeElement, window.location.href, {
      width: 160,
      color: { dark: '#aca3ff', light: '#081838' },
    }).catch(() => {
      this.errorMessage = 'Failed to generate QR code.';
    });
  }

  private resolveSkillName(skills: Skill[], skillId: number): string {
    return skills.find((skill) => skill.id === skillId)?.name ?? `Skill #${skillId}`;
  }

  private normalizeVerified(value: unknown): boolean {
    return value === true || value === 1;
  }
}
