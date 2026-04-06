import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: any = {};
  editableUser: any = {};
  loading = true;
  saving = false;
  editMode = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        this.user = res;
        this.editableUser = { ...res };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  enableEdit(): void {
    this.editMode = true;
    this.editableUser = { ...this.user };
  }

  cancelEdit(): void {
    this.editMode = false;
    this.editableUser = { ...this.user };
  }

updateProfile(): void {
  this.saving = true;

  const payload = {
    firstName: this.editableUser.firstName,
    lastName: this.editableUser.lastName,
    phone: this.editableUser.phone,
    location: this.editableUser.location
  };

  this.userService.updateMyProfile(payload).subscribe({
    next: (res) => {
      this.user = res;
      this.editableUser = { ...res };
      this.editMode = false;
      this.saving = false;
      alert('Profile updated successfully');
    },
    error: (err) => {
      console.error('Update profile error:', err);
      this.saving = false;
      alert('Error updating profile');
    }
  });
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