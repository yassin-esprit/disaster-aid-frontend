import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = '';
  @Input() iconBg: string = 'bg-primary';
  @Input() iconColor: string = 'text-on-primary';
  @Input() trend: string = '';
  @Input() trendColor: string = 'text-secondary';
}
