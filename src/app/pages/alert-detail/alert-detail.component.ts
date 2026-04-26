import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AlertService } from '../../core/services/alert.service';
import { AuthService } from '../../core/services/auth.service';
import { Alert } from '../../shared/models/sensor.model';
import { MapViewComponent } from '../../shared/components/map-view/map-view.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

const ADMIN_ROLES = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN', 'ADMIN'];

@Component({
  selector: 'app-alert-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MapViewComponent, StatusBadgeComponent],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">

      <!-- ── CREATE MODE ────────────────────────────────────── -->
      <ng-container *ngIf="isNew">
        <div class="flex items-center gap-3">
          <a [routerLink]="basePath" class="text-on-surface-variant hover:text-on-surface transition-colors">
            <span class="material-symbols-outlined">arrow_back</span>
          </a>
          <h1 class="text-3xl font-black">New Alert</h1>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="glass-1 p-6 rounded-2xl border border-white/5 space-y-4">
            <h2 class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Alert Details</h2>

            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Title *</label>
              <input [(ngModel)]="formData.title"
                     class="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-primary/50 transition-colors" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Disaster Type *</label>
                <select [(ngModel)]="formData.disasterType"
                        class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50">
                  <option *ngFor="let t of disasterTypes" [value]="t">{{ t }}</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Severity *</label>
                <select [(ngModel)]="formData.severity"
                        class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50">
                  <option *ngFor="let s of severities" [value]="s">{{ s }}</option>
                </select>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Description</label>
              <textarea [(ngModel)]="formData.description" rows="3"
                        class="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-primary/50 transition-colors resize-none"></textarea>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Confidence Score (0–1)</label>
              <input type="number" [(ngModel)]="formData.confidenceScore" min="0" max="1" step="0.01"
                     class="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-primary/50 transition-colors" />
            </div>

            <div class="flex gap-3 pt-2">
              <button (click)="createAlert()"
                      class="flex-1 bg-error/20 border border-error/30 text-error py-3 rounded-xl font-bold text-sm hover:bg-error/30 transition-all">
                Create Alert
              </button>
              <a [routerLink]="basePath"
                 class="px-5 py-3 rounded-xl border border-white/20 font-bold text-sm text-on-surface-variant hover:bg-white/5 transition-all">
                Cancel
              </a>
            </div>
          </div>

          <div class="glass-1 p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
            <h2 class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Affected Area</h2>
            <div class="flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant gap-3">
              <span class="material-symbols-outlined text-5xl text-primary/40">draw</span>
              <p class="text-sm">Polygon geometry can be set after creation by editing the alert and providing WKT coordinates, or through the Geofence Zones page.</p>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ── VIEW MODE ──────────────────────────────────────── -->
      <ng-container *ngIf="!isNew && !editMode && alert">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <a [routerLink]="basePath" class="text-on-surface-variant hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined">arrow_back</span>
            </a>
            <div>
              <h1 class="text-3xl font-black">{{ alert.title }}</h1>
              <p class="text-sm text-on-surface-variant font-mono">{{ alert.disasterType }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button *ngIf="alert.status !== 'RESOLVED'" (click)="resolve()"
                    class="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-bold hover:bg-green-500/20 transition-all">
              <span class="material-symbols-outlined text-sm">check_circle</span> Resolve
            </button>
            <button (click)="enableEdit()"
                    class="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
              <span class="material-symbols-outlined text-sm">edit</span> Edit
            </button>
            <button (click)="deleteAlert()"
                    class="flex items-center gap-2 px-4 py-2 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold hover:bg-error/20 transition-all">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div class="lg:col-span-2 glass-1 p-6 rounded-2xl border border-white/5 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Severity</span>
              <span class="px-2 py-1 rounded text-[10px] font-black uppercase"
                    [ngClass]="severityClass(alert.severity)">{{ alert.severity }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status</span>
              <app-status-badge [status]="alert.status"></app-status-badge>
            </div>
            <div class="h-px bg-white/5"></div>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-on-surface-variant">Confidence</span>
                <span class="font-medium">{{ alert.confidenceScore != null ? (alert.confidenceScore * 100).toFixed(0) + '%' : '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-on-surface-variant">Issued</span>
                <span class="font-medium">{{ alert.issuedAt | date:'dd MMM yyyy, HH:mm' }}</span>
              </div>
              <div class="flex justify-between" *ngIf="alert.resolvedAt">
                <span class="text-on-surface-variant">Resolved</span>
                <span class="font-medium text-green-400">{{ alert.resolvedAt | date:'dd MMM yyyy, HH:mm' }}</span>
              </div>
              <div *ngIf="alert.description" class="pt-2 border-t border-white/5">
                <p class="text-on-surface-variant text-xs uppercase tracking-widest mb-1">Description</p>
                <p class="text-sm">{{ alert.description }}</p>
              </div>
            </div>
          </div>

          <div class="lg:col-span-3 glass-1 p-4 rounded-2xl border border-white/5" style="height: 380px;">
            <app-map-view [geometries]="mapGeometries"></app-map-view>
          </div>
        </div>
      </ng-container>

      <!-- ── EDIT MODE ───────────────────────────────────────── -->
      <ng-container *ngIf="!isNew && editMode && alert">
        <div class="flex items-center gap-3">
          <button (click)="cancelEdit()" class="text-on-surface-variant hover:text-on-surface transition-colors">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 class="text-3xl font-black">Edit — {{ alert.title }}</h1>
        </div>
        <div class="glass-1 p-6 rounded-2xl border border-white/5 max-w-xl space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Title</label>
            <input [(ngModel)]="editData.title"
                   class="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-primary/50" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Disaster Type</label>
              <select [(ngModel)]="editData.disasterType"
                      class="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none">
                <option *ngFor="let t of disasterTypes" [value]="t">{{ t }}</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Severity</label>
              <select [(ngModel)]="editData.severity"
                      class="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none">
                <option *ngFor="let s of severities" [value]="s">{{ s }}</option>
              </select>
            </div>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Description</label>
            <textarea [(ngModel)]="editData.description" rows="3"
                      class="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none resize-none"></textarea>
          </div>
          <div class="flex gap-3 pt-2">
            <button (click)="updateAlert()"
                    class="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold text-sm">Save Changes</button>
            <button (click)="cancelEdit()"
                    class="px-5 py-3 rounded-xl border border-white/20 font-bold text-sm">Cancel</button>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class AlertDetailComponent implements OnInit {
  alert?: Alert;
  isNew    = false;
  editMode = false;
  basePath = '/alerts'; // set dynamically based on role

  disasterTypes = ['FLOOD', 'EARTHQUAKE', 'WILDFIRE', 'LANDSLIDE', 'STORM', 'CHEMICAL'];
  severities    = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

  formData: any = { title: '', disasterType: 'FLOOD', severity: 'MODERATE', description: '', confidenceScore: null, issuedBy: 1 };
  editData: any = {};

  get mapGeometries() {
    const geoms: any[] = [];
    if (this.alert?.affectedArea)    geoms.push({ type: 'Polygon', wkt: this.alert.affectedArea,    color: '#ff3388' });
    if (this.alert?.predictedArea2h) geoms.push({ type: 'Polygon', wkt: this.alert.predictedArea2h, color: '#ffaa33' });
    if (this.alert?.predictedArea6h) geoms.push({ type: 'Polygon', wkt: this.alert.predictedArea6h, color: '#33aaff' });
    return geoms;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const role = (this.authService.getRole() || '').trim().toUpperCase();
    const isAdmin = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'AGENCY_ADMIN', 'ADMIN'].includes(role);
    this.basePath = isAdmin ? '/admin/alerts' : '/alerts';

    // Detect "new" by route param — never rely on window.location
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isNew = !idParam || idParam === 'new';

    if (!this.isNew) {
      const id = Number(idParam);
      if (!isNaN(id) && id > 0) {
        this.alertService.getAlertById(id).subscribe(data => {
          this.alert    = data;
          this.editData = { ...data };
        });
      }
    }
  }

  createAlert(): void {
    this.alertService.createAlert(this.formData)
      .subscribe(() => this.router.navigate([this.basePath]));
  }
  enableEdit(): void  { this.editMode = true; this.editData = { ...this.alert }; }
  cancelEdit(): void  { this.editMode = false; }
  updateAlert(): void {
    if (!this.alert) return;
    this.alertService.updateAlert(this.alert.id, this.editData)
      .subscribe(u => { this.alert = u; this.editMode = false; });
  }
  deleteAlert(): void {
    if (!this.alert) return;
    if (confirm('Delete this alert?')) {
      this.alertService.deleteAlert(this.alert.id)
        .subscribe({ next: () => this.router.navigate([this.basePath]) });
    }
  }
  resolve(): void {
    if (this.alert) this.alertService.resolveAlert(this.alert.id).subscribe(u => this.alert = u);
  }
  severityClass(s: string): string {
    return ({ CRITICAL: 'bg-error text-white', HIGH: 'bg-orange-500/20 text-orange-400', MODERATE: 'bg-amber-500/20 text-amber-400', LOW: 'bg-green-500/20 text-green-400' } as Record<string,string>)[s] ?? '';
  }
}
