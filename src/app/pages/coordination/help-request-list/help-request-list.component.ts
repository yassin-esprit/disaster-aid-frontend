import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import { CoordinationService, HelpRequest, TaskAssignment,
  CoordinationStats, VolunteerMatch } from '../../../core/services/coordination.service';



import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-help-request-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
  ],
  templateUrl: './help-request-list.component.html',
})
export class HelpRequestListComponent implements OnInit {


  matchesMap: Record<number, VolunteerMatch[]> = {};
  loadingMatches: Record<number, boolean> = {};


  requests: HelpRequest[] = [];
  filtered: HelpRequest[] = [];
  isLoading = true;
  stats: CoordinationStats | null = null;
  errorMessage = '';
  activeFilter = 'ALL';
  expandedId: number | null = null;
  assignmentsMap: Record<number, TaskAssignment[]> = {};
  assignForm!: FormGroup;
  assigningTo: number | null = null;
  deleteConfirmId: number | null = null;

  filters = ['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];

  typeIcons: Record<string, string> = {
    RESCUE: 'sos',
    MEDICAL: 'medical_services',
    EVACUATION: 'directions_run',
    SUPPLY: 'inventory_2',
    SHELTER: 'home',
    TECHNICAL: 'build',
  };

  urgencyColors = [
    '',
    'text-secondary',
    'text-secondary',
    'text-amber-400',
    'text-orange-400',
    'text-error',
  ];

  constructor(
    private fb: FormBuilder,
    private svc: CoordinationService,
  ) {}

  ngOnInit(): void {
    this.assignForm = this.fb.group({
      responderId: [null, Validators.required],
      notes: [''],
    });
    this.load();
    this.svc.getStats().subscribe({ next: s => this.stats = s });
  }

  load(): void {
    this.isLoading = true;
    this.svc.getAllRequests().subscribe({
      next: (data) => {
        this.requests = data;
        this.applyFilter(this.activeFilter);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load help requests.';
        this.isLoading = false;
      },
    });
  }

  applyFilter(f: string): void {
    this.activeFilter = f;
    this.filtered =
      f === 'ALL' ? this.requests : this.requests.filter((r) => r.status === f);
  }

  toggleExpand(id: number): void {
    if (this.expandedId === id) {
      this.expandedId = null;
      return;
    }
    this.expandedId = id;
    if (!this.assignmentsMap[id]) {
      this.svc
        .getAssignmentsByRequest(id)
        .subscribe((a) => (this.assignmentsMap[id] = a));
    }
  }


  openAssign(id: number): void {
    this.assigningTo = id;
    this.assignForm.reset();
    this.loadingMatches[id] = true;
    this.svc.getMatches(id).subscribe({
      next: m => { this.matchesMap[id] = m; this.loadingMatches[id] = false; },
      error: () => { this.matchesMap[id] = []; this.loadingMatches[id] = false; }
    });
  }
  closeAssign(): void {
    this.assigningTo = null;
  }

  submitAssignment(): void {
    if (this.assignForm.invalid || !this.assigningTo) return;
    this.svc
      .createAssignment(this.assigningTo, this.assignForm.value)
      .subscribe({
        next: () => {
          this.assignmentsMap[this.assigningTo!] = [];
          this.svc
            .getAssignmentsByRequest(this.assigningTo!)
            .subscribe((a) => (this.assignmentsMap[this.assigningTo!] = a));
          this.closeAssign();
        },
        error: () => (this.errorMessage = 'Assignment failed.'),
      });
  }

  updateStatus(id: number, status: string): void {
    this.svc.updateAssignmentStatus(id, status).subscribe(() => {
      const reqId = Object.keys(this.assignmentsMap).find((k) =>
        this.assignmentsMap[+k].some((a) => a.id === id),
      );
      if (reqId) {
        this.svc
          .getAssignmentsByRequest(+reqId)
          .subscribe((a) => (this.assignmentsMap[+reqId] = a));
      }
    });
  }

  confirmDelete(id: number): void {
    this.deleteConfirmId = id;
  }
  cancelDelete(): void {
    this.deleteConfirmId = null;
  }
  doDelete(): void {
    if (!this.deleteConfirmId) return;
    this.svc.deleteRequest(this.deleteConfirmId).subscribe({
      next: () => {
        this.deleteConfirmId = null;
        this.load();
      },
      error: () => {
        this.errorMessage = 'Delete failed.';
        this.deleteConfirmId = null;
      },
    });
  }

  getTypeIcon(type: string): string {
    return this.typeIcons[type] || 'help';
  }
  getUrgencyColor(u: number): string {
    return this.urgencyColors[u] || 'text-on-surface-variant';
  }
  urgencyDots(u: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i);
  }


  assignFromMatch(helpRequestId: number, volunteerId: number): void {
    this.svc.createAssignment(helpRequestId, { responderId: volunteerId }).subscribe({
      next: () => {
        this.assignmentsMap[helpRequestId] = [];
        this.svc.getAssignmentsByRequest(helpRequestId)
          .subscribe(a => this.assignmentsMap[helpRequestId] = a);
        this.closeAssign();
      },
      error: () => this.errorMessage = 'Assignment failed.'
    });
  }
}
