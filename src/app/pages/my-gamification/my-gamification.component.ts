import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type GamTab = 'badges' | 'challenges' | 'leaderboard';

@Component({
  selector: 'app-my-gamification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-gamification.component.html',
  styleUrl: './my-gamification.component.scss'
})
export class MyGamificationComponent implements OnInit {
  activeTab: GamTab = 'badges';
  loading = false;
  saving = false;
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

  ngOnInit(): void {
    this.loadBadges();
  }

  switchTab(tab: GamTab): void {
    this.activeTab = tab;
    if (tab === 'badges') this.loadBadges();
    if (tab === 'challenges') this.loadChallenges();
    if (tab === 'leaderboard') this.loadLeaderboard();
  }

  // ═══ MY BADGES ═══
  badges: any[] = [];
  allAchievements: any[] = [];

  loadBadges(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/volunteer-achievements/volunteer/${this.volunteerId}`, { headers: this.headers })
      .subscribe({
        next: (res) => {
          this.badges = res;
          this.loadAchievementDetails();
        },
        error: (e) => { console.error(e); this.loading = false; }
      });
  }

  loadAchievementDetails(): void {
    this.http.get<any[]>(`${environment.apiUrl}/achievements`, { headers: this.headers })
      .subscribe({
        next: (achievements) => {
          this.allAchievements = achievements;
          this.badges = this.badges.map(b => {
            const ach = achievements.find(a => a.achievementId === b.achievementId);
            return { ...b, achievement: ach || null };
          });
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  rarityClass(r: string): string {
    const map: any = { LEGENDARY: 'rarity-legendary', EPIC: 'rarity-epic', RARE: 'rarity-rare', COMMON: 'rarity-common' };
    return map[r] || 'rarity-common';
  }

  categoryClass(c: string): string {
    const map: any = { HOURS: 'cat-hours', SKILLS: 'cat-skills', IMPACT: 'cat-impact', DISASTER_RESPONSE: 'cat-disaster', SOCIAL: 'cat-social' };
    return map[c] || '';
  }

  get totalPoints(): number {
    return this.badges.reduce((sum, b) => sum + (b.achievement?.points || 0), 0);
  }

  get legendaryCount(): number {
    return this.badges.filter(b => b.achievement?.rarity === 'LEGENDARY').length;
  }

  get epicCount(): number {
    return this.badges.filter(b => b.achievement?.rarity === 'EPIC').length;
  }

  // ═══ MY CHALLENGES ═══
  challenges: any[] = [];
  showJoinModal = false;
  joinChallengeId: number | null = null;

  loadChallenges(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/challenges/volunteer/${this.volunteerId}`, { headers: this.headers })
      .subscribe({
        next: (res) => { this.challenges = res; this.loading = false; },
        error: (e) => { console.error(e); this.loading = false; }
      });
  }

  // Also load all active challenges for joining
  allChallenges: any[] = [];

  loadActiveChallenges(): void {
    this.http.get<any[]>(`${environment.apiUrl}/challenges/status/ACTIVE`, { headers: this.headers })
      .subscribe({
        next: (res) => {
          this.allChallenges = res.filter(c => !c.participantIds?.includes(this.volunteerId));
          this.showJoinModal = true;
        },
        error: (e) => console.error(e)
      });
  }

  openJoinChallenge(id: number): void {
    this.joinChallengeId = id;
    this.http.post<any>(`${environment.apiUrl}/challenges/${id}/join?volunteerId=${this.volunteerId}`, {}, { headers: this.headers })
      .subscribe({
        next: () => { this.loadChallenges(); },
        error: (err) => alert(err?.error?.message || 'Failed to join challenge.')
      });
  }

  leaveChallenge(id: number): void {
    if (!confirm('Leave this challenge?')) return;
    this.http.post<any>(`${environment.apiUrl}/challenges/${id}/leave?volunteerId=${this.volunteerId}`, {}, { headers: this.headers })
      .subscribe({
        next: () => { this.loadChallenges(); },
        error: (err) => alert(err?.error?.message || 'Failed to leave challenge.')
      });
  }

  statusClass(s: string): string {
    const map: any = { ACTIVE: 'badge-green', COMPLETED: 'badge-blue', UPCOMING: 'badge-yellow' };
    return map[s] || '';
  }

  progressPercent(c: any): number {
    if (!c.targetValue || c.targetValue === 0) return 0;
    return Math.min(100, ((c.progress || 0) / c.targetValue) * 100);
  }

  // ═══ LEADERBOARD ═══
  leaderboardData: any[] = [];

  loadLeaderboard(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/leaderboards`, { headers: this.headers })
      .subscribe({
        next: (res) => {
          // Try to find a GLOBAL HOURS board first
          const globalBoard = res.find(b => b.scope === 'GLOBAL' && b.metric === 'HOURS');
          if (globalBoard?.snapshotJson) {
            try {
              this.leaderboardData = JSON.parse(globalBoard.snapshotJson);
            } catch {
              this.leaderboardData = [];
            }
          } else {
            this.leaderboardData = [];
          }
          this.loading = false;
        },
        error: (e) => { console.error(e); this.leaderboardData = []; this.loading = false; }
      });
  }

  get isOnLeaderboard(): boolean {
    return this.leaderboardData.some(row => row.volunteerId === this.volunteerId);
  }

  get myRank(): number | null {
    const me = this.leaderboardData.find(row => row.volunteerId === this.volunteerId);
    return me ? me.rank : null;
  }

  rankClass(rank: number): string {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  }
}
