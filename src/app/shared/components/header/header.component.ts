import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {
  @Input() pageTitle: string = 'Dashboard';
  @Input() breadcrumb: string = '';

  userName: string = 'User';
  userRole: string = '';
  userAvatar: string = '';

  searchQuery: string = '';
  showNotifications: boolean = false;

  notifications = [
    {
      type: 'secondary',
      time: '2h ago',
      message: 'Certification "Emergency First Aid" successfully verified.',
    },
    {
      type: 'primary',
      time: '5h ago',
      message: 'New request from Hope Shelter matching your skills.',
    },
    {
      type: 'error',
      time: '1d ago',
      message: 'Flash Flood alert issued for Greater Tunis area.',
    },
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const email = localStorage.getItem('email') || '';
    this.userName = email.split('@')[0] || 'User';
    this.userRole = (this.authService.getRole() || '').replace(/_/g, ' ');
  }

  dotColor(type: string): string {
    const map: Record<string, string> = {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      error: 'bg-error',
      amber: 'bg-amber-400',
    };
    return map[type] || 'bg-primary';
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }
}
