import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { User, UserRequest } from '../../modules/identity/models/user.model';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss']
})
export class UsersManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';

  showModal = false;
  isEditMode = false;
  selectedUserId: number | null = null;
  saving = false;

  formData: UserRequest = {
    email: '',
    password: '',
    role: 'CITIZEN',
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    profilePhoto: '',
    emailVerified: false,
    phoneVerified: false,
    mfaEnabled: false,
    status: 'ACTIVE'
  };

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Load users error:', err);
        this.errorMessage = `Failed to load users (${err.status || 'unknown error'})`;
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter((user) =>
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term) ||
      (user.status || '').toLowerCase().includes(term)
    );
  }

  openAddModal(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditMode = false;
    this.selectedUserId = null;

    this.formData = {
      email: '',
      password: '',
      role: 'CITIZEN',
      firstName: '',
      lastName: '',
      phone: '',
      location: '',
      profilePhoto: '',
      emailVerified: false,
      phoneVerified: false,
      mfaEnabled: false,
      status: 'ACTIVE'
    };

    this.showModal = true;
  }

  openEditModal(user: User): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditMode = true;
    this.selectedUserId = user.userId;

    this.formData = {
      email: user.email,
      password: '',
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      location: user.location || '',
      profilePhoto: user.profilePhoto || '',
      emailVerified: user.emailVerified ?? false,
      phoneVerified: user.phoneVerified ?? false,
      mfaEnabled: user.mfaEnabled ?? false,
      status: user.status || 'ACTIVE'
    };

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  submitForm(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.formData.firstName || !this.formData.lastName || !this.formData.email || !this.formData.role) {
      this.errorMessage = 'Please fill in the required fields.';
      return;
    }

    if (!this.isEditMode && !this.formData.password) {
      this.errorMessage = 'Password is required when creating a user.';
      return;
    }

    this.saving = true;

    if (this.isEditMode && this.selectedUserId !== null) {
      this.userService.updateUser(this.selectedUserId, this.formData).subscribe({
        next: () => {
          this.successMessage = 'User updated successfully.';
          this.saving = false;
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          console.error('Update user error:', err);
          this.errorMessage = err?.error?.message || 'Failed to update user.';
          this.saving = false;
        }
      });
    } else {
      this.userService.createUser(this.formData).subscribe({
        next: () => {
          this.successMessage = 'User created successfully.';
          this.saving = false;
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          console.error('Create user error:', err);
          this.errorMessage = err?.error?.message || 'Failed to create user.';
          this.saving = false;
        }
      });
    }
  }

  deleteUser(id: number): void {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error('Delete user error:', err);
        this.errorMessage = err?.error?.message || `Failed to delete user (${err.status || 'unknown error'})`;
      }
    });
  }

  getRoleClass(role?: string): string {
    switch ((role || '').toUpperCase()) {
      case 'PLATFORM_ADMIN':
        return 'role-admin';
      case 'ORG_ADMIN':
      case 'AGENCY_ADMIN':
        return 'role-manager';
      case 'RESPONDER':
        return 'role-responder';
      case 'VOLUNTEER':
        return 'role-volunteer';
      default:
        return 'role-citizen';
    }
  }

  getStatusClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':
        return 'status-active';
      case 'PENDING':
        return 'status-pending';
      case 'SUSPENDED':
        return 'status-suspended';
      default:
        return 'status-default';
    }
  }
}