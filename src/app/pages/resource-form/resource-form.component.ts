import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormsModule,
} from '@angular/forms';
import { Observable, map, switchMap, of } from 'rxjs';
import { RouterModule } from '@angular/router';
import { ResourceShelterService } from '../../core/services/resource-shelter/resource-shelter.service';
import {
  ResourceEntity,
  ResourcePayload,
  ResourceType,
} from '../../shared/models/resource-shelter/resource-shelter.model';

@Component({
  selector: 'app-resource-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './resource-form.component.html',
  styleUrl: './resource-form.component.scss',
})
export class ResourceFormComponent {
  private readonly fb = inject(FormBuilder);

  resources: ResourceEntity[] = [];
  isLoading = false;
  isSubmitting = false;
  isAllocating = false;
  successMessage = '';
  errorMessage = '';
  allocationMessage = '';
  editingId: number | null = null;

  readonly types: ResourceType[] = [
    'FOOD_SUPPLY',
    'MEDICAL_KIT',
    'VEHICLE',
    'EQUIPMENT',
    'GENERATOR',
    'BOAT',
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['FOOD_SUPPLY' as ResourceType, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    locationUrl: ['', [Validators.required, Validators.pattern('https?://.+')]],
  });

  readonly allocationForm = this.fb.nonNullable.group({
    taskId: [1001, [Validators.required, Validators.min(1)]],
    resourceId: [0, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  readonly dashboardStats = [
    {
      label: 'Total Resources',
      getValue: () => this.resources.length,
      color: 'text-primary',
    },
    {
      label: 'Resources Available',
      getValue: () =>
        this.resources.filter((item) => item.status === 'AVAILABLE').length,
      color: 'text-tertiary-dim',
    },
    {
      label: 'Active Alerts',
      getValue: () => 3,
      color: 'text-error',
    },
  ];

  constructor(private readonly resourceShelterService: ResourceShelterService) {
    this.loadResources();
  }

  loadResources(): void {
    this.isLoading = true;
    this.resourceShelterService.getAllResources().subscribe({
      next: (items) => {
        this.resources = items;
        if (items.length > 0 && this.allocationForm.getRawValue().resourceId === 0) {
          this.allocationForm.patchValue({ resourceId: items[0].resourceId });
        }
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
    this.isSubmitting = true;

    const raw = this.form.getRawValue();
    this.resolveOwnerId().subscribe({
      next: (resolvedOwnerId) => {
        const payload: ResourcePayload = {
          ownerId: resolvedOwnerId,
          type: raw.type,
          name: raw.name.trim(),
          quantity: Number(raw.quantity),
          condition: 'GOOD',
          locationUrl: raw.locationUrl.trim(),
          status: 'AVAILABLE',
          allocatedToRequestId: null,
        };

        if (this.editingId === null) {
          this.resourceShelterService.createResource(payload).subscribe({
            next: () => {
              this.successMessage = 'Resource ajoutee avec succes.';
              this.afterMutation();
            },
            error: (err) => {
              const message = this.getErrorMessage(err);
              this.errorMessage = message;
              this.isSubmitting = false;
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
            const message = this.getErrorMessage(err);
            this.errorMessage = message;
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

  startEdit(item: ResourceEntity): void {
    this.editingId = item.resourceId;
    this.form.patchValue({
      name: item.name,
      type: item.type,
      quantity: item.quantity,
      locationUrl: item.locationUrl,
    });
    this.successMessage = '';
    this.errorMessage = '';
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

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({
      name: '',
      type: 'FOOD_SUPPLY',
      quantity: 1,
      locationUrl: '',
    });
  }

  allocate(): void {
    if (this.allocationForm.invalid) {
      this.allocationForm.markAllAsTouched();
      return;
    }

    const raw = this.allocationForm.getRawValue();
    const resourceId = Number(raw.resourceId);
    const taskId = Number(raw.taskId);
    const qty = Number(raw.quantity);

    const selected = this.resources.find((item) => item.resourceId === resourceId);
    if (!selected) {
      this.allocationMessage = 'Resource introuvable.';
      return;
    }

    if (qty > selected.quantity) {
      this.allocationMessage = 'Quantite demandee superieure au stock.';
      return;
    }

    this.isAllocating = true;
    this.allocationMessage = '';

    const nextQuantity = selected.quantity - qty;
    const payload: ResourcePayload = {
      ownerId: this.ownerIdOf(selected),
      type: selected.type,
      name: selected.name,
      quantity: nextQuantity,
      condition: selected.condition,
      locationUrl: selected.locationUrl,
      status: nextQuantity === 0 ? 'DEPLOYED' : 'RESERVED',
      allocatedToRequestId: taskId,
    };

    this.resourceShelterService.updateResource(selected.resourceId, payload).subscribe({
      next: () => {
        this.allocationMessage = `Resource allouee a la mission ${taskId}.`;
        this.isAllocating = false;
        this.loadResources();
      },
      error: () => {
        this.allocationMessage = 'Echec allocation resource.';
        this.isAllocating = false;
      },
    });
  }

  ownerIdOf(item: ResourceEntity): number {
    if (item.owner && typeof item.owner.userId === 'number') {
      return item.owner.userId;
    }
    if (item.owner && typeof item.owner.id === 'number') {
      return item.owner.id;
    }
    return 1;
  }

  labelForType(type: ResourceType): string {
    const labels: Record<ResourceType, string> = {
      FOOD_SUPPLY: 'FOOD',
      MEDICAL_KIT: 'MEDICAL',
      VEHICLE: 'VEHICLE',
      EQUIPMENT: 'EQUIPMENT',
      GENERATOR: 'GENERATOR',
      BOAT: 'BOAT',
    };
    return labels[type];
  }

  private afterMutation(): void {
    this.isSubmitting = false;
    this.cancelEdit();
    this.loadResources();
  }

  private getErrorMessage(err: unknown): string {
    if (typeof err === 'object' && err !== null) {
      const withError = err as { error?: { message?: string } };
      if (withError.error && withError.error.message) {
        return withError.error.message;
      }
    }
    return 'Erreur lors de l operation resource.';
  }

  private resolveOwnerId(): Observable<number> {
    const userId = Number(localStorage.getItem('userId'));
    return of(userId > 0 ? userId : 1);
  }
}
