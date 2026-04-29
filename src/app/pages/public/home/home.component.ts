import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IncidentService, IncidentReport } from '../../../core/services/incident.service';
import { CoordinationService, CoordinationStats } from '../../../core/services/coordination.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {

  incidents: IncidentReport[] = [];
  stats: CoordinationStats | null = null;
  isLoading = true;

  quickActions = [
    {
      label: 'Report an Incident',
      icon: 'report_problem',
      route: '/report',
      desc: 'Flood, fire, earthquake or other emergency',
      color: 'text-error',
      border: 'border-error/30',
      bg: 'bg-error/10',
      glow: 'hover:shadow-[0_0_25px_rgba(255,110,132,0.2)]',
      btnBg: 'bg-error',
      btnText: 'text-on-error'
    },
    {
      label: 'Request Help',
      icon: 'sos',
      route: '/help',
      desc: 'Rescue, medical, evacuation or supplies',
      color: 'text-orange-400',
      border: 'border-orange-400/30',
      bg: 'bg-orange-400/10',
      glow: 'hover:shadow-[0_0_25px_rgba(251,146,60,0.2)]',
      btnBg: 'bg-orange-500',
      btnText: 'text-white'
    },
    {
      label: 'Volunteer on a Mission',
      icon: 'explore',
      route: '/missions',
      desc: 'Find volunteer opportunities near you',
      color: 'text-secondary',
      border: 'border-secondary/30',
      bg: 'bg-secondary/10',
      glow: 'hover:shadow-[0_0_25px_rgba(105,156,255,0.2)]',
      btnBg: 'bg-secondary',
      btnText: 'text-on-secondary'
    },
    {
      label: 'Browse Skills',
      icon: 'psychology',
      route: '/skills-browse',
      desc: 'Explore skills available for volunteers on the platform',
      color: 'text-primary',
      border: 'border-primary/30',
      bg: 'bg-primary/10',
      glow: 'hover:shadow-[0_0_25px_rgba(172,163,255,0.2)]',
      btnBg: 'bg-primary',
      btnText: 'text-on-primary'
    },
  ];

  severityConfig: Record<string, { bar: string; dot: string; label: string }> = {
    LOW:      { bar: 'bg-secondary',  dot: 'bg-secondary',  label: 'Low'      },
    MEDIUM:   { bar: 'bg-amber-400',  dot: 'bg-amber-400',  label: 'Medium'   },
    HIGH:     { bar: 'bg-orange-400', dot: 'bg-orange-400', label: 'High'     },
    CRITICAL: { bar: 'bg-error',      dot: 'bg-error',      label: 'Critical' },
  };

  typeIcon: Record<string, string> = {
    FLOOD: 'water', EARTHQUAKE: 'crisis_alert',
    WILDFIRE: 'local_fire_department', HURRICANE: 'storm',
    TSUNAMI: 'waves', DROUGHT: 'wb_sunny'
  };

  emergencyContacts = [
    { name: 'Civil Protection', number: '197', icon: 'emergency', color: 'text-error'      },
    { name: 'SAMU Medical',     number: '190', icon: 'local_hospital', color: 'text-red-400'   },
    { name: 'Fire Brigade',     number: '198', icon: 'local_fire_department', color: 'text-orange-400' },
  ];

  constructor(
    private incSvc: IncidentService,
    private coordSvc: CoordinationService
  ) {}

  ngOnInit(): void {
    this.coordSvc.getStats().subscribe({ next: s => this.stats = s });
    this.incSvc.getAll().subscribe({
      next: d => { this.incidents = d.slice(0, 6); this.isLoading = false; },
      error: () => this.isLoading = false
    });
  }

  getSeverity(s?: string) { return this.severityConfig[s || ''] || this.severityConfig['LOW']; }
  getIcon(t: string): string { return this.typeIcon[t] || 'warning'; }

  statusDot(s?: string): string {
    const m: Record<string,string> = {
      PENDING: 'bg-amber-400 animate-pulse', VERIFIED: 'bg-secondary',
      REJECTED: 'bg-error', ESCALATED: 'bg-orange-400'
    };
    return m[s || ''] || 'bg-on-surface-variant';
  }

  timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs/24)}d ago`;
  }
}
