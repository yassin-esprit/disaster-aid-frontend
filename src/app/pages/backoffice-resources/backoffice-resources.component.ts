import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Observable, map, switchMap } from 'rxjs';
import { AuthenticatedLayoutComponent } from '../../layouts/authenticated-layout/authenticated-layout.component';
import { ResourceShelterService } from '../../core/services/resource-shelter/resource-shelter.service';
import {
  ResourceCondition,
  ResourceEntity,
  ResourcePayload,
  ResourceStatus,
  ResourceType,
} from '../../shared/models/resource-shelter/resource-shelter.model';

@Component({
  selector: 'app-backoffice-resources',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AuthenticatedLayoutComponent,
  ],
  templateUrl: './backoffice-resources.component.html',
  styleUrl: './backoffice-resources.component.scss',
})
export class BackofficeResourcesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  resources: ResourceEntity[] = [];
  isLoading = false;
  isSaving = false;
  editingId: number | null = null;
  successMessage = '';
  errorMessage = '';
  searchTerm = '';
  currentPage = 1;
  pageSize = 5;
  readonly pageSizeOptions = [5, 10, 20];

  readonly types: ResourceType[] = [
    'VEHICLE',
    'MEDICAL_KIT',
    'FOOD_SUPPLY',
    'EQUIPMENT',
    'GENERATOR',
    'BOAT',
  ];

  readonly conditions: ResourceCondition[] = ['GOOD', 'FAIR', 'POOR'];
  readonly statuses: ResourceStatus[] = [
    'AVAILABLE',
    'DEPLOYED',
    'RESERVED',
    'MAINTENANCE',
  ];

  readonly form = this.fb.nonNullable.group({
    ownerId: [1, [Validators.required, Validators.min(1)]],
    type: ['VEHICLE' as ResourceType, Validators.required],
    name: ['', [Validators.required, Validators.minLength(2)]],
    quantity: [1, [Validators.required, Validators.min(0)]],
    condition: ['GOOD' as ResourceCondition, Validators.required],
    locationUrl: ['', [Validators.required, Validators.pattern('https?://.+')]],
    status: ['AVAILABLE' as ResourceStatus, Validators.required],
    allocatedToRequestId: [''],
  });

  constructor(private readonly resourceShelterService: ResourceShelterService) {}

  ngOnInit(): void {
    this.loadResources();
  }

  get filteredResources(): ResourceEntity[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.resources;
    }

    return this.resources.filter((item) => {
      const ownerId = this.getOwnerId(item);
      const target = [
        String(item.resourceId),
        item.name,
        item.type,
        item.status,
        String(item.quantity),
        String(ownerId),
      ]
        .join(' ')
        .toLowerCase();
      return target.includes(term);
    });
  }

  get totalItems(): number {
    return this.filteredResources.length;
  }

  get totalPages(): number {
    const pages = Math.ceil(this.totalItems / this.pageSize);
    if (pages > 0) {
      return pages;
    }
    return 1;
  }

  get paginatedResources(): ResourceEntity[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredResources.slice(start, end);
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

  loadResources(): void {
    this.isLoading = true;
    this.resourceShelterService.getAllResources().subscribe({
      next: (items) => {
        this.resources = items;
        this.normalizePage();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les resources.';
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
    this.resolveOwnerId(Number(raw.ownerId)).subscribe({
      next: (resolvedOwnerId) => {
        const payload: ResourcePayload = {
          ownerId: resolvedOwnerId,
          type: raw.type,
          name: raw.name.trim(),
          quantity: Number(raw.quantity),
          condition: raw.condition,
          locationUrl: raw.locationUrl.trim(),
          status: raw.status,
          allocatedToRequestId: this.parseOptionalNumber(raw.allocatedToRequestId),
        };

        if (this.editingId === null) {
          this.resourceShelterService.createResource(payload).subscribe({
            next: () => {
              this.successMessage = 'Resource creee avec succes.';
              this.afterMutation();
            },
            error: (err) => {
              this.errorMessage = this.extractErrorMessage(err, 'Erreur creation resource.');
              this.isSaving = false;
            },
          });
          return;
        }

        this.resourceShelterService.updateResource(this.editingId, payload).subscribe({
          next: () => {
            this.successMessage = 'Resource modifiee avec succes.';
            this.afterMutation();
          },
          error: (err) => {
            this.errorMessage = this.extractErrorMessage(err, 'Erreur modification resource.');
            this.isSaving = false;
          },
        });
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(
          err,
          'Impossible de resoudre un utilisateur backend pour resource.',
        );
        this.isSaving = false;
      },
    });
  }

  startEdit(item: ResourceEntity): void {
    this.editingId = item.resourceId;
    this.form.patchValue({
      ownerId: this.getOwnerId(item),
      type: item.type,
      name: item.name,
      quantity: item.quantity,
      condition: item.condition,
      locationUrl: item.locationUrl,
      status: item.status,
      allocatedToRequestId: item.allocatedToRequestId
        ? String(item.allocatedToRequestId)
        : '',
    });
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({
      ownerId: 1,
      type: 'VEHICLE',
      name: '',
      quantity: 1,
      condition: 'GOOD',
      locationUrl: '',
      status: 'AVAILABLE',
      allocatedToRequestId: '',
    });
  }

  remove(item: ResourceEntity): void {
    const ok = window.confirm(`Supprimer la resource #${item.resourceId} ?`);
    if (!ok) {
      return;
    }

    this.resourceShelterService.deleteResource(item.resourceId).subscribe({
      next: () => {
        this.successMessage = 'Resource supprimee avec succes.';
        this.loadResources();
      },
      error: () => {
        this.errorMessage = 'Erreur suppression resource.';
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

  getOwnerId(item: ResourceEntity): number {
    if (item.owner && typeof item.owner.userId === 'number') {
      return item.owner.userId;
    }
    if (item.owner && typeof item.owner.id === 'number') {
      return item.owner.id;
    }
    return 1;
  }

  private afterMutation(): void {
    this.isSaving = false;
    this.cancelEdit();
    this.loadResources();
  }

  private parseOptionalNumber(value: string): number | null {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }
    return Number(normalized);
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

  private resolveOwnerId(requestedId: number): Observable<number> {
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
