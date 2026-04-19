import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FrontOfficeLayoutComponent } from '../../layouts/front-office-layout/front-office-layout.component';
import { ResourceShelterService } from '../../core/services/resource-shelter/resource-shelter.service';
import { ShelterEntity } from '../../shared/models/resource-shelter/resource-shelter.model';

@Component({
  selector: 'app-nearby-shelters',
  standalone: true,
  imports: [CommonModule, RouterModule, FrontOfficeLayoutComponent],
  templateUrl: './nearby-shelters.component.html',
})
export class NearbySheltersComponent {
  shelters: ShelterEntity[] = [];
  isLoading = false;

  constructor(private readonly resourceShelterService: ResourceShelterService) {
    this.loadShelters();
  }

  loadShelters(): void {
    this.isLoading = true;
    this.resourceShelterService.getAllShelters().subscribe({
      next: (items) => {
        this.shelters = items;
        this.isLoading = false;
      },
      error: () => {
        this.shelters = [];
        this.isLoading = false;
      },
    });
  }

  remaining(item: ShelterEntity): number {
    const value = item.capacity - item.currentOccupancy;
    if (value < 0) {
      return 0;
    }
    return value;
  }

  isAvailable(item: ShelterEntity): boolean {
    return this.remaining(item) > 0;
  }
}
