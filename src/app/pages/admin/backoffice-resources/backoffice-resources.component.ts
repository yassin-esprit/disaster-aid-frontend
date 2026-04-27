import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Observable, map, switchMap, of } from 'rxjs';
import { ResourceShelterService } from '../../../core/services/resource-shelter/resource-shelter.service';
import {
  ResourceCondition,
  ResourceEntity,
  ResourcePayload,
  ResourceStatus,
  ResourceType,
} from '../../../shared/models/resource-shelter/resource-shelter.model';

@Component({
  selector: 'app-backoffice-resources',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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

  exportResourcesExcel(): void {
    if (this.resources.length === 0) {
      this.errorMessage = 'No resources to export.';
      return;
    }

    const rowsHtml = this.resources
      .map((item, index) => {
        const cells = [
          String(item.resourceId),
          item.name,
          item.type,
          String(item.quantity),
          item.status,
          item.condition,
          String(this.getOwnerId(item)),
          item.allocatedToRequestId !== null && item.allocatedToRequestId !== undefined
            ? String(item.allocatedToRequestId)
            : '-',
          item.locationUrl,
          item.lastUpdatedAt ?? '-',
        ];

        const cellHtml = cells
          .map((cell) => `<td>${this.escapeHtml(cell)}</td>`)
          .join('');

        const zebraClass = index % 2 === 0 ? 'row-even' : 'row-odd';
        return `<tr class="${zebraClass}">${cellHtml}</tr>`;
      })
      .join('');

    const htmlContent = `
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: Calibri, Arial, sans-serif; }
      h2 { margin: 0 0 12px 0; color: #1f4e78; }
      .meta { margin: 0 0 14px 0; color: #666; font-size: 12px; }
      table { border-collapse: collapse; width: 100%; }
      th, td {
        border: 1px solid #d9e1f2;
        padding: 8px 10px;
        font-size: 12px;
        vertical-align: middle;
      }
      th {
        background: #2f5597;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .row-even { background: #edf3ff; }
      .row-odd { background: #ffffff; }
      td:nth-child(4), td:nth-child(7), td:nth-child(8) { text-align: center; }
      td:nth-child(9) { color: #1a73e8; }
    </style>
  </head>
  <body>
    <h2>Resources Export</h2>
    <p class="meta">Generated at: ${this.escapeHtml(new Date().toLocaleString())}</p>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Type</th>
          <th>Quantity</th>
          <th>Status</th>
          <th>Condition</th>
          <th>Owner ID</th>
          <th>Allocated Request ID</th>
          <th>Location URL</th>
          <th>Last Updated</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </body>
</html>`;

    const blob = new Blob(['\uFEFF' + htmlContent], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });

    const now = new Date();
    const fileName = `resources-export-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xls`;

    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);

    this.successMessage = 'Resources exported successfully.';
    this.errorMessage = '';
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

  private parseOptionalNumber(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
    const userId = Number(localStorage.getItem('userId'));
    return of(requestedId > 0 ? requestedId : (userId > 0 ? userId : 1));
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
