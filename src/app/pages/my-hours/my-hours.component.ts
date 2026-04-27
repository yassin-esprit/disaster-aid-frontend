import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RouterModule } from '@angular/router';

type HoursTab = 'timesheets' | 'certificates' | 'impact';

@Component({
  selector: 'app-my-hours',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-hours.component.html',
  styleUrl: './my-hours.component.scss'
})
export class MyHoursComponent implements OnInit {
  activeTab: HoursTab = 'timesheets';
  loading = false;
  saving  = false;
  showModal = false;
  editMode  = false;
  selectedId: number | null = null;
  volunteerId: number;

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  constructor(private http: HttpClient) {
    this.volunteerId = Number(localStorage.getItem('userId') || '0');
  }

  ngOnInit(): void { this.loadTimesheets(); }

  switchTab(tab: HoursTab): void {
    this.activeTab = tab;
    this.showModal = false;
    if (tab === 'timesheets')   this.loadTimesheets();
    if (tab === 'certificates') this.loadCertificates();
    if (tab === 'impact')       this.loadImpact();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESHEETS
  // ═══════════════════════════════════════════════════════════════════════════
  timesheets: any[] = [];
  tsForm = { orgId: 0, loggedHours: 0, workDate: '', taskDescription: '' };

  loadTimesheets(): void {
    this.loading = true;
    // ✅ Fixed: added /api/ prefix
    this.http.get<any[]>(
      `${environment.apiUrl}/timesheets/volunteer/${this.volunteerId}`,
      { headers: this.headers }
    ).subscribe({
      next: (res) => { this.timesheets = res; this.loading = false; },
      error: (e)   => { console.error(e);     this.loading = false; }
    });
  }

  openCreateTs(): void {
    this.editMode  = false;
    this.selectedId = null;
    this.tsForm = { orgId: 0, loggedHours: 0, workDate: '', taskDescription: '' };
    this.showModal = true;
  }

  openEditTs(item: any): void {
    this.editMode   = true;
    this.selectedId = item.timesheetId;
    this.tsForm = {
      orgId:           item.orgId,
      loggedHours:     item.loggedHours,
      workDate:        item.workDate,
      taskDescription: item.taskDescription
    };
    this.showModal = true;
  }

  submitTs(): void {
    if (!this.tsForm.loggedHours || !this.tsForm.workDate || !this.tsForm.taskDescription.trim()) {
      alert('Please fill all required fields.');
      return;
    }
    this.saving = true;

    const payload = {
      applicationId:   0,
      volunteerId:     this.volunteerId,
      orgId:           this.tsForm.orgId,
      loggedHours:     this.tsForm.loggedHours,
      taskDescription: this.tsForm.taskDescription,
      workDate:        this.tsForm.workDate,
      supervisorId:    0
    };

    // ✅ Fixed: added /api/ prefix
    const base = `${environment.apiUrl}/timesheets`;
    const url   = this.editMode && this.selectedId ? `${base}/${this.selectedId}` : base;
    const req$  = this.editMode && this.selectedId
      ? this.http.put<any>(url, payload, { headers: this.headers })
      : this.http.post<any>(url, payload, { headers: this.headers });

    req$.subscribe({
      next: () => { this.saving = false; this.closeModal(); this.loadTimesheets(); },
      error: ()  => { this.saving = false; alert('Error saving timesheet.'); }
    });
  }

  deleteTs(id: number): void {
    if (!confirm('Delete this timesheet?')) return;
    // ✅ Fixed: added /api/ prefix
    this.http.delete(
      `${environment.apiUrl}/timesheets/${id}`,
      { headers: this.headers }
    ).subscribe({ next: () => this.loadTimesheets() });
  }

  closeModal(): void { this.showModal = false; }

  statusClass(s: string): string {
    const map: any = { APPROVED: 'badge-green', REJECTED: 'badge-red', DISPUTED: 'badge-yellow', PENDING: 'badge-purple' };
    return map[s] || '';
  }

  get totalHours(): number {
    return this.timesheets
      .filter(t => t.status === 'APPROVED')
      .reduce((s, t) => s + (t.loggedHours || 0), 0);
  }
  get pendingCount():  number { return this.timesheets.filter(t => t.status === 'PENDING').length; }
  get approvedCount(): number { return this.timesheets.filter(t => t.status === 'APPROVED').length; }

  // ═══════════════════════════════════════════════════════════════════════════
  // CERTIFICATES
  // ═══════════════════════════════════════════════════════════════════════════
  certificates: any[] = [];

  loadCertificates(): void {
    this.loading = true;
    // ✅ Fixed: added /api/ prefix
    this.http.get<any[]>(
      `${environment.apiUrl}/certificates/volunteer/${this.volunteerId}`,
      { headers: this.headers }
    ).subscribe({
      next: (res) => { this.certificates = res; this.loading = false; },
      error: (e)   => { console.error(e);       this.loading = false; }
    });
  }

  get totalCertifiedHours(): number {
    return this.certificates.reduce((s, c) => s + (c.totalHours || 0), 0);
  }

  exportCertificatesCsv(): void {
    if (!this.certificates.length) {
      alert('No certificates to export.');
      return;
    }

    const headers = [
      'Certificate ID', 'Org ID', 'Total Hours',
      'Period From', 'Period To', 'Issued At',
      'Expires At', 'PDF URL', 'Credential Hash'
    ];

    const rows = this.certificates.map(c => [
      c.certificateId,
      c.orgId,
      c.totalHours,
      c.periodFrom,
      c.periodTo,
      c.issuedAt   || '',
      c.expiresAt  || '',
      `"${(c.pdfUrl         || '').replace(/"/g, '""')}"`,
      `"${(c.credentialHash || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download',
      `my_certificates_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPACT RECORDS
  // ═══════════════════════════════════════════════════════════════════════════
  impactRecords: any[] = [];

  loadImpact(): void {
    this.loading = true;
    // ✅ Fixed: added /api/ prefix
    this.http.get<any>(
      `${environment.apiUrl}/impact-records/volunteer/${this.volunteerId}`,
      { headers: this.headers }
    ).subscribe({
      next: (res: any) => {
        this.impactRecords = Array.isArray(res) ? res : (res ? [res] : []);
        this.loading = false;
      },
      error: () => { this.impactRecords = []; this.loading = false; }
    });
  }

  confidenceClass(l: string): string {
    const map: any = { VERIFIED: 'badge-green', CALIBRATED: 'badge-blue', ESTIMATED: 'badge-yellow' };
    return map[l] || '';
  }

  // ── Impact Score helpers ──────────────────────────────────────────────────

  /** CSS class for the score tier badge */
  scoreTierClass(score: number): string {
    if (!score || score <= 0) return 'tier-starter';
    if (score >= 500) return 'tier-gold';
    if (score >= 200) return 'tier-silver';
    if (score >= 50)  return 'tier-bronze';
    return 'tier-starter';
  }

  /** Human-readable tier label */
  scoreTierLabel(score: number): string {
    if (!score || score <= 0) return 'Starter';
    if (score >= 500) return 'Gold';
    if (score >= 200) return 'Silver';
    if (score >= 50)  return 'Bronze';
    return 'Starter';
  }

  /** Emoji medal for the tier */
  scoreTierEmoji(score: number): string {
    if (!score || score <= 0) return '🌱';
    if (score >= 500) return '🥇';
    if (score >= 200) return '🥈';
    if (score >= 50)  return '🥉';
    return '🌱';
  }

  /** Progress toward next tier (0–100) */
  scoreProgress(score: number): number {
    if (!score || score <= 0) return Math.min((score / 50) * 100, 100);
    if (score < 50)  return Math.round((score / 50) * 100);
    if (score < 200) return Math.round(((score - 50) / 150) * 100);
    if (score < 500) return Math.round(((score - 200) / 300) * 100);
    return 100;
  }

  /** Label for next tier */
  nextTierLabel(score: number): string {
    if (!score || score < 50)  return 'Bronze (50 pts)';
    if (score < 200) return 'Silver (200 pts)';
    if (score < 500) return 'Gold (500 pts)';
    return 'Max tier reached!';
  }
}
