import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  @Input() pageTitle: string = 'Dashboard';
  @Input() breadcrumb: string = '';
  @Input() userName: string = 'User';
  @Input() userRole: string = 'Volunteer';
  @Input() userAvatar: string = '';

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
