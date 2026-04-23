import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule} from '@angular/forms';
import { CoordinationService, HelpRequest, TaskAssignment,
  CoordinationStats, VolunteerMatch } from '../../../core/services/coordination.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-help-request-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, StatusBadgeComponent, FormsModule],
  templateUrl: './help-request-list.component.html'
})
export class HelpRequestListComponent implements OnInit {

  /** ADMIN sees assign + delete; VOLUNTEER only sees claim */
  @Input() role: string = 'VOLUNTEER';

  requests: HelpRequest[] = [];
  filtered: HelpRequest[] = [];
  isLoading = true;
  errorMessage = '';
  activeFilter = 'ALL';
  expandedId: number | null = null;
  assignmentsMap: Record<number, TaskAssignment[]> = {};
  assignForm!: FormGroup;
  assigningTo: number | null = null;
  matchesMap: Record<number, VolunteerMatch[]> = {};
  loadingMatches: Record<number, boolean> = {};
  stats: CoordinationStats | null = null;

  // Completion
  completingAssignmentId: number | null = null;
  completingForRequestId: number | null = null;
  completionNote = '';
  completionRating = 5;

  filters = ['ALL','OPEN','ASSIGNED','IN_PROGRESS','RESOLVED','CANCELLED'];

  typeIcons: Record<string,string> = {
    RESCUE: 'sos', MEDICAL: 'medical_services',
    EVACUATION: 'directions_run', SUPPLY: 'inventory_2',
    SHELTER: 'home', TECHNICAL: 'build'
  };

  urgencyColors = ['','text-secondary','text-secondary','text-amber-400','text-orange-400','text-error'];

  constructor(private fb: FormBuilder, private svc: CoordinationService) {}

  get isAdmin(): boolean { return this.role === 'ADMIN'; }

  ngOnInit(): void {
    this.assignForm = this.fb.group({
      responderId: [null, Validators.required],
      notes: ['']
    });
    this.svc.getStats().subscribe({ next: s => this.stats = s });
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.svc.getAllRequests().subscribe({
      next: data => { this.requests = data; this.applyFilter(this.activeFilter); this.isLoading = false; },
      error: () => { this.errorMessage = 'Could not load help requests.'; this.isLoading = false; }
    });
  }

  applyFilter(f: string): void {
    this.activeFilter = f;
    this.filtered = f === 'ALL' ? this.requests : this.requests.filter(r => r.status === f);
  }

  toggleExpand(id: number): void {
    if (this.expandedId === id) { this.expandedId = null; return; }
    this.expandedId = id;
    if (!this.assignmentsMap[id]) {
      this.svc.getAssignmentsByRequest(id).subscribe(a => this.assignmentsMap[id] = a);
    }
  }

  // Admin assign modal
  openAssign(id: number): void {
    this.assigningTo = id;
    this.assignForm.reset();
    this.loadingMatches[id] = true;
    this.svc.getMatches(id).subscribe({
      next: m => { this.matchesMap[id] = m; this.loadingMatches[id] = false; },
      error: () => { this.matchesMap[id] = []; this.loadingMatches[id] = false; }
    });
  }
  closeAssign(): void { this.assigningTo = null; }

  submitAssignment(): void {
    if (this.assignForm.invalid || !this.assigningTo) return;
    this.svc.createAssignment(this.assigningTo, this.assignForm.value).subscribe({
      next: () => {
        this.svc.getAssignmentsByRequest(this.assigningTo!)
          .subscribe(a => this.assignmentsMap[this.assigningTo!] = a);
        this.closeAssign();
      },
      error: () => this.errorMessage = 'Assignment failed.'
    });
  }

  assignFromMatch(volunteerId: number): void {
    if (!this.assigningTo) return;
    this.svc.createAssignment(this.assigningTo, { responderId: volunteerId }).subscribe({
      next: () => {
        this.svc.getAssignmentsByRequest(this.assigningTo!)
          .subscribe(a => this.assignmentsMap[this.assigningTo!] = a);
        this.closeAssign();
      }
    });
  }

  updateStatus(id: number, status: string): void {
    this.svc.updateAssignmentStatus(id, status).subscribe(() => {
      const reqId = Object.keys(this.assignmentsMap).find(k =>
        this.assignmentsMap[+k].some(a => a.id === id)
      );
      if (reqId) {
        this.svc.getAssignmentsByRequest(+reqId).subscribe(a => this.assignmentsMap[+reqId] = a);
      }
    });
  }

  // Completion modal
  openComplete(assignmentId: number, requestId: number): void {
    this.completingAssignmentId = assignmentId;
    this.completingForRequestId = requestId;
    this.completionNote = '';
    this.completionRating = 5;
  }
  closeComplete(): void { this.completingAssignmentId = null; this.completingForRequestId = null; }

  submitCompletion(): void {
    if (!this.completingAssignmentId || !this.completingForRequestId) return;
    this.svc.completeAssignment(this.completingAssignmentId, this.completionNote, this.completionRating)
      .subscribe({
        next: () => {
          const reqId = this.completingForRequestId!;
          this.svc.getAssignmentsByRequest(reqId).subscribe(a => this.assignmentsMap[reqId] = a);
          this.closeComplete();
        }
      });
  }

  getStars(count: number): number[] { return Array.from({ length: count }, (_, i) => i + 1); }
  getTypeIcon(type: string): string { return this.typeIcons[type] || 'help'; }
  getUrgencyColor(u: number): string { return this.urgencyColors[u] || 'text-on-surface-variant'; }
  urgencyDots(u: number): number[] { return Array.from({ length: 5 }, (_, i) => i); }
}
