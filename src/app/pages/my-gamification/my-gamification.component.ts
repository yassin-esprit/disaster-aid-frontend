import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

type GamTab = 'badges' | 'leaderboard' | 'challenges';

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

  ngOnInit(): void { this.loadBadges(); }

  switchTab(tab: GamTab): void {
    this.activeTab = tab;
    if (tab === 'badges')      this.loadBadges();
    if (tab === 'leaderboard') this.loadLeaderboard();
    if (tab === 'challenges')  this.loadChallenges();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 1 — MY BADGES
  // ═══════════════════════════════════════════════════════════════════════════
  myBadges: any[]        = [];
  allAchievements: any[] = [];

  loadBadges(): void {
    this.loading = true;

    // Load volunteer's earned badges
    this.http.get<any[]>(
      `${environment.apiUrl}/volunteer-achievements/volunteer/${this.volunteerId}`,
      { headers: this.headers }
    ).subscribe({
      next: (badges) => {
        this.myBadges = badges;

        // Also load all achievements to show full catalog with earned/not earned
        this.http.get<any[]>(
          `${environment.apiUrl}/achievements`,
          { headers: this.headers }
        ).subscribe({
          next: (all) => { this.allAchievements = all; this.loading = false; },
          error: ()    => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  /** Check if volunteer has earned a specific achievement */
  hasEarned(achievementId: number): boolean {
    return this.myBadges.some(b => b.achievementId === achievementId);
  }

  /** Get earned date for an achievement */
  earnedAt(achievementId: number): string | null {
    const badge = this.myBadges.find(b => b.achievementId === achievementId);
    return badge ? badge.earnedAt : null;
  }

  /** Toggle visibility of a badge on profile */
  toggleDisplay(badge: any): void {
    this.http.put<any>(
      `${environment.apiUrl}/volunteer-achievements/${badge.vaId}/display?value=${!badge.isDisplayed}`,
      {},
      { headers: this.headers }
    ).subscribe({ next: () => this.loadBadges() });
  }

  rarityClass(rarity: string): string {
    const map: any = { LEGENDARY: 'rarity-legendary', EPIC: 'rarity-epic', RARE: 'rarity-rare', COMMON: 'rarity-common' };
    return map[rarity] || 'rarity-common';
  }

  rarityEmoji(rarity: string): string {
    const map: any = { LEGENDARY: '👑', EPIC: '💜', RARE: '💎', COMMON: '⭐' };
    return map[rarity] || '⭐';
  }

  get earnedCount(): number { return this.myBadges.length; }
  get totalCount(): number  { return this.allAchievements.length; }
  get progressPct(): number {
    if (!this.totalCount) return 0;
    return Math.round((this.earnedCount / this.totalCount) * 100);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2 — LEADERBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  leaderboardEntries: any[] = [];
  myRank: number | null = null;
  myScore: number = 0;
  boardLastRefreshed: string | null = null;

  loadLeaderboard(): void {
    this.loading = true;
    this.http.get<any[]>(
      `${environment.apiUrl}/leaderboards`,
      { headers: this.headers }
    ).subscribe({
      next: (boards) => {
        // Find the auto-managed Global/Impact Score board
        const globalBoard = boards.find(
          b => b.scope === 'GLOBAL' && b.metric === 'IMPACT_SCORE'
        );

        if (globalBoard && globalBoard.snapshotJson) {
          try {
            this.leaderboardEntries = JSON.parse(globalBoard.snapshotJson);
            this.boardLastRefreshed = globalBoard.lastRefreshedAt;

            // Find current volunteer's rank
            const myEntry = this.leaderboardEntries.find(
              e => e.volunteerId === this.volunteerId
            );
            this.myRank  = myEntry ? myEntry.rank  : null;
            this.myScore = myEntry ? myEntry.value : 0;
          } catch {
            this.leaderboardEntries = [];
          }
        } else {
          this.leaderboardEntries = [];
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  rankEmoji(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  scoreTierClass(score: number): string {
    if (!score || score <= 0) return 'tier-starter';
    if (score >= 500) return 'tier-gold';
    if (score >= 200) return 'tier-silver';
    if (score >= 50)  return 'tier-bronze';
    return 'tier-starter';
  }

  scoreTierLabel(score: number): string {
    if (!score || score <= 0) return 'Starter';
    if (score >= 500) return 'Gold';
    if (score >= 200) return 'Silver';
    if (score >= 50)  return 'Bronze';
    return 'Starter';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 3 — CHALLENGES
  // ═══════════════════════════════════════════════════════════════════════════
  challenges: any[] = [];
  joiningId: number | null = null;  // track which challenge is being joined

  loadChallenges(): void {
    this.loading = true;
    // Load ALL active/upcoming challenges
    this.http.get<any[]>(
      `${environment.apiUrl}/challenges`,
      { headers: this.headers }
    ).subscribe({
      next: (res) => {
        // Show ACTIVE and UPCOMING only — not completed
        this.challenges = res.filter(c => c.status !== 'COMPLETED');
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  isParticipating(challenge: any): boolean {
    return challenge.participantIds?.includes(this.volunteerId);
  }

  joinChallenge(challenge: any): void {
    this.joiningId = challenge.challengeId;
    this.http.post<any>(
      `${environment.apiUrl}/challenges/${challenge.challengeId}/join?volunteerId=${this.volunteerId}`,
      {},
      { headers: this.headers }
    ).subscribe({
      next: () => { this.joiningId = null; this.loadChallenges(); },
      error: (err) => {
        this.joiningId = null;
        alert(err?.error?.message || 'Could not join challenge.');
      }
    });
  }

  leaveChallenge(challenge: any): void {
    if (!confirm('Leave this challenge?')) return;
    this.joiningId = challenge.challengeId;
    this.http.post<any>(
      `${environment.apiUrl}/challenges/${challenge.challengeId}/leave?volunteerId=${this.volunteerId}`,
      {},
      { headers: this.headers }
    ).subscribe({
      next: () => { this.joiningId = null; this.loadChallenges(); },
      error: ()  => { this.joiningId = null; }
    });
  }

  statusClass(status: string): string {
    const map: any = { ACTIVE: 'badge-green', UPCOMING: 'badge-yellow', COMPLETED: 'badge-blue' };
    return map[status] || '';
  }

  participantCount(challenge: any): number {
    return challenge.participantIds?.length || 0;
  }
}
