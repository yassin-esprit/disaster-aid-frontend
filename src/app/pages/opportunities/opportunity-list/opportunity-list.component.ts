import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  Application,
  Opportunity,
  OpportunityService,
} from '../../../core/services/opportunity.service';

@Component({
  selector: 'app-opportunity-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './opportunity-list.component.html',
})
export class OpportunityListComponent implements OnInit {
  opportunities: Opportunity[] = [];
  filtered: Opportunity[] = [];
  isLoading = true;
  errorMessage = '';
  activeFilter = 'ALL';

  readonly filters = ['ALL', 'DRAFT', 'OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED'];

  constructor(
    private opportunityService: OpportunityService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.opportunityService.getAll().subscribe({
      next: (data) => {
        this.opportunities = data;
        this.applyFilter(this.activeFilter);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load opportunities.';
        this.isLoading = false;
      },
    });
  }

  applyFilter(filter: string): void {
    this.activeFilter = filter;
    this.filtered =
      filter === 'ALL'
        ? this.opportunities
        : this.opportunities.filter((o) => o.status === filter);
  }

  openCreate(): void {
    this.router.navigate(['/opportunities/new']);
  }

  openDetail(id?: number): void {
    if (!id) {
      return;
    }
    this.router.navigate([`/opportunities/${id}`]);
  }

  closeOpportunity(id?: number): void {
    if (!id) {
      return;
    }
    this.opportunityService.close(id).subscribe({
      next: () => this.load(),
      error: () => (this.errorMessage = 'Close action failed.'),
    });
  }

  deleteOpportunity(id?: number): void {
    if (!id) {
      return;
    }
    this.opportunityService.delete(id).subscribe({
      next: () => this.load(),
      error: () => (this.errorMessage = 'Delete failed.'),
    });
  }

  applyFor(opportunity: Opportunity): void {
    if (!opportunity.id || opportunity.status !== 'OPEN') {
      return;
    }
    const payload: Application = {
      opportunityId: opportunity.id,
      volunteerId: 1,
      motivationLetter: 'Interested in helping with this opportunity.',
    };
    this.opportunityService.apply(payload).subscribe({
      next: () => this.load(),
      error: () => (this.errorMessage = 'Application failed.'),
    });
  }
}
