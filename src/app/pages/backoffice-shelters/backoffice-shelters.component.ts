import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Observable, map, switchMap } from 'rxjs';
import { AuthenticatedLayoutComponent } from '../../layouts/authenticated-layout/authenticated-layout.component';
import { ResourceShelterService } from '../../core/services/resource-shelter/resource-shelter.service';
import {
  ShelterEntity,
  ShelterPayload,
  ShelterStatus,
} from '../../shared/models/resource-shelter/resource-shelter.model';

@Component({
  selector: 'app-backoffice-shelters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AuthenticatedLayoutComponent,
  ],
  templateUrl: './backoffice-shelters.component.html',
  styleUrl: './backoffice-shelters.component.scss',
})
export class BackofficeSheltersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  shelters: ShelterEntity[] = [];
  isLoading = false;
  isSaving = false;
  editingId: number | null = null;
  successMessage = '';
  errorMessage = '';
  searchTerm = '';
  currentPage = 1;
  pageSize = 5;
  readonly pageSizeOptions = [5, 10, 20];

  readonly statuses: ShelterStatus[] = ['OPEN', 'FULL', 'CLOSED', 'PREPARING'];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    locationUrl: ['', [Validators.required, Validators.pattern('https?://.+')]],
    address: ['', [Validators.required, Validators.minLength(4)]],
    capacity: [10, [Validators.required, Validators.min(1)]],
    managerId: [1, [Validators.required, Validators.min(1)]],
    amenitiesText: [''],
    status: ['OPEN' as ShelterStatus, Validators.required],
  });

  constructor(private readonly resourceShelterService: ResourceShelterService) {}

  ngOnInit(): void {
    this.loadShelters();
  }

  get filteredShelters(): ShelterEntity[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.shelters;
    }

    return this.shelters.filter((item) => {
      const target = [
        String(item.shelterId),
        item.name,
        item.address,
        item.status,
        String(item.capacity),
        String(item.currentOccupancy),
        this.amenityList(item),
      ]
        .join(' ')
        .toLowerCase();

      return target.includes(term);
    });
  }

  get totalItems(): number {
    return this.filteredShelters.length;
  }

  get totalPages(): number {
    const pages = Math.ceil(this.totalItems / this.pageSize);
    if (pages > 0) {
      return pages;
    }
    return 1;
  }

  get paginatedShelters(): ShelterEntity[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredShelters.slice(start, end);
  }

  get pageStart(): number {
    if (this.totalItems === 0) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    if (this.totalItems === 0) {
      return 0;
    }
    const end = this.currentPage * this.pageSize;
    if (end > this.totalItems) {
      return this.totalItems;
    }
    return end;
  }

  loadShelters(): void {
    this.isLoading = true;
    this.resourceShelterService.getAllShelters().subscribe({
      next: (items) => {
        this.shelters = items;
        this.normalizePage();
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
    this.isSaving = true;

    const raw = this.form.getRawValue();
    this.resolveManagerId(Number(raw.managerId)).subscribe({
      next: (resolvedManagerId) => {
        const payload: ShelterPayload = {
          name: raw.name.trim(),
          locationUrl: raw.locationUrl.trim(),
          address: raw.address.trim(),
          capacity: Number(raw.capacity),
          managerId: resolvedManagerId,
          amenities: this.parseAmenities(raw.amenitiesText),
          status: raw.status,
        };

        if (this.editingId === null) {
          this.resourceShelterService.createShelter(payload).subscribe({
            next: () => {
              this.successMessage = 'Shelter cree avec succes.';
              this.afterMutation();
            },
            error: (err) => {
              this.errorMessage = this.extractErrorMessage(err, 'Erreur creation shelter.');
              this.isSaving = false;
            },
          });
          return;
        }

        this.resourceShelterService.updateShelter(this.editingId, payload).subscribe({
          next: () => {
            this.successMessage = 'Shelter modifie avec succes.';
            this.afterMutation();
          },
          error: (err) => {
            this.errorMessage = this.extractErrorMessage(err, 'Erreur modification shelter.');
            this.isSaving = false;
          },
        });
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(
          err,
          'Impossible de resoudre un utilisateur backend pour shelter.',
        );
        this.isSaving = false;
      },
    });
  }

  startEdit(item: ShelterEntity): void {
    this.editingId = item.shelterId;
    this.form.patchValue({
      name: item.name,
      locationUrl: item.locationUrl,
      address: item.address,
      capacity: item.capacity,
      managerId: 1,
      amenitiesText: this.stringifyAmenities(item),
      status: item.status,
    });
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({
      name: '',
      locationUrl: '',
      address: '',
      capacity: 10,
      managerId: 1,
      amenitiesText: '',
      status: 'OPEN',
    });
  }

  remove(item: ShelterEntity): void {
    const ok = window.confirm(`Supprimer le shelter #${item.shelterId} ?`);
    if (!ok) {
      return;
    }

    this.resourceShelterService.deleteShelter(item.shelterId).subscribe({
      next: () => {
        this.successMessage = 'Shelter supprime avec succes.';
        this.loadShelters();
      },
      error: () => {
        this.errorMessage = 'Erreur suppression shelter.';
      },
    });
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.normalizePage();
  }

  onPageSizeChange(value: string): void {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return;
    }

    this.pageSize = parsed;
    this.currentPage = 1;
    this.normalizePage();
  }

  prevPage(): void {
    if (this.currentPage <= 1) {
      return;
    }
    this.currentPage -= 1;
    this.normalizePage();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }
    this.currentPage += 1;
    this.normalizePage();
  }

  amenityList(item: ShelterEntity): string {
    if (!item.amenities || item.amenities.length === 0) {
      return '-';
    }

    const values = item.amenities
      .map((a) => {
        if (a && a.amenity) {
          return a.amenity;
        }
        return '';
      })
      .filter((a) => a.length > 0);

    if (values.length === 0) {
      return '-';
    }

    return values.join(', ');
  }

  private parseAmenities(value: string): string[] {
    if (!value.trim()) {
      return [];
    }

    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private stringifyAmenities(item: ShelterEntity): string {
    if (!item.amenities || item.amenities.length === 0) {
      return '';
    }

    const values = item.amenities
      .map((a) => {
        if (a && a.amenity) {
          return a.amenity;
        }
        return '';
      })
      .filter((a) => a.length > 0);

    return values.join(', ');
  }

  private afterMutation(): void {
    this.isSaving = false;
    this.cancelEdit();
    this.loadShelters();
  }

  private normalizePage(): void {
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const max = this.totalPages;
    if (this.currentPage > max) {
      this.currentPage = max;
    }
  }

  private resolveManagerId(requestedId: number): Observable<number> {
    return this.resourceShelterService.getAllUsers().pipe(
      switchMap((users) => {
        const exact = users.find((u) => u.userId === requestedId);
        if (exact) {
          return [exact.userId];
        }

        if (users.length > 0) {
          return [users[0].userId];
        }

        return this.resourceShelterService
          .createUser('Default Agency')
          .pipe(map((created) => created.userId));
      }),
    );
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    if (typeof err === 'object' && err !== null) {
      const withError = err as { error?: { message?: string } };
      if (withError.error && withError.error.message) {
        return withError.error.message;
      }
    }
    return fallback;
  }
}
