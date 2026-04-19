// src/app/pages/route-detail/route-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EvacuationService } from '../../core/services/evacuation.service';
import { EvacuationRoute, RouteCheckpoint } from '../../shared/models/evacuation.model';
import { MapViewComponent } from '../../shared/components/map-view/map-view.component';
import { MapPickerComponent } from '../../shared/components/map-picker/map-picker.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-route-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MapViewComponent, MapPickerComponent, StatusBadgeComponent],
  template: `
    <div class="p-6 max-w-6xl mx-auto space-y-6">

      <!-- ── CREATE MODE ─────────────────────────────────────── -->
      <ng-container *ngIf="isNew">
        <div class="flex items-center gap-3">
          <a routerLink="/evacuation" class="text-on-surface-variant hover:text-on-surface transition-colors">
            <span class="material-symbols-outlined">arrow_back</span>
          </a>
          <h1 class="text-3xl font-black">New Evacuation Route</h1>
        </div>
        <div class="glass-1 p-6 rounded-2xl border border-white/5 max-w-xl space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Alert</label>
            <p class="text-xs text-on-surface-variant">Use the Evacuation Routes list page to create routes with full alert selection and dynamic routing.</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Duration (min)</label>
              <input type="number" [(ngModel)]="formData.estimatedDurationMin"
                     class="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-primary/50" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Capacity</label>
              <input type="number" [(ngModel)]="formData.capacity"
                     class="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-primary/50" />
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button (click)="createRoute()"
                    class="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold text-sm">Create Route</button>
            <a routerLink="/evacuation"
               class="px-5 py-3 rounded-xl border border-white/20 font-bold text-sm text-on-surface-variant hover:bg-white/5">Cancel</a>
          </div>
        </div>
      </ng-container>

      <!-- ── VIEW MODE ─────────────────────────────────────── -->
      <ng-container *ngIf="!isNew && route">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <a routerLink="/evacuation" class="text-on-surface-variant hover:text-on-surface">
              <span class="material-symbols-outlined">arrow_back</span>
            </a>
            <div>
              <h1 class="text-3xl font-black">Evacuation Route</h1>
              <p class="text-sm text-on-surface-variant">{{ route.shelterName || (route.toShelterId ? "Shelter #" + route.toShelterId : "No shelter assigned") }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button *ngIf="route.status === 'PLANNED'" (click)="activate()"
                    class="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-bold hover:bg-green-500/20">
              <span class="material-symbols-outlined text-sm">play_arrow</span> Activate
            </button>
            <button *ngIf="route.status === 'ACTIVE'" (click)="close()"
                    class="flex items-center gap-2 px-4 py-2 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold hover:bg-error/20">
              <span class="material-symbols-outlined text-sm">stop</span> Close Route
            </button>
            <button (click)="deleteRoute()"
                    class="px-4 py-2 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold hover:bg-error/20">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <!-- Info panel -->
          <div class="lg:col-span-2 space-y-4">
            <div class="glass-1 p-6 rounded-2xl border border-white/5 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Status</span>
                <app-status-badge [status]="route.status"></app-status-badge>
              </div>
              <div class="h-px bg-white/5"></div>
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-white/5 rounded-xl p-3 text-center">
                  <p class="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Duration</p>
                  <p class="text-2xl font-black">{{ route.estimatedDurationMin ?? '—' }}<span class="text-xs ml-1">min</span></p>
                </div>
                <div class="bg-white/5 rounded-xl p-3 text-center">
                  <p class="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Capacity</p>
                  <p class="text-2xl font-black">{{ route.capacity ?? '—' }}<span class="text-xs ml-1">ppl</span></p>
                </div>
              </div>
              <div class="text-sm space-y-2">
                <div class="flex justify-between" *ngIf="route.activatedAt">
                  <span class="text-on-surface-variant">Activated</span>
                  <span class="text-green-400">{{ route.activatedAt | date:'dd MMM, HH:mm' }}</span>
                </div>
                <div class="flex justify-between" *ngIf="route.closedAt">
                  <span class="text-on-surface-variant">Closed</span>
                  <span class="text-error">{{ route.closedAt | date:'dd MMM, HH:mm' }}</span>
                </div>
              </div>
            </div>

            <!-- Checkpoints -->
            <div class="glass-1 p-6 rounded-2xl border border-white/5">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-on-surface-variant text-xs uppercase tracking-widest">Checkpoints</h3>
                <button (click)="showAddCheckpoint = !showAddCheckpoint"
                        class="text-primary text-xs font-bold hover:text-primary/70 transition-colors">
                  + Add
                </button>
              </div>

              <!-- Add checkpoint form with map picker -->
              <div *ngIf="showAddCheckpoint" class="mb-4 p-4 bg-white/5 rounded-xl space-y-3">
                <input [(ngModel)]="newCheckpoint.label" placeholder="Label (e.g. Assembly Point A)"
                       class="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm outline-none" />
                <select [(ngModel)]="newCheckpoint.type"
                        class="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm outline-none">
                  <option value="WAYPOINT">Waypoint</option>
                  <option value="MEDICAL_STOP">Medical Stop</option>
                  <option value="SUPPLY_POINT">Supply Point</option>
                </select>
                <app-map-picker (locationPicked)="onCheckpointLocationPicked($event)"></app-map-picker>
                <button (click)="addCheckpoint()"
                        class="w-full py-2 bg-primary text-on-primary rounded-lg text-sm font-bold">
                  Add Checkpoint
                </button>
              </div>

              <div class="space-y-2">
                <div *ngFor="let cp of checkpoints"
                     class="flex items-center gap-3 p-3 bg-white/5 rounded-xl text-sm">
                  <span class="material-symbols-outlined text-primary text-sm">
                    {{ cp.type === 'MEDICAL_STOP' ? 'local_hospital' : cp.type === 'SUPPLY_POINT' ? 'inventory' : 'place' }}
                  </span>
                  <div class="flex-1">
                    <p class="font-medium">{{ cp.label }}</p>
                    <p class="text-[10px] text-on-surface-variant font-mono">{{ cp.location }}</p>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-white/5 text-on-surface-variant">{{ cp.type }}</span>
                </div>
                <p *ngIf="checkpoints.length === 0" class="text-xs text-on-surface-variant text-center py-4">
                  No checkpoints yet
                </p>
              </div>
            </div>
          </div>

          <!-- Map showing route path + checkpoints -->
          <div class="lg:col-span-3 glass-1 p-4 rounded-2xl border border-white/5" style="height: 520px;">
            <app-map-view [geometries]="routeGeometries"></app-map-view>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class RouteDetailComponent implements OnInit {
  route?: EvacuationRoute;
  checkpoints: RouteCheckpoint[] = [];
  isNew = false;
  showAddCheckpoint = false;

  formData: any = { alertId: null, toShelterId: null, estimatedDurationMin: null, capacity: null };
  newCheckpoint: any = { label: '', type: 'WAYPOINT', location: '', isActive: true };

  get routeGeometries() {
    const geoms: any[] = [];
    if (this.route?.path) geoms.push({ type: 'LineString', wkt: this.route.path, color: '#6C5CE7' });
    this.checkpoints.forEach(cp => {
      if (cp.location) geoms.push({ type: 'Point', wkt: cp.location, color: '#7DEFC0' });
    });
    return geoms;
  }

  constructor(
    private route_: ActivatedRoute,
    private router: Router,
    private evacService: EvacuationService
  ) {}

  ngOnInit(): void {
    const idParam = this.route_.snapshot.paramMap.get('id');
    if (idParam === 'new') { this.isNew = true; return; }
    const id = Number(idParam);
    if (!isNaN(id)) {
      this.evacService.getRouteById(id).subscribe(data => {
        this.route = data;
        this.evacService.getCheckpointsByRoute(id).subscribe(cps => this.checkpoints = cps);
      });
    }
  }

  onCheckpointLocationPicked(wkt: string): void { this.newCheckpoint.location = wkt; }

  createRoute(): void {
    this.evacService.createRoute(this.formData).subscribe(() => this.router.navigate(['/evacuation']));
  }

  addCheckpoint(): void {
    if (!this.route || !this.newCheckpoint.location) return;
    const payload = { ...this.newCheckpoint, routeId: this.route.id };
    this.evacService.createCheckpoint(payload).subscribe(cp => {
      this.checkpoints.push(cp);
      this.newCheckpoint = { label: '', type: 'WAYPOINT', location: '', isActive: true };
      this.showAddCheckpoint = false;
    });
  }

  activate(): void { if (this.route) this.evacService.activateRoute(this.route.id).subscribe(r => this.route = r); }
  close(): void    { if (this.route) this.evacService.closeRoute(this.route.id).subscribe(r => this.route = r); }

  deleteRoute(): void {
    if (!this.route) return;
    if (confirm('Delete this evacuation route?')) {
      this.evacService.deleteRoute(this.route.id).subscribe(() => this.router.navigate(['/evacuation']));
    }
  }
}
