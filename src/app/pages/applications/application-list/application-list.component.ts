import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Application,
  OpportunityService,
} from '../../../core/services/opportunity.service';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './application-list.component.html',
})
export class ApplicationListComponent implements OnInit {
  applications: Application[] = [];
  filtered: Application[] = [];
  isLoading = true;
  errorMessage = '';
  activeFilter = 'ALL';

  readonly filters = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'];

  constructor(private opportunityService: OpportunityService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.opportunityService.getAllApplications().subscribe({
      next: (data) => {
        this.applications = data;
        this.applyFilter(this.activeFilter);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load applications.';
        this.isLoading = false;
      },
    });
  }

  applyFilter(filter: string): void {
    this.activeFilter = filter;
    this.filtered =
      filter === 'ALL'
        ? this.applications
        : this.applications.filter((a) => a.status === filter);
  }

  accept(id?: number): void {
    if (!id) {
      return;
    }
    this.opportunityService.accept(id).subscribe({
      next: () => this.load(),
      error: () => (this.errorMessage = 'Accept failed.'),
    });
  }

  reject(id?: number): void {
    if (!id) {
      return;
    }
    this.opportunityService.reject(id).subscribe({
      next: () => this.load(),
      error: () => (this.errorMessage = 'Reject failed.'),
    });
  }

  withdraw(id?: number): void {
    if (!id) {
      return;
    }
    this.opportunityService.withdraw(id).subscribe({
      next: () => this.load(),
      error: () => (this.errorMessage = 'Withdraw failed.'),
    });
  }
}
