import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Observable, map, switchMap } from 'rxjs';
import { RouterModule } from '@angular/router';
import { FrontOfficeLayoutComponent } from '../../layouts/front-office-layout/front-office-layout.component';
import { ResourceShelterService } from '../../core/services/resource-shelter/resource-shelter.service';
import {
  ShelterEntity,
  ShelterPayload,
  ShelterStatus,
} from '../../shared/models/resource-shelter/resource-shelter.model';

@Component({
  selector: 'app-shelter-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FrontOfficeLayoutComponent,
  ],
  templateUrl: './shelter-form.component.html',
  styleUrl: './shelter-form.component.scss',
})
export class ShelterFormComponent {
  private readonly fb = inject(FormBuilder);

  shelters: ShelterEntity[] = [];
  occupancyDelta: Record<number, number> = {};
  isLoading = false;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  readonly statuses: ShelterStatus[] = ['OPEN', 'FULL', 'CLOSED', 'PREPARING'];

  readonly shelterTypes = ['TEMPORARY', 'MEDICAL', 'FAMILY', 'EVACUATION'];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    locationUrl: ['', [Validators.required, Validators.pattern('https?://.+')]],
    address: ['', [Validators.required, Validators.minLength(4)]],
    capacity: [10, [Validators.required, Validators.min(1)]],
    shelterType: ['TEMPORARY', Validators.required],
  });

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
        this.errorMessage = 'Impossible de charger les shelters.';
        this.isLoading = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    const raw = this.form.getRawValue();
    this.resolveManagerId().subscribe({
      next: (resolvedManagerId) => {
        const payload: ShelterPayload = {
          name: raw.name.trim(),
          locationUrl: raw.locationUrl.trim(),
          address: raw.address.trim(),
          capacity: Number(raw.capacity),
          managerId: resolvedManagerId,
          amenities: [`TYPE:${raw.shelterType}`],
          status: 'OPEN',
        };

        this.resourceShelterService.createShelter(payload).subscribe({
          next: () => {
            this.successMessage = 'Shelter ajoute avec succes.';
            this.isSubmitting = false;
            this.form.reset({
              name: '',
              locationUrl: '',
              address: '',
              capacity: 10,
              shelterType: 'TEMPORARY',
            });
            this.loadShelters();
          },
          error: (err) => {
            this.errorMessage = this.getErrorMessage(err);
            this.isSubmitting = false;
          },
        });
      },
      error: (err) => {
        this.errorMessage = this.getErrorMessage(err);
        this.isSubmitting = false;
      },
    });
  }

  checkIn(item: ShelterEntity): void {
    const current = this.displayOccupancy(item);
    if (current >= item.capacity) {
      return;
    }

    this.occupancyDelta[item.shelterId] = this.deltaFor(item) + 1;
  }

  checkOut(item: ShelterEntity): void {
    const current = this.displayOccupancy(item);
    if (current <= 0) {
      return;
    }

    this.occupancyDelta[item.shelterId] = this.deltaFor(item) - 1;
  }

  displayOccupancy(item: ShelterEntity): number {
    const value = item.currentOccupancy + this.deltaFor(item);
    if (value < 0) {
      return 0;
    }
    if (value > item.capacity) {
      return item.capacity;
    }
    return value;
  }

  remainingCapacity(item: ShelterEntity): number {
    return item.capacity - this.displayOccupancy(item);
  }

  availabilityStatus(item: ShelterEntity): string {
    if (this.remainingCapacity(item) <= 0) {
      return 'FULL';
    }
    return 'AVAILABLE';
  }

  private deltaFor(item: ShelterEntity): number {
    const value = this.occupancyDelta[item.shelterId];
    if (typeof value === 'number') {
      return value;
    }
    return 0;
  }

  private getErrorMessage(err: unknown): string {
    if (typeof err === 'object' && err !== null) {
      const withError = err as { error?: { message?: string } };
      if (withError.error && withError.error.message) {
        return withError.error.message;
      }
    }
    return 'Erreur lors de la creation de shelter.';
  }

  private resolveManagerId(): Observable<number> {
    return this.resourceShelterService.getAllUsers().pipe(
      switchMap((users) => {
        if (users.length > 0) {
          return [users[0].userId];
        }

        return this.resourceShelterService
          .createUser('Default Agency')
          .pipe(map((created) => created.userId));
      }),
    );
  }
}
