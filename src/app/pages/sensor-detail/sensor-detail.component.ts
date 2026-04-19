// src/app/pages/sensor-detail/sensor-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SensorService } from '../../core/services/sensor.service';
import { Sensor } from '../../shared/models/sensor.model';
import { MapViewComponent } from '../../shared/components/map-view/map-view.component';
import { MapPickerComponent } from '../../shared/components/map-picker/map-picker.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-sensor-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MapViewComponent, MapPickerComponent, StatusBadgeComponent],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">

      <!-- ── CREATE MODE ────────────────────────────────────────────── -->
      <ng-container *ngIf="isNew">
        <div class="flex items-center gap-3 mb-2">
          <a routerLink="/sensors" class="text-on-surface-variant hover:text-on-surface transition-colors">
            <span class="material-symbols-outlined">arrow_back</span>
          </a>
          <h1 class="text-3xl font-black">New Sensor</h1>
        </div>

        <form [formGroup]="sensorForm" (ngSubmit)="createSensor()"
              class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left: fields -->
          <div class="glass-1 p-6 rounded-2xl border border-white/5 space-y-4">
            <h2 class="font-bold text-on-surface-variant text-xs uppercase tracking-widest mb-4">Sensor Info</h2>

            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Name *</label>
              <input formControlName="name" placeholder="e.g. Sensor Nord-1"
                     class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50 transition-colors" />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Type *</label>
              <select formControlName="type"
                      class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50 transition-colors">
                <option value="SEISMIC">Seismic</option>
                <option value="FLOOD_GAUGE">Flood Gauge</option>
                <option value="WEATHER">Weather</option>
                <option value="AIR_QUALITY">Air Quality</option>
                <option value="FIRE_SMOKE">Fire / Smoke</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Manufacturer</label>
              <input formControlName="manufacturer"
                     class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50 transition-colors" />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Owner ID</label>
              <input type="number" formControlName="ownerId"
                     class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50 transition-colors" />
            </div>

            <div *ngIf="sensorForm.get('location')?.value" class="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs">
              <span class="text-on-surface-variant">Location: </span>
              <span class="font-mono text-primary">{{ sensorForm.get('location')?.value }}</span>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="submit" [disabled]="sensorForm.invalid"
                      class="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(108,92,231,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                Create Sensor
              </button>
              <a routerLink="/sensors"
                 class="px-5 py-3 rounded-xl border border-white/20 text-on-surface-variant hover:bg-white/5 transition-all font-bold text-sm">
                Cancel
              </a>
            </div>
          </div>

          <!-- Right: map picker -->
          <div class="glass-1 p-6 rounded-2xl border border-white/5">
            <h2 class="font-bold text-on-surface-variant text-xs uppercase tracking-widest mb-4">Pin Location *</h2>
            <app-map-picker
              [initialWkt]="sensorForm.get('location')?.value"
              (locationPicked)="onLocationPicked($event)">
            </app-map-picker>
          </div>
        </form>
      </ng-container>

      <!-- ── VIEW MODE ──────────────────────────────────────────────── -->
      <ng-container *ngIf="!isNew && !editMode && sensor">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <a routerLink="/sensors" class="text-on-surface-variant hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined">arrow_back</span>
            </a>
            <div>
              <h1 class="text-3xl font-black">{{ sensor.name }}</h1>
              <p class="text-on-surface-variant text-sm font-mono">{{ sensor.type }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button (click)="ping()"
                    class="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 text-secondary rounded-xl text-sm font-bold hover:bg-secondary/20 transition-all">
              <span class="material-symbols-outlined text-sm">refresh</span> Ping
            </button>
            <button (click)="enableEdit()"
                    class="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-on-surface rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
              <span class="material-symbols-outlined text-sm">edit</span> Edit
            </button>
            <button (click)="deleteSensor()"
                    class="flex items-center gap-2 px-4 py-2 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold hover:bg-error/20 transition-all">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <!-- Info panel -->
          <div class="lg:col-span-2 glass-1 p-6 rounded-2xl border border-white/5 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status</span>
              <app-status-badge [status]="sensor.status"></app-status-badge>
            </div>
            <div class="h-px bg-white/5"></div>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-on-surface-variant">Manufacturer</span>
                <span class="font-medium">{{ sensor.manufacturer || '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-on-surface-variant">Owner ID</span>
                <span class="font-medium">{{ sensor.ownerId ?? '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-on-surface-variant">Last Ping</span>
                <span class="font-medium">{{ sensor.lastPingAt | date:'dd MMM, HH:mm' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-on-surface-variant">Calibration</span>
                <span class="font-medium">{{ sensor.calibrationDate | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-on-surface-variant">Location (WKT)</span>
                <span class="font-mono text-xs text-primary truncate max-w-[140px]">{{ sensor.location }}</span>
              </div>
            </div>
          </div>

          <!-- Map view -->
          <div class="lg:col-span-3 glass-1 p-4 rounded-2xl border border-white/5" style="height: 360px;">
            <app-map-view
              [geometries]="[{ type: 'Point', wkt: sensor.location, color: '#6C5CE7' }]">
            </app-map-view>
          </div>
        </div>
      </ng-container>

      <!-- ── EDIT MODE ───────────────────────────────────────────────── -->
      <ng-container *ngIf="!isNew && editMode && sensor">
        <div class="flex items-center gap-3 mb-2">
          <button (click)="cancelEdit()" class="text-on-surface-variant hover:text-on-surface transition-colors">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 class="text-3xl font-black">Edit — {{ sensor.name }}</h1>
        </div>

        <form [formGroup]="sensorForm" (ngSubmit)="updateSensor()"
              class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="glass-1 p-6 rounded-2xl border border-white/5 space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Name *</label>
              <input formControlName="name"
                     class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Type *</label>
              <select formControlName="type"
                      class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50">
                <option value="SEISMIC">Seismic</option>
                <option value="FLOOD_GAUGE">Flood Gauge</option>
                <option value="WEATHER">Weather</option>
                <option value="AIR_QUALITY">Air Quality</option>
                <option value="FIRE_SMOKE">Fire / Smoke</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Manufacturer</label>
              <input formControlName="manufacturer"
                     class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div *ngIf="sensorForm.get('location')?.value" class="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs">
              <span class="font-mono text-primary">{{ sensorForm.get('location')?.value }}</span>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="submit" class="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold text-sm">Save Changes</button>
              <button type="button" (click)="cancelEdit()"
                      class="px-5 py-3 rounded-xl border border-white/20 font-bold text-sm">Cancel</button>
            </div>
          </div>
          <div class="glass-1 p-6 rounded-2xl border border-white/5">
            <h2 class="font-bold text-on-surface-variant text-xs uppercase tracking-widest mb-4">Update Location</h2>
            <app-map-picker
              [initialWkt]="sensorForm.get('location')?.value"
              (locationPicked)="onLocationPicked($event)">
            </app-map-picker>
          </div>
        </form>
      </ng-container>
    </div>
  `
})
export class SensorDetailComponent implements OnInit {
  sensor?: Sensor;
  isNew     = false;
  editMode  = false;
  sensorForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private sensorService: SensorService
  ) {
    this.sensorForm = this.fb.group({
      name:         ['', Validators.required],
      type:         ['SEISMIC', Validators.required],
      location:     ['', Validators.required],
      manufacturer: [''],
      ownerId:      [null]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === 'new') { this.isNew = true; return; }
    const id = Number(idParam);
    if (!isNaN(id)) {
      this.sensorService.getSensorById(id).subscribe(data => {
        this.sensor = data;
        this.sensorForm.patchValue(data);
      });
    }
  }

  onLocationPicked(wkt: string): void {
    this.sensorForm.patchValue({ location: wkt });
  }

  createSensor(): void {
    if (this.sensorForm.invalid) return;
    this.sensorService.createSensor(this.sensorForm.value)
      .subscribe(() => this.router.navigate(['/sensors']));
  }

  enableEdit(): void  { this.editMode = true; }
  cancelEdit(): void  { this.editMode = false; if (this.sensor) this.sensorForm.patchValue(this.sensor); }

  updateSensor(): void {
    if (!this.sensor || this.sensorForm.invalid) return;
    this.sensorService.updateSensor(this.sensor.id, this.sensorForm.value).subscribe(updated => {
      this.sensor  = updated;
      this.editMode = false;
    });
  }

  deleteSensor(): void {
    if (!this.sensor) return;
    if (confirm('Delete this sensor permanently?')) {
      this.sensorService.deleteSensor(this.sensor.id)
        .subscribe(() => this.router.navigate(['/sensors']));
    }
  }

  ping(): void {
    if (this.sensor) {
      this.sensorService.updateLastPing(this.sensor.id).subscribe(u => this.sensor = u);
    }
  }
}
