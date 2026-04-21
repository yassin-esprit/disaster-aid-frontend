import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

type HoursTab = 'timesheets' | 'certificates' | 'impact';
type TimesheetStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPUTED';
type ConfidenceLevel = 'ESTIMATED' | 'CALIBRATED' | 'VERIFIED';

@Component({
  selector: 'app-hours',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hours.component.html',
  styleUrl: './hours.component.scss'
})
export class HoursComponent implements OnInit {

  // ── Tabs ──────────────────────────────────────────────────────────────────
  activeTab: HoursTab = 'timesheets';
  setTab(tab: HoursTab): void { this.activeTab = tab; }

  // ── Shared ────────────────────────────────────────────────────────────────
  loading = false;
  saving  = false;
  showModal = false;
  editMode  = false;
  selectedId: number | null = null;
  searchTerm = '';
  supervisorId = Number(localStorage.getItem('userId') || '1');

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.loadTimesheets(); }

  // ════════════════════════════════════════════════════════════════════════════
  // TAB 1 — TIMESHEETS
  // ════════════════════════════════════════════════════════════════════════════
  timesheets: any[] = [];
  filteredTimesheets: any[] = [];
  showRejectModal = false;
  rejectTargetId: number | null = null;
  rejectReason = '';
  statuses: TimesheetStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'DISPUTED'];
  tsForm: any = this.emptyTsForm();

  loadTimesheets(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/timesheets`, { headers: this.headers }).subscribe({
      next: (res) => { this.timesheets = res; this.filterTimesheets(); this.loading = false; },
      error: (e) => { console.error('Timesheets error', e); this.loading = false; }
    });
  }

  filterTimesheets(): void {
    const t = this.searchTerm.toLowerCase().trim();
    this.filteredTimesheets = t
      ? this.timesheets.filter(x =>
          x.taskDescription?.toLowerCase().includes(t) ||
          x.status?.toLowerCase().includes(t) ||
          String(x.volunteerId).includes(t))
      : [...this.timesheets];
  }

  openCreateTs(): void { this.editMode = false; this.tsForm = this.emptyTsForm(); this.showModal = true; }
  openEditTs(item: any): void {
    this.editMode = true; this.selectedId = item.timesheetId;
    this.tsForm = { applicationId: item.applicationId, volunteerId: item.volunteerId, orgId: item.orgId, loggedHours: item.loggedHours, taskDescription: item.taskDescription, workDate: item.workDate, supervisorId: item.supervisorId };
    this.showModal = true;
  }
  closeModal(): void { this.showModal = false; }

  submitTs(): void {
    this.saving = true;
    const url = this.editMode && this.selectedId
      ? `${environment.apiUrl}/api/timesheets/${this.selectedId}`
      : `${environment.apiUrl}/api/timesheets`;
    const req$ = this.editMode && this.selectedId
      ? this.http.put<any>(url, this.tsForm, { headers: this.headers })
      : this.http.post<any>(url, this.tsForm, { headers: this.headers });
    req$.subscribe({ next: () => { this.saving = false; this.closeModal(); this.loadTimesheets(); }, error: () => { this.saving = false; } });
  }

  approveTs(id: number): void {
    this.http.put<any>(`${environment.apiUrl}/api/timesheets/${id}/approve?supervisorId=${this.supervisorId}`, {}, { headers: this.headers })
      .subscribe({ next: () => this.loadTimesheets() });
  }

  openReject(id: number): void { this.rejectTargetId = id; this.rejectReason = ''; this.showRejectModal = true; }
  confirmReject(): void {
    if (!this.rejectTargetId || !this.rejectReason.trim()) return;
    this.http.put<any>(`${environment.apiUrl}/api/timesheets/${this.rejectTargetId}/reject?supervisorId=${this.supervisorId}&reason=${encodeURIComponent(this.rejectReason)}`, {}, { headers: this.headers })
      .subscribe({ next: () => { this.showRejectModal = false; this.loadTimesheets(); } });
  }

  deleteTs(id: number): void {
    if (!confirm('Delete this timesheet?')) return;
    this.http.delete<void>(`${environment.apiUrl}/api/timesheets/${id}`, { headers: this.headers })
      .subscribe({ next: () => this.loadTimesheets() });
  }

  statusClass(s: string): string {
    return ({ APPROVED: 'badge-green', REJECTED: 'badge-red', DISPUTED: 'badge-yellow', PENDING: 'badge-purple' } as any)[s] || '';
  }

  private emptyTsForm() {
    return { applicationId: 0, volunteerId: 0, orgId: 0, loggedHours: 0, taskDescription: '', workDate: '', supervisorId: this.supervisorId };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TAB 2 — CERTIFICATES
  // ════════════════════════════════════════════════════════════════════════════
  certificates: any[] = [];
  filteredCerts: any[] = [];
  certForm: any = this.emptyCertForm();

  loadCertificates(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/certificates`, { headers: this.headers }).subscribe({
      next: (res) => { this.certificates = res; this.filterCerts(); this.loading = false; },
      error: (e) => { console.error('Certificates error', e); this.loading = false; }
    });
  }

  filterCerts(): void {
    const t = this.searchTerm.toLowerCase().trim();
    this.filteredCerts = t
      ? this.certificates.filter(x => String(x.volunteerId).includes(t) || String(x.orgId).includes(t))
      : [...this.certificates];
  }

  openCreateCert(): void { this.editMode = false; this.certForm = this.emptyCertForm(); this.showModal = true; }
  openEditCert(item: any): void {
    this.editMode = true; this.selectedId = item.certificateId;
    this.certForm = { volunteerId: item.volunteerId, orgId: item.orgId, totalHours: item.totalHours, periodFrom: item.periodFrom, periodTo: item.periodTo, skills: item.skills || [], pdfUrl: item.pdfUrl || '', impactCardUrl: item.impactCardUrl || '', credentialHash: item.credentialHash || '', expiresAt: item.expiresAt || '' };
    this.showModal = true;
  }

  submitCert(): void {
    this.saving = true;
    const url = this.editMode && this.selectedId
      ? `${environment.apiUrl}/api/certificates/${this.selectedId}`
      : `${environment.apiUrl}/api/certificates`;
    const req$ = this.editMode && this.selectedId
      ? this.http.put<any>(url, this.certForm, { headers: this.headers })
      : this.http.post<any>(url, this.certForm, { headers: this.headers });
    req$.subscribe({ next: () => { this.saving = false; this.closeModal(); this.loadCertificates(); }, error: () => { this.saving = false; } });
  }

  deleteCert(id: number): void {
    if (!confirm('Delete this certificate?')) return;
    this.http.delete<void>(`${environment.apiUrl}/api/certificates/${id}`, { headers: this.headers })
      .subscribe({ next: () => this.loadCertificates() });
  }

  private emptyCertForm() {
    return { volunteerId: 0, orgId: 0, totalHours: 0, periodFrom: '', periodTo: '', skills: [], pdfUrl: '', impactCardUrl: '', credentialHash: '', expiresAt: '' };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TAB 3 — IMPACT RECORDS
  // ════════════════════════════════════════════════════════════════════════════
  impactRecords: any[] = [];
  filteredImpact: any[] = [];
  confidenceLevels: ConfidenceLevel[] = ['ESTIMATED', 'CALIBRATED', 'VERIFIED'];
  impactForm: any = this.emptyImpactForm();

  loadImpact(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/impact-records`, { headers: this.headers }).subscribe({
      next: (res) => { this.impactRecords = res; this.filterImpact(); this.loading = false; },
      error: (e) => { console.error('Impact records error', e); this.loading = false; }
    });
  }

  filterImpact(): void {
    const t = this.searchTerm.toLowerCase().trim();
    this.filteredImpact = t
      ? this.impactRecords.filter(x => String(x.volunteerId).includes(t) || x.confidenceLevel?.toLowerCase().includes(t))
      : [...this.impactRecords];
  }

  openCreateImpact(): void { this.editMode = false; this.impactForm = this.emptyImpactForm(); this.showModal = true; }
  openEditImpact(item: any): void {
    this.editMode = true; this.selectedId = item.impactId;
    this.impactForm = { volunteerId: item.volunteerId, totalApprovedHours: item.totalApprovedHours, co2OffsetKg: item.co2OffsetKg, mealsServed: item.mealsServed, peopleHelped: item.peopleHelped, wasteRemovedKg: item.wasteRemovedKg, hoursOfTutoring: item.hoursOfTutoring, confidenceLevel: item.confidenceLevel };
    this.showModal = true;
  }

  submitImpact(): void {
    this.saving = true;
    const url = this.editMode && this.selectedId
      ? `${environment.apiUrl}/api/impact-records/${this.selectedId}`
      : `${environment.apiUrl}/api/impact-records`;
    const req$ = this.editMode && this.selectedId
      ? this.http.put<any>(url, this.impactForm, { headers: this.headers })
      : this.http.post<any>(url, this.impactForm, { headers: this.headers });
    req$.subscribe({ next: () => { this.saving = false; this.closeModal(); this.loadImpact(); }, error: () => { this.saving = false; } });
  }

  deleteImpact(id: number): void {
    if (!confirm('Delete this impact record?')) return;
    this.http.delete<void>(`${environment.apiUrl}/api/impact-records/${id}`, { headers: this.headers })
      .subscribe({ next: () => this.loadImpact() });
  }

  confidenceClass(level: string): string {
    return ({ VERIFIED: 'badge-green', CALIBRATED: 'badge-blue', ESTIMATED: 'badge-yellow' } as any)[level] || '';
  }

  private emptyImpactForm() {
    return { volunteerId: 0, totalApprovedHours: 0, co2OffsetKg: 0, mealsServed: 0, peopleHelped: 0, wasteRemovedKg: 0, hoursOfTutoring: 0, confidenceLevel: 'ESTIMATED' };
  }

  // ── Tab switch also loads data ─────────────────────────────────────────────
  switchTab(tab: HoursTab): void {
    this.activeTab = tab;
    this.searchTerm = '';
    this.showModal = false;
    if (tab === 'timesheets')   this.loadTimesheets();
    if (tab === 'certificates') this.loadCertificates();
    if (tab === 'impact')       this.loadImpact();
  }
}
