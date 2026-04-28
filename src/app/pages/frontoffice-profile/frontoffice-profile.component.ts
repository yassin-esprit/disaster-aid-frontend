import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuroraOrb {
  xRatio: number;
  yRatio: number;
  radius: number;
  color: string;
  speed: number;
  alpha: number;
}

interface RingParticle {
  baseAngle: number;
  orbitRadius: number;
  speed: number;
  size: number;
  alpha: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './frontoffice-profile.component.html',
  styleUrls: ['./frontoffice-profile.component.scss']
})
export class FrontofficeProfileComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('auroraCanvas') auroraCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ringCanvas') ringCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;

  user: any = {};
  editableUser: any = {};
  loading = true;
  saving = false;
  editMode = false;
  isAuthenticated = true;

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  private subs: Subscription[] = [];
  private auroraAnimId = 0;
  private ringAnimId = 0;
  private auroraT = 0;
  private ringT = 0;
  private auroraOrbs: AuroraOrb[] = [
    { xRatio: 0.70, yRatio: 0.5, radius: 130, color: '127,140,255', speed: 0.55, alpha: 0.55 },
    { xRatio: 0.86, yRatio: 0.2, radius: 95, color: '154,115,255', speed: 0.40, alpha: 0.42 },
    { xRatio: 0.55, yRatio: 0.85, radius: 85, color: '255,140,200', speed: 0.50, alpha: 0.30 },
    { xRatio: 0.92, yRatio: 0.75, radius: 70, color: '80,160,255', speed: 0.35, alpha: 0.22 }
  ];
  private ringParticles: RingParticle[] = [];
  private animationsStarted = false;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.loadProfile();
    this.buildRingParticles();
  }

  ngAfterViewInit(): void {
    this.startAnimationsIfReady();
  }

  ngOnDestroy(): void {
    this.revokePreview();
    this.subs.forEach(s => s.unsubscribe());
    cancelAnimationFrame(this.auroraAnimId);
    cancelAnimationFrame(this.ringAnimId);
  }

  loadProfile(): void {
    const s = this.userService.getMyProfile().subscribe({
      next: (res) => {
        this.user = { ...res };
        this.editableUser = { ...res };
        // Construire l'URL absolue dès le chargement du profil
        if (res?.profilePhoto) {
          this.user.profilePhoto = this.buildPhotoUrl(res.profilePhoto);
        }
        this.loading = false;
        this.startAnimationsAfterRender();
      },
      error: () => { this.loading = false; }
    });
    this.subs.push(s);
  }

  private startAnimationsAfterRender(): void {
    setTimeout(() => this.startAnimationsIfReady());
  }

  private startAnimationsIfReady(): void {
    if (this.animationsStarted || this.loading) return;
    if (!this.auroraCanvasRef?.nativeElement || !this.ringCanvasRef?.nativeElement) return;
    this.startAurora();
    this.startRing();
    this.animationsStarted = true;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.selectedFile = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  private revokePreview(): void {
    if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  enableEdit(): void {
    this.editMode = true;
    this.editableUser = { ...this.user };
  }

  cancelEdit(): void {
    this.editMode = false;
    this.editableUser = { ...this.user };
    this.selectedFile = null;
    this.revokePreview();
    this.previewUrl = null;
  }

  /**
   * Le serveur retourne un chemin relatif comme "/uploads/167xxx_photo.png".
   * Angular tourne sur :4200 et le backend sur :8080 → il faut préfixer
   * avec l'URL du backend pour que le navigateur trouve le fichier.
   *
   * Pas besoin de cache-buster : le nom du fichier contient déjà le timestamp
   * (System.currentTimeMillis() côté Spring), donc chaque upload = nouvelle URL.
   */
  private buildPhotoUrl(path: string): string {
    if (!path) return '';
    // Déjà une URL absolue → retourner tel quel
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const backendBase = environment.apiUrl;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return backendBase + cleanPath;
  }

  updateProfile(): void {
    this.saving = true;

    const payload = {
      firstName: this.editableUser.firstName,
      lastName: this.editableUser.lastName,
      phone: this.editableUser.phone,
      location: this.editableUser.location
    };

    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    if (this.selectedFile) {
      formData.append('profilePhoto', this.selectedFile, this.selectedFile.name);
    }

    const s = this.userService.updateMyProfile(formData).subscribe({
      next: (res) => {
        // 1. Révoquer le blob AVANT de changer previewUrl
        this.revokePreview();
        this.previewUrl = null;
        this.selectedFile = null;

        // 2. Mettre à jour l'utilisateur
        this.user = { ...res };
        this.editableUser = { ...res };

        // 3. Construire l'URL absolue (sans cache-buster : timestamp déjà dans le nom)
        if (res?.profilePhoto) {
          this.user.profilePhoto = this.buildPhotoUrl(res.profilePhoto);
        }

        this.editMode = false;
        this.saving = false;

        alert('Profile updated successfully');
      },
      error: (err) => {
        console.error('Update profile error:', err);
        this.saving = false;
        alert(`Error updating profile: ${err.error?.message || 'Unknown error'}`);
      }
    });
    this.subs.push(s);
  }

  getInitials(): string {
    const first = this.user?.firstName?.charAt(0) || '';
    const last = this.user?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }

  getRoleLabel(role: string): string {
    const map: Record<string, string> = {
      PLATFORM_ADMIN: 'Platform Admin',
      ADMIN: 'Admin',
      USER: 'User',
      MODERATOR: 'Moderator'
    };
    return map[role] ?? role;
  }

  triggerFileInput(): void {
    this.fileInputRef?.nativeElement.click();
  }

  logout(): void {
    localStorage.clear();
    this.isAuthenticated = false;
    this.router.navigateByUrl('/landing');
  }

  private startAurora(): void {
    const canvas = this.auroraCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth || canvas.parentElement?.offsetWidth || 800;
      canvas.height = canvas.offsetHeight || canvas.parentElement?.offsetHeight || 110;
    };
    resize();

    const draw = () => {
      resize();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.auroraOrbs.forEach((orb, i) => {
        const ox = orb.xRatio * canvas.width + Math.sin(this.auroraT * 0.4 + i * 1.3) * 20;
        const oy = orb.yRatio * canvas.height + Math.cos(this.auroraT * 0.3 + i * 0.9) * 12;

        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.radius);
        grad.addColorStop(0, `rgba(${orb.color},${orb.alpha})`);
        grad.addColorStop(1, `rgba(${orb.color},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ox, oy, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      this.auroraT += 0.010;
      this.auroraAnimId = requestAnimationFrame(draw);
    };

    draw();
  }

  private buildRingParticles(): void {
    this.ringParticles = Array.from({ length: 22 }, (_, i) => ({
      baseAngle: (i / 22) * Math.PI * 2,
      orbitRadius: 46 + Math.random() * 12,
      speed: 0.35 + Math.random() * 0.55,
      size: 1.2 + Math.random() * 2.0,
      alpha: 0.40 + Math.random() * 0.55
    }));
  }

  private startRing(): void {
    const canvas = this.ringCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 104;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      ctx.strokeStyle = 'rgba(127,140,255,0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 50, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(127,140,255,0.07)';
      ctx.beginPath();
      ctx.arc(cx, cy, 43, 0, Math.PI * 2);
      ctx.stroke();

      this.ringParticles.forEach((p) => {
        const angle = p.baseAngle + this.ringT * p.speed;
        const px = cx + Math.cos(angle) * p.orbitRadius;
        const py = cy + Math.sin(angle) * p.orbitRadius;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160,170,255,${p.alpha})`;
        ctx.fill();
      });

      this.ringT += 0.007;
      this.ringAnimId = requestAnimationFrame(draw);
    };

    draw();
  }
}