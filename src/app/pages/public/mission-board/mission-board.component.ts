import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CoordinationService, HelpRequest, TaskAssignment } from '../../../core/services/coordination.service';

interface MissionCard extends HelpRequest {
  expanded: boolean;
  claiming: boolean;
  claimed: boolean;
  assignmentId?: number;
  urgency: number; // Ensure urgency is always a number
}

@Component({
  selector: 'app-mission-board',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mission-board.component.html'
})
export class MissionBoardComponent implements OnInit {

  missions: MissionCard[] = [];
  filtered: MissionCard[] = [];
  isLoading = true;
  errorMessage = '';
  searchQuery = '';
  activeType = 'ALL';
  activeUrgency = 0;
  showClaimedOnly = false;

  types = ['ALL','RESCUE','MEDICAL','EVACUATION','SUPPLY','SHELTER','TECHNICAL'];

  typeConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
    RESCUE:     { icon: 'sos',               color: 'text-error',      bg: 'bg-error/15 border-error/30',      label: 'Rescue'     },
    MEDICAL:    { icon: 'medical_services',  color: 'text-red-300',    bg: 'bg-red-400/15 border-red-400/30',  label: 'Medical'    },
    EVACUATION: { icon: 'directions_run',    color: 'text-orange-400', bg: 'bg-orange-400/15 border-orange-400/30', label: 'Evacuation'},
    SUPPLY:     { icon: 'inventory_2',       color: 'text-amber-400',  bg: 'bg-amber-400/15 border-amber-400/30', label: 'Supply'   },
    SHELTER:    { icon: 'home',              color: 'text-secondary',  bg: 'bg-secondary/15 border-secondary/30',  label: 'Shelter'  },
    TECHNICAL:  { icon: 'build',             color: 'text-primary',    bg: 'bg-primary/15 border-primary/30',  label: 'Technical'  },
  };

  urgencyLabels = ['All urgency','Low','Fair','Moderate','High','Critical'];
  urgencyColors = ['','text-secondary','text-secondary','text-amber-400','text-orange-400','text-error'];

  volunteerId = 1; // TODO: replace with auth user ID

  constructor(private svc: CoordinationService) {}

  ngOnInit(): void { this.load(); }


  load(): void {
    this.isLoading = true;
    this.svc.getAllRequests().subscribe({
      next: data => {
        this.missions = data
          .filter(r => r.status === 'OPEN' || r.status === 'ASSIGNED')
          .map(r => ({ ...r, expanded: false, claiming: false, claimed: false, urgency: r.urgency || 0 })); // Ensure urgency is always a number
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => { this.errorMessage = 'Could not load missions.'; this.isLoading = false; }
    });
  }

  applyFilters(): void {
    this.filtered = this.missions.filter(m => {
      const typeMatch  = this.activeType === 'ALL' || m.type === this.activeType;
      const urgMatch   = this.activeUrgency === 0   || m.urgency >= this.activeUrgency;
      const searchMatch = !this.searchQuery ||
        m.location?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        m.type?.toLowerCase().includes(this.searchQuery.toLowerCase());
      const claimMatch  = !this.showClaimedOnly || m.claimed;
      return typeMatch && urgMatch && searchMatch && claimMatch;
    });
  }

  claim(mission: MissionCard): void {
    mission.claiming = true;
    this.svc.createAssignment(mission.id!, { responderId: this.volunteerId }).subscribe({
      next: a => {
        mission.claiming = false;
        mission.claimed = true;
        mission.assignmentId = a.id;
      },
      error: () => { mission.claiming = false; this.errorMessage = 'Could not claim mission.'; }
    });
  }

  getType(type: string) {
    return this.typeConfig[type] || { icon: 'help', color: 'text-on-surface-variant', bg: 'bg-white/5 border-white/10', label: type };
  }

  urgencyDots(u: number): number[] { return [0,1,2,3,4]; }

  timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  getCriticalCount(): number {
    return this.missions.filter(m => m.urgency >= 4).length;
  }

  getClaimedCount(): number {
    return this.missions.filter(m => m.claimed).length;
  }

  getUrgencyBg(urgency: number): string {
    const map: Record<number, string> = {
      1: 'bg-secondary', 2: 'bg-secondary',
      3: 'bg-amber-400', 4: 'bg-orange-400', 5: 'bg-error'
    };
    return map[urgency] || 'bg-on-surface-variant';
  }

  getClaimBtnClass(type: string): string {
    const t = this.getType(type);
    // convert text-error → bg-error/20, text-secondary → bg-secondary/20 etc
    const bg = t.color
      .replace('text-', 'bg-')
      .replace('-400', '-400/20')
      .replace('-300', '-300/20');
    return `${bg} border border-current hover:opacity-80`;
  }
}
