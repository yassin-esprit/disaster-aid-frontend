import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─── Interfaces ──────────────────────────────────────────────
interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  role: string;
  status?: string;
  profilePhoto?: string;
}

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
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('auroraCanvas') auroraCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ringCanvas') ringCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;
constructor(private userService: UserService) {}
  // ── State ───────────────────────────────────────────────────
  user: UserProfile = {
    firstName: 'rania',
    lastName: 'chehata',
    email: 'rania.chehata@esprit.tn',
    phone: '',
    location: '',
    role: 'PLATFORM_ADMIN',
    status: 'ACTIVE',
    profilePhoto: ''
  };

  editableUser: Partial<UserProfile> = {};
  loading = false;
  saving = false;
  editMode = false;
  previewUrl: string | null = null;
  selectedFile: File | null = null;

  private subs: Subscription[] = [];

  // ── Animation handles ────────────────────────────────────────
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

  // ─── Lifecycle ────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadProfile();
    this.buildRingParticles();
  }

  ngAfterViewInit(): void {
    this.startAurora();
    this.startRing();
  }

  ngOnDestroy(): void {
    this.revokePreview();
    this.subs.forEach(s => s.unsubscribe());
    cancelAnimationFrame(this.auroraAnimId);
    cancelAnimationFrame(this.ringAnimId);
  }

  // ── Profile actions ──────────────────────────────────────────
  loadProfile(): void {
    const s = this.userService.getMyProfile().subscribe({
      next: (res) => {
        this.user = { ...res };
        this.editableUser = { ...res };
        if (res?.profilePhoto) {
          this.user.profilePhoto = this.buildPhotoUrl(res.profilePhoto);
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.subs.push(s);
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
        this.revokePreview();
        this.previewUrl = null;
        this.selectedFile = null;

        this.user = { ...res };
        this.editableUser = { ...res };

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

  // ── Aurora canvas ───────────────────────────────────────────
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

  // ── Particle ring canvas ────────────────────────────────────
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

    const SIZE = 104;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      // Outer ghost ring
      ctx.strokeStyle = 'rgba(127,140,255,0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 50, 0, Math.PI * 2);
      ctx.stroke();

      // Inner ghost ring
      ctx.strokeStyle = 'rgba(127,140,255,0.07)';
      ctx.beginPath();
      ctx.arc(cx, cy, 43, 0, Math.PI * 2);
      ctx.stroke();

      // Particles
      this.ringParticles.forEach(p => {
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

  // ── File handling ───────────────────────────────────────────
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

  triggerFileInput(): void {
    this.fileInputRef?.nativeElement.click();
  }

  // ── Utility ──────────────────────────────────────────────────
  getInitials(): string {
    const f = this.user.firstName?.[0] ?? '';
    const l = this.user.lastName?.[0] ?? '';
    return (f + l).toUpperCase();
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
private revokePreview(): void {
  if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(this.previewUrl);
  }
}
  private buildPhotoUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return environment.apiUrl + cleanPath;
  }
}