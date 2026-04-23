import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './frontoffice-profile.component.html',
  styleUrl: './frontoffice-profile.component.scss'
})
export class FrontofficeProfileComponent implements OnInit, OnDestroy {
  user: any = {};
  editableUser: any = {};
  loading = true;
  saving = false;
  editMode = false;
  isAuthenticated = true;

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  private subs: Subscription[] = [];

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.revokePreview();
    this.subs.forEach(s => s.unsubscribe());
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
      },
      error: () => { this.loading = false; }
    });
    this.subs.push(s);
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.setPreview(file);
    } else {
      this.selectedFile = null;
      this.revokePreview();
      this.previewUrl = null;
    }
  }

  private setPreview(file: File): void {
    this.revokePreview();
    this.previewUrl = URL.createObjectURL(file);
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
    return role?.replaceAll('_', ' ') || 'USER';
  }

  logout(): void {
    localStorage.clear();
    this.isAuthenticated = false;
    this.router.navigateByUrl('/landing');
  }
}