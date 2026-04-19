import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Observable, map, switchMap } from 'rxjs';
import { AuthenticatedLayoutComponent } from '../../layouts/authenticated-layout/authenticated-layout.component';
import { ResourceShelterService } from '../../core/services/resource-shelter/resource-shelter.service';
import {
  ShelterEntity,
  ShelterOccupantEntity,
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
  private readonly uiToApiStatusMap: Record<UiShelterStatus, ShelterStatus> = {
    AVAILABLE: 'OPEN',
    FULL: 'FULL',
  };
  private readonly apiToUiStatusMap: Record<ShelterStatus, UiShelterStatus> = {
    OPEN: 'AVAILABLE',
    FULL: 'FULL',
    CLOSED: 'FULL',
    PREPARING: 'AVAILABLE',
  };

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

  readonly statuses: UiShelterStatus[] = ['AVAILABLE', 'FULL'];
  readonly shelterTypes: UiShelterType[] = ['LOCAL', 'MEDICAL'];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    locationUrl: ['', [Validators.required, Validators.pattern('https?://.+')]],
    address: ['', [Validators.required, Validators.minLength(3)]],
    capacity: [10, [Validators.required, Validators.min(1)]],
    managerId: [1, [Validators.required, Validators.min(1)]],
    shelterType: ['LOCAL' as UiShelterType, Validators.required],
    status: ['AVAILABLE' as UiShelterStatus, Validators.required],
  });

  constructor(private readonly resourceShelterService: ResourceShelterService) {}

  ngOnInit(): void {
    this.loadShelters();
  }

  get filteredShelters(): ShelterEntity[] {
    const orderedShelters = [...this.shelters].sort(
      (a, b) => b.shelterId - a.shelterId,
    );

    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return orderedShelters;
    }

    return orderedShelters.filter((item) => {
      const target = [
        item.name,
        item.address,
        item.locationUrl,
        this.managerIdOf(item),
        this.availabilityStatus(item),
        String(item.capacity),
        String(this.displayOccupancy(item)),
        this.shelterTypeLabel(item),
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
      this.errorMessage = 'Formulaire invalide. Verifiez Name, Address (min 3), Location URL, Capacity, Status et Type.';
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
          amenities: [`TYPE:${raw.shelterType}`],
          status: this.toApiStatus(raw.status),
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
      shelterType: this.extractShelterType(item),
      status: this.toUiStatus(item.status),
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
      shelterType: 'LOCAL',
      status: 'AVAILABLE',
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

  checkIn(item: ShelterEntity): void {
    const current = this.displayOccupancy(item);
    if (current >= item.capacity) {
      return;
    }

    this.resolveManagerId(this.occupantUserId(item))
      .pipe(
        switchMap((resolvedUserId) =>
          this.resourceShelterService.checkInShelter({
            shelterId: item.shelterId,
            userId: resolvedUserId,
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Occupancy updated successfully.';
          this.errorMessage = '';
          this.loadShelters();
        },
        error: (err) => {
          this.errorMessage = this.extractErrorMessage(
            err,
            'Unable to check in occupant.',
          );
        },
      });
  }

  checkOut(item: ShelterEntity): void {
    const current = this.displayOccupancy(item);
    if (current <= 0) {
      return;
    }

    this.resourceShelterService
      .getShelterOccupantsByShelter(item.shelterId)
      .pipe(
        map((records) => this.latestActiveOccupant(records)),
        switchMap((activeRecord) => {
          if (!activeRecord) {
            throw new Error('No active occupant record');
          }
          return this.resourceShelterService.checkOutShelter(activeRecord.recordId);
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Occupancy updated successfully.';
          this.errorMessage = '';
          this.loadShelters();
        },
        error: (err) => {
          this.errorMessage = this.extractErrorMessage(
            err,
            'Unable to check out occupant.',
          );
        },
      });
  }

  displayOccupancy(item: ShelterEntity): number {
    const value = item.currentOccupancy;
    if (value < 0) {
      return 0;
    }
    if (value > item.capacity) {
      return item.capacity;
    }
    return value;
  }

  availabilityStatus(item: ShelterEntity): 'AVAILABLE' | 'FULL' {
    if (this.displayOccupancy(item) >= item.capacity) {
      return 'FULL';
    }
    return 'AVAILABLE';
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

  exportSheltersExcel(): void {
    const rows = this.filteredShelters.map((item, index) => {
      const values = [
        index + 1,
        item.name,
        this.managerIdOf(item),
        item.address,
        item.locationUrl,
        item.capacity,
        this.displayOccupancy(item),
        this.availabilityStatus(item),
        this.shelterTypeLabel(item),
      ];

      return `<tr>${values
        .map((value) => `<td>${this.escapeHtml(String(value ?? ''))}</td>`)
        .join('')}</tr>`;
    });

    const dateLabel = new Date().toLocaleDateString('fr-FR');
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Calibri, Arial, sans-serif; margin: 18px; color: #1f2937; }
    h2 { margin: 0 0 6px 0; color: #1d4ed8; }
    .meta { margin: 0 0 14px 0; font-size: 12px; color: #6b7280; }
    table { border-collapse: collapse; width: 100%; }
    thead th {
      background: #1d4ed8;
      color: #ffffff;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border: 1px solid #93c5fd;
      padding: 9px;
      text-align: left;
    }
    tbody td {
      border: 1px solid #dbeafe;
      padding: 8px;
      font-size: 12px;
      vertical-align: top;
    }
    tbody tr:nth-child(even) { background: #eff6ff; }
  </style>
</head>
<body>
  <h2>BackOffice Shelters Export</h2>
  <p class="meta">Generated on ${this.escapeHtml(dateLabel)} • Total shelters: ${rows.length}</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Manager ID</th>
        <th>Address</th>
        <th>Location URL</th>
        <th>Capacity</th>
        <th>Occupancy</th>
        <th>Status</th>
        <th>Type</th>
      </tr>
    </thead>
    <tbody>
      ${rows.length > 0 ? rows.join('') : '<tr><td colspan="9">No shelters found.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([html], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    anchor.href = objectUrl;
    anchor.download = `shelters-export-${stamp}.xls`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
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

  shelterTypeLabel(item: ShelterEntity): UiShelterType {
    return this.extractShelterType(item);
  }

  private occupantUserId(item: ShelterEntity): number {
    const manager = this.managerIdOf(item);
    const parsed = Number(manager);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    return 1;
  }

  managerIdOf(item: ShelterEntity): string {
    const candidate = item as ShelterEntity & {
      managerId?: number;
      manager?: { userId?: number; id?: number };
    };

    if (typeof candidate.managerId === 'number') {
      return String(candidate.managerId);
    }

    if (candidate.manager && typeof candidate.manager.userId === 'number') {
      return String(candidate.manager.userId);
    }

    if (candidate.manager && typeof candidate.manager.id === 'number') {
      return String(candidate.manager.id);
    }

    return '-';
  }

  mapsUrl(item: ShelterEntity): string {
    const raw = item.locationUrl.trim();
    if (!raw) {
      return 'https://maps.google.com';
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}`;
  }

  private latestActiveOccupant(
    records: ShelterOccupantEntity[],
  ): ShelterOccupantEntity | null {
    const active = records.filter((record) => !record.checkOutAt);
    if (active.length === 0) {
      return null;
    }

    active.sort((a, b) => {
      const aTime = new Date(a.checkInAt).getTime();
      const bTime = new Date(b.checkInAt).getTime();
      return bTime - aTime;
    });

    return active[0];
  }

  private extractShelterType(item: ShelterEntity): UiShelterType {
    const typeAmenity = item.amenities?.find((a) =>
      (a.amenity ?? '').startsWith('TYPE:'),
    );
    const rawType = (typeAmenity?.amenity ?? '').replace('TYPE:', '').toUpperCase();
    if (rawType === 'MEDICAL') {
      return 'MEDICAL';
    }
    return 'LOCAL';
  }

  private toApiStatus(status: UiShelterStatus): ShelterStatus {
    return this.uiToApiStatusMap[status];
  }

  private toUiStatus(status: ShelterStatus): UiShelterStatus {
    return this.apiToUiStatusMap[status];
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

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

type UiShelterStatus = 'AVAILABLE' | 'FULL';
type UiShelterType = 'LOCAL' | 'MEDICAL';
