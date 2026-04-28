import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Skill,
  SkillsService,
  VolunteerSkill,
  VolunteerSkillsService,
} from '../../../core/services/skills.service';
import { UploadService } from '../../../core/services/upload.service';
import {
  PredictionPayload,
  PredictionResult,
  PredictionService,
} from '../../../core/services/prediction.service';

@Component({
  selector: 'app-volunteer-skill-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './volunteer-skill-detail.component.html',
})
export class VolunteerSkillDetailComponent implements OnInit {
  id!: number;
  volunteerSkill: VolunteerSkill | null = null;
  skillName = '';
  isLoading = true;
  isUploading = false;
  isPredicting = false;
  errorMessage = '';
  safeUrl: SafeResourceUrl | null = null;
  predictionResult: PredictionResult | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private skillsService: SkillsService,
    private volunteerSkillsService: VolunteerSkillsService,
    private uploadService: UploadService,
    private predictionService: PredictionService,
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

  loadData(): void {
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
        this.safeUrl = this.isPdf(this.volunteerSkill.verificationDocUrl)
          ? this.sanitizer.bypassSecurityTrustResourceUrl(
              this.volunteerSkill.verificationDocUrl as string,
            )
          : null;
        this.predictionResult = null;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load volunteer skill details.';
        this.isLoading = false;
      },
    });
  }

  uploadFile(file: File): void {
    if (!this.volunteerSkill || !this.volunteerSkill.id) {
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';

    this.uploadService.uploadDocument(file).subscribe({
      next: (uploadedUrl) => {
        const payload: VolunteerSkill = {
          ...this.volunteerSkill!,
          verificationDocUrl: uploadedUrl,
        };

        this.volunteerSkillsService
          .updateProficiency(this.volunteerSkill!.id!, payload)
          .subscribe({
            next: () => {
              this.isUploading = false;
              this.loadData();
            },
            error: () => {
              this.errorMessage = 'Document uploaded but skill update failed.';
              this.isUploading = false;
            },
          });
      },
      error: () => {
        this.errorMessage = 'File upload failed. Please try again.';
        this.isUploading = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.uploadFile(file);
    input.value = '';
  }

  viewPublicCredential(): void {
    this.router.navigate(['/credential', this.id]);
  }

  predictAcceptance(): void {
    if (!this.volunteerSkill) {
      return;
    }

    const volunteerProficiency = this.normalizeProficiency(
      this.volunteerSkill.proficiency,
    );
    const requiredProficiency = this.estimateRequiredProficiency(
      volunteerProficiency,
    );
    const proficiencyGap =
      this.proficiencyToLevel(requiredProficiency) -
      this.proficiencyToLevel(volunteerProficiency);

    const payload: PredictionPayload = {
      volunteer_id: this.volunteerSkill.volunteerId,
      opportunity_id: this.estimateOpportunityId(this.volunteerSkill.id),
      required_proficiency: requiredProficiency,
      volunteer_proficiency: volunteerProficiency,
      skill_match: true,
      proficiency_gap: proficiencyGap,
      endorsement_count: this.volunteerSkill.endorsementCount ?? 0,
      is_verified: this.normalizeVerified(this.volunteerSkill.isVerified),
      volunteer_skills_count: this.estimateVolunteerSkillsCount(
        this.volunteerSkill.endorsementCount ?? 0,
      ),
      days_until_opportunity: this.estimateDaysUntilOpportunity(
        this.volunteerSkill.createdAt,
      ),
    };

    this.isPredicting = true;
    this.predictionResult = null;

    this.predictionService.predict(payload).subscribe({
      next: (result) => {
        this.predictionResult = result;
        this.isPredicting = false;
      },
      error: () => {
        this.errorMessage = 'Prediction failed. Please try again.';
        this.isPredicting = false;
      },
    });
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

  isPdf(url?: string): boolean {
    return !!url && url.toLowerCase().endsWith('.pdf');
  }

  isImage(url?: string): boolean {
    if (!url) {
      return false;
    }
    const normalized = url.toLowerCase();
    return (
      normalized.endsWith('.jpg') ||
      normalized.endsWith('.jpeg') ||
      normalized.endsWith('.png')
    );
  }

  private resolveSkillName(skills: Skill[], skillId: number): string {
    return skills.find((skill) => skill.id === skillId)?.name ?? `Skill #${skillId}`;
  }

  private normalizeVerified(value: unknown): boolean {
    return value === true || value === 1;
  }

  private normalizeProficiency(
    value: string | undefined,
  ): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' {
    if (
      value === 'BEGINNER' ||
      value === 'INTERMEDIATE' ||
      value === 'ADVANCED' ||
      value === 'EXPERT'
    ) {
      return value;
    }
    return 'BEGINNER';
  }

  private proficiencyToLevel(proficiency: PredictionPayload['required_proficiency']): number {
    const mapping: Record<
      PredictionPayload['required_proficiency'],
      number
    > = {
      BEGINNER: 0,
      INTERMEDIATE: 1,
      ADVANCED: 2,
      EXPERT: 3,
    };
    return mapping[proficiency];
  }

  private estimateRequiredProficiency(
    volunteerProficiency: PredictionPayload['volunteer_proficiency'],
  ): PredictionPayload['required_proficiency'] {
    const roll = Math.random();
    if (volunteerProficiency === 'BEGINNER') {
      return roll < 0.75 ? 'BEGINNER' : 'INTERMEDIATE';
    }
    if (volunteerProficiency === 'INTERMEDIATE') {
      if (roll < 0.2) return 'BEGINNER';
      if (roll < 0.8) return 'INTERMEDIATE';
      return 'ADVANCED';
    }
    if (volunteerProficiency === 'ADVANCED') {
      if (roll < 0.15) return 'INTERMEDIATE';
      if (roll < 0.75) return 'ADVANCED';
      return 'EXPERT';
    }
    return roll < 0.25 ? 'ADVANCED' : 'EXPERT';
  }

  private estimateVolunteerSkillsCount(endorsementCount: number): number {
    const base = 3 + Math.floor(endorsementCount / 3);
    return Math.max(1, Math.min(18, base));
  }

  private estimateDaysUntilOpportunity(createdAt?: string): number {
    if (!createdAt) {
      return 14;
    }
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) {
      return 14;
    }
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(2, Math.min(45, 30 - diffDays));
  }

  private estimateOpportunityId(volunteerSkillId?: number): number {
    return volunteerSkillId ? 1000 + volunteerSkillId : 1000;
  }
  @ViewChild('certificateCard') certificateCard!: ElementRef;

  downloadCertificate(): void {
  const data = this.certificateCard.nativeElement;
  
  // Use html2canvas to take a snapshot of the card
  html2canvas(data, { 
    scale: 2, // Higher scale = better quality
    useCORS: true, // Needed if you have external images
    logging: false 
  }).then(canvas => {
    const imgWidth = 208; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const contentDataURL = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const position = 10; // Margin from top
    
    pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
    pdf.save(`${this.skillName}_Certificate.pdf`);
  });
  }
}
