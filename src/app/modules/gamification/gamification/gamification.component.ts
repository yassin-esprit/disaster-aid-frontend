import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

type GamificationTab = 'achievements' | 'badges' | 'leaderboard' | 'challenges';
type AchievementCategory = 'HOURS' | 'SKILLS' | 'IMPACT' | 'DISASTER_RESPONSE' | 'SOCIAL';
type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
type LeaderboardScope = 'GLOBAL' | 'REGIONAL' | 'CAUSE' | 'ORGANISATION';
type ChallengeStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

@Component({
  selector: 'app-gamification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gamification.component.html',
  styleUrl: './gamification.component.scss'
})
export class GamificationComponent implements OnInit {

  // ── Tabs ──────────────────────────────────────────────────────────────────
  activeTab: GamificationTab = 'achievements';

  switchTab(tab: GamificationTab): void {
    this.activeTab = tab;
    this.searchTerm = '';
    this.showModal = false;
    if (tab === 'achievements') this.loadAchievements();
    if (tab === 'badges')       this.loadBadges();
    if (tab === 'leaderboard')  this.loadLeaderboards();
    if (tab === 'challenges')   this.loadChallenges();
  }

  // ── Shared ────────────────────────────────────────────────────────────────
  loading   = false;
  saving    = false;
  showModal = false;
  editMode  = false;
  selectedId: number | null = null;
  searchTerm = '';

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.loadAchievements(); }

  // ════════════════════════════════════════════════════════════════════════════
  // TAB 1 — ACHIEVEMENTS
  // ════════════════════════════════════════════════════════════════════════════
  achievements: any[] = [];
  filteredAchievements: any[] = [];

  categories: AchievementCategory[] = ['HOURS', 'SKILLS', 'IMPACT', 'DISASTER_RESPONSE', 'SOCIAL'];
  rarities: Rarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

  achForm: any = this.emptyAchForm();

  loadAchievements(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/achievements`, { headers: this.headers }).subscribe({
      next: (res) => { this.achievements = res; this.filterAchievements(); this.loading = false; },
      error: (e) => { console.error('Achievements error', e); this.loading = false; }
    });
  }

  filterAchievements(): void {
    const t = this.searchTerm.toLowerCase().trim();
    this.filteredAchievements = t
      ? this.achievements.filter(x =>
          x.name?.toLowerCase().includes(t) ||
          x.category?.toLowerCase().includes(t) ||
          x.rarity?.toLowerCase().includes(t))
      : [...this.achievements];
  }

  openCreateAch(): void { this.editMode = false; this.achForm = this.emptyAchForm(); this.showModal = true; }

  openEditAch(item: any): void {
    this.editMode = true;
    this.selectedId = item.achievementId;
    this.achForm = {
      name: item.name, description: item.description, iconUrl: item.iconUrl || '',
      category: item.category, criteria: item.criteria || '',
      points: item.points, rarity: item.rarity, isActive: item.isActive
    };
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  submitAch(): void {
    this.saving = true;
    const url = this.editMode && this.selectedId
      ? `${environment.apiUrl}/achievements/${this.selectedId}`
      : `${environment.apiUrl}/achievements`;
    const req$ = this.editMode && this.selectedId
      ? this.http.put<any>(url, this.achForm, { headers: this.headers })
      : this.http.post<any>(url, this.achForm, { headers: this.headers });
    req$.subscribe({
      next: () => { this.saving = false; this.closeModal(); this.loadAchievements(); },
      error: () => { this.saving = false; }
    });
  }

  deleteAch(id: number): void {
    if (!confirm('Delete this achievement?')) return;
    this.http.delete<void>(`${environment.apiUrl}/achievements/${id}`, { headers: this.headers })
      .subscribe({ next: () => this.loadAchievements() });
  }

  rarityClass(r: string): string {
    return ({ LEGENDARY: 'badge-yellow', EPIC: 'badge-purple', RARE: 'badge-blue', COMMON: 'badge-gray' } as any)[r] || '';
  }

  private emptyAchForm() {
    return { name: '', description: '', iconUrl: '', category: 'HOURS', criteria: '', points: 0, rarity: 'COMMON', isActive: true };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TAB 2 — VOLUNTEER BADGES
  // ════════════════════════════════════════════════════════════════════════════
  badges: any[] = [];
  filteredBadges: any[] = [];
  badgeForm: any = this.emptyBadgeForm();

  loadBadges(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/volunteer-achievements`, { headers: this.headers }).subscribe({
      next: (res) => { this.badges = res; this.filterBadges(); this.loading = false; },
      error: (e) => { console.error('Badges error', e); this.loading = false; }
    });
  }

  filterBadges(): void {
    const t = this.searchTerm.toLowerCase().trim();
    this.filteredBadges = t
      ? this.badges.filter(x =>
          String(x.volunteerId).includes(t) ||
          String(x.achievementId).includes(t))
      : [...this.badges];
  }

  openAwardBadge(): void { this.badgeForm = this.emptyBadgeForm(); this.showModal = true; }

  submitBadge(): void {
    this.saving = true;
    this.http.post<any>(`${environment.apiUrl}/volunteer-achievements`, this.badgeForm, { headers: this.headers }).subscribe({
      next: () => { this.saving = false; this.closeModal(); this.loadBadges(); },
      error: (err) => {
        this.saving = false;
        alert(err?.error?.message || 'Award failed — volunteer may already have this badge.');
      }
    });
  }

  toggleDisplay(item: any): void {
    this.http.put<any>(
      `${environment.apiUrl}/volunteer-achievements/${item.vaId}/display?value=${!item.isDisplayed}`,
      {},
      { headers: this.headers }
    ).subscribe({ next: () => this.loadBadges() });
  }

  deleteBadge(id: number): void {
    if (!confirm('Revoke this badge from the volunteer?')) return;
    this.http.delete<void>(`${environment.apiUrl}/volunteer-achievements/${id}`, { headers: this.headers })
      .subscribe({ next: () => this.loadBadges() });
  }

  private emptyBadgeForm() {
    return { volunteerId: 0, achievementId: 0, isDisplayed: true };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TAB 3 — LEADERBOARDS
  // ════════════════════════════════════════════════════════════════════════════
  leaderboards: any[] = [];
  filteredLeaderboards: any[] = [];
  showSnapshotModal = false;
  snapshotData: any[] = [];
  snapshotTitle = '';
  boardForm: any = this.emptyBoardForm();

  scopes: LeaderboardScope[] = ['GLOBAL', 'REGIONAL', 'CAUSE', 'ORGANISATION'];
  metrics = ['HOURS', 'POINTS', 'IMPACT_SCORE', 'DISASTER_RESPONSES'];

  loadLeaderboards(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/leaderboards`, { headers: this.headers }).subscribe({
      next: (res) => { this.leaderboards = res; this.filterLeaderboards(); this.loading = false; },
      error: (e) => { console.error('Leaderboards error', e); this.loading = false; }
    });
  }

  filterLeaderboards(): void {
    const t = this.searchTerm.toLowerCase().trim();
    this.filteredLeaderboards = t
      ? this.leaderboards.filter(x =>
          x.scope?.toLowerCase().includes(t) ||
          x.metric?.toLowerCase().includes(t))
      : [...this.leaderboards];
  }

  openCreateBoard(): void { this.editMode = false; this.boardForm = this.emptyBoardForm(); this.showModal = true; }

  openEditBoard(item: any): void {
    this.editMode = true;
    this.selectedId = item.boardId;
    this.boardForm = { scope: item.scope, metric: item.metric, snapshotJson: item.snapshotJson || '' };
    this.showModal = true;
  }

  submitBoard(): void {
    this.saving = true;
    const url = this.editMode && this.selectedId
      ? `${environment.apiUrl}/leaderboards/${this.selectedId}`
      : `${environment.apiUrl}/leaderboards`;
    const req$ = this.editMode && this.selectedId
      ? this.http.put<any>(url, this.boardForm, { headers: this.headers })
      : this.http.post<any>(url, this.boardForm, { headers: this.headers });
    req$.subscribe({
      next: () => { this.saving = false; this.closeModal(); this.loadLeaderboards(); },
      error: () => { this.saving = false; }
    });
  }

  refreshBoard(id: number): void {
    this.http.put<any>(
      `${environment.apiUrl}/leaderboards/${id}/refresh`,
      '[]',
      { headers: this.headers }
    ).subscribe({ next: () => this.loadLeaderboards() });
  }

  viewSnapshot(item: any): void {
    this.snapshotTitle = `${item.scope} — ${item.metric}`;
    try { this.snapshotData = item.snapshotJson ? JSON.parse(item.snapshotJson) : []; }
    catch { this.snapshotData = []; }
    this.showSnapshotModal = true;
  }

  deleteBoard(id: number): void {
    if (!confirm('Delete this leaderboard?')) return;
    this.http.delete<void>(`${environment.apiUrl}/leaderboards/${id}`, { headers: this.headers })
      .subscribe({ next: () => this.loadLeaderboards() });
  }

  private emptyBoardForm() {
    return { scope: 'GLOBAL', metric: 'HOURS', snapshotJson: '' };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TAB 4 — CHALLENGES
  // ════════════════════════════════════════════════════════════════════════════
  challenges: any[] = [];
  filteredChallenges: any[] = [];
  showJoinModal = false;
  joinChallengeId: number | null = null;
  joinVolunteerId = 0;
  joinAction: 'join' | 'leave' = 'join';
  challengeForm: any = this.emptyChallengeForm();

  statuses: ChallengeStatus[] = ['UPCOMING', 'ACTIVE', 'COMPLETED'];
  challengeMetrics = ['HOURS', 'DISASTER_RESPONSES', 'PEOPLE_HELPED', 'MEALS_SERVED', 'IMPACT_SCORE'];

  loadChallenges(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/challenges`, { headers: this.headers }).subscribe({
      next: (res) => { this.challenges = res; this.filterChallenges(); this.loading = false; },
      error: (e) => { console.error('Challenges error', e); this.loading = false; }
    });
  }

  filterChallenges(): void {
    const t = this.searchTerm.toLowerCase().trim();
    this.filteredChallenges = t
      ? this.challenges.filter(x =>
          x.title?.toLowerCase().includes(t) ||
          x.status?.toLowerCase().includes(t) ||
          x.targetMetric?.toLowerCase().includes(t))
      : [...this.challenges];
  }

  openCreateChallenge(): void { this.editMode = false; this.challengeForm = this.emptyChallengeForm(); this.showModal = true; }

  openEditChallenge(item: any): void {
    this.editMode = true;
    this.selectedId = item.challengeId;
    this.challengeForm = {
      title: item.title, description: item.description, targetMetric: item.targetMetric,
      targetValue: item.targetValue, rewardPoints: item.rewardPoints,
      startDate: item.startDate, endDate: item.endDate,
      participantIds: item.participantIds || [], status: item.status
    };
    this.showModal = true;
  }

  submitChallenge(): void {
    this.saving = true;
    const url = this.editMode && this.selectedId
      ? `${environment.apiUrl}/challenges/${this.selectedId}`
      : `${environment.apiUrl}/challenges`;
    const req$ = this.editMode && this.selectedId
      ? this.http.put<any>(url, this.challengeForm, { headers: this.headers })
      : this.http.post<any>(url, this.challengeForm, { headers: this.headers });
    req$.subscribe({
      next: () => { this.saving = false; this.closeModal(); this.loadChallenges(); },
      error: () => { this.saving = false; }
    });
  }

  openJoin(id: number, action: 'join' | 'leave'): void {
    this.joinChallengeId = id;
    this.joinAction = action;
    this.joinVolunteerId = 0;
    this.showJoinModal = true;
  }

  confirmJoin(): void {
    if (!this.joinChallengeId || !this.joinVolunteerId) return;
    const endpoint = `${environment.apiUrl}/challenges/${this.joinChallengeId}/${this.joinAction}?volunteerId=${this.joinVolunteerId}`;
    this.http.post<any>(endpoint, {}, { headers: this.headers }).subscribe({
      next: () => { this.showJoinModal = false; this.loadChallenges(); },
      error: (err) => alert(err?.error?.message || 'Operation failed.')
    });
  }

  deleteChallenge(id: number): void {
    if (!confirm('Delete this challenge?')) return;
    this.http.delete<void>(`${environment.apiUrl}/challenges/${id}`, { headers: this.headers })
      .subscribe({ next: () => this.loadChallenges() });
  }

  statusClass(s: string): string {
    return ({ ACTIVE: 'badge-green', COMPLETED: 'badge-blue', UPCOMING: 'badge-yellow' } as any)[s] || '';
  }

  private emptyChallengeForm() {
    return { title: '', description: '', targetMetric: 'HOURS', targetValue: 0, rewardPoints: 0, startDate: '', endDate: '', participantIds: [], status: 'UPCOMING' };
  }
}
