import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthenticatedLayoutComponent } from '../../layouts/authenticated-layout/authenticated-layout.component';
import { ResourceShelterService } from '../../core/services/resource-shelter/resource-shelter.service';
import { ShelterEntity } from '../../shared/models/resource-shelter/resource-shelter.model';

@Component({
  selector: 'app-shelter-details',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthenticatedLayoutComponent],
  templateUrl: './shelter-details.component.html',
})
export class ShelterDetailsComponent {
  shelter: ShelterEntity | null = null;
  isLoading = true;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly resourceShelterService: ResourceShelterService,
  ) {
    this.loadDetails();
  }

  loadDetails(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const shelterId = Number(idParam);

    this.resourceShelterService.getAllShelters().subscribe({
      next: (items) => {
        const found = items.find((item) => item.shelterId === shelterId);
        if (found) {
          this.shelter = found;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  remaining(): number {
    if (!this.shelter) {
      return 0;
    }

    const value = this.shelter.capacity - this.shelter.currentOccupancy;
    if (value < 0) {
      return 0;
    }
    return value;
  }
}
