import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthenticatedLayoutComponent } from '../../layouts/authenticated-layout/authenticated-layout.component';
import { ResourceShelterService } from '../../core/services/resource-shelter/resource-shelter.service';
import { ResourceEntity } from '../../shared/models/resource-shelter/resource-shelter.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthenticatedLayoutComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  resources: ResourceEntity[] = [];

  stats = [
    {
      label: 'Total Resources',
      value: '0',
      icon: 'inventory_2',
      iconBg: 'bg-secondary',
      iconColor: 'text-on-secondary',
      trend: 'Live inventory',
      trendColor: 'text-secondary',
    },
    {
      label: 'Resources Available',
      value: '0',
      icon: 'check_circle',
      iconBg: 'bg-primary',
      iconColor: 'text-on-primary',
      trend: 'Ready for allocation',
      trendColor: 'text-primary',
    },
    {
      label: 'Active Alerts',
      value: '3',
      icon: 'emergency',
      iconBg: 'bg-amber-500',
      iconColor: 'text-white',
      trend: 'Monitor in real-time',
      trendColor: 'text-amber-500',
    },
    {
      label: 'Trust Score',
      value: '9.9',
      icon: 'verified_user',
      iconBg: 'bg-blue-900',
      iconColor: 'text-white',
      trend: 'Verified Professional',
      trendColor: 'text-blue-400',
    },
  ];

  alerts = [
    {
      title: 'Wildfire Containment',
      sub: 'North Ridge Sector 4 • 2.4 km away',
      icon: 'local_fire_department',
      severity: 'CRITICAL',
      severityClass: 'bg-error text-on-error',
      iconBg: 'bg-error/20 text-error pulse-error',
      borderClass: 'border-error',
      rowClass: 'bg-error-container/10',
    },
    {
      title: 'Flash Flood Warning',
      sub: 'Central Valley Basin • 5.1 km away',
      icon: 'flood',
      severity: 'HIGH',
      severityClass:
        'bg-orange-500/20 text-orange-500 border border-orange-500/30',
      iconBg: 'bg-orange-500/20 text-orange-500',
      borderClass: 'border-orange-500',
      rowClass: 'bg-white/5',
    },
    {
      title: 'Road Closure: Hwy 101',
      sub: 'Emergency Vehicle Access Only',
      icon: 'block',
      severity: 'MEDIUM',
      severityClass:
        'bg-amber-500/20 text-amber-500 border border-amber-500/30',
      iconBg: 'bg-amber-500/20 text-amber-500',
      borderClass: 'border-amber-500',
      rowClass: 'bg-white/5',
    },
  ];

  opportunities = [
    {
      title: 'Metro Food Bank Distribution',
      location: 'Downtown',
      badge: 'TOMORROW',
      badgeClass: 'text-secondary bg-secondary/10 border border-secondary/20',
    },
    {
      title: 'Pacific Coast Beach Cleanup',
      location: 'Marina Bay',
      badge: 'SATURDAY',
      badgeClass: 'text-primary bg-primary/10 border border-primary/20',
    },
    {
      title: 'Shelter Tech Support',
      location: 'Remote',
      badge: 'NEXT WEEK',
      badgeClass: 'text-on-surface-variant bg-white/5 border border-white/5',
    },
  ];

  notifications = [
    {
      color: 'bg-secondary',
      time: '2 hours ago',
      message:
        'Certification "Emergency First Aid" has been successfully verified.',
    },
    {
      color: 'bg-primary',
      time: '5 hours ago',
      message: 'New request from Hope Shelter matching your skills.',
    },
  ];

  impactBars = [
    { label: 'Civic Engagement', value: 82 },
    { label: 'Crisis Response', value: 45 },
    { label: 'Social Support', value: 67 },
  ];

  challenges = [
    {
      title: 'Summer Responder',
      progress: 80,
      label: '4/5 Walks',
      color: 'bg-amber-400',
    },
    {
      title: 'Community Guardian',
      progress: 24,
      label: '120/500 hrs',
      color: 'bg-primary',
    },
  ];

  constructor(private readonly resourceShelterService: ResourceShelterService) {}

  ngOnInit(): void {
    this.resourceShelterService.getAllResources().subscribe({
      next: (items) => {
        this.resources = items;
        const total = items.length;
        const available = items.filter((item) => item.status === 'AVAILABLE').length;

        this.stats[0].value = String(total);
        this.stats[1].value = String(available);
        this.stats[2].value = String(this.alerts.length);
      },
      error: () => {
        this.stats[0].value = '-';
        this.stats[1].value = '-';
        this.stats[2].value = String(this.alerts.length);
      },
    });
  }
}
