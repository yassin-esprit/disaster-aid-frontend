import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: any = {};
  editableUser: any = {};
  loading = true;
  saving = false;
  editMode = false;

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  private subs: Subscription[] = [];

  constructor(private userService: UserService) {}

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

  private buildPhotoUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return environment.apiUrl + cleanPath;
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

  getInitials(): string {
    const first = this.user?.firstName?.charAt(0) || '';
    const last = this.user?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }

  getRoleLabel(role: string): string {
    return role?.replaceAll('_', ' ') || 'USER';
  }
}