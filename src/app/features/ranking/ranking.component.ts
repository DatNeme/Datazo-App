import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RankingService, RankingPeriod } from '../../core/services/ranking.service';
import { UserProfile } from '../../core/interfaces/user-profile.interface';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatButtonToggleModule, MatProgressSpinnerModule, MatIconModule, TranslatePipe],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss'
})
export class RankingComponent implements OnInit {
  private rankingService = inject(RankingService);

  period = signal<RankingPeriod>('allTime');
  users = signal<UserProfile[]>([]);
  isLoading = signal(true);
  isLoadingMore = signal(false);
  hasMore = signal(true);

  searchQuery = signal('');
  searchedUsers = signal<UserProfile[] | null>(null);
  isSearching = signal(false);
  searchError = signal('');

  ngOnInit() {
    this.loadRanking(true);
  }

  async loadRanking(reset: boolean = false) {
    if (reset) {
      this.isLoading.set(true);
      this.users.set([]);
    } else {
      this.isLoadingMore.set(true);
    }

    try {
      const result = await this.rankingService.getRankingPage(this.period(), reset);
      if (reset) {
        this.users.set(result.users);
      } else {
        this.users.update(current => [...current, ...result.users]);
      }
      this.hasMore.set(result.hasMore);
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading.set(false);
      this.isLoadingMore.set(false);
    }
  }

  onPeriodChange(newPeriod: RankingPeriod) {
    this.period.set(newPeriod);
    this.searchQuery.set('');
    this.searchedUsers.set(null);
    this.loadRanking(true);
  }

  async search() {
    const q = this.searchQuery().trim();
    if (!q) {
      this.searchedUsers.set(null);
      return;
    }

    this.isSearching.set(true);
    this.searchError.set('');

    try {
      const searchTerm = q.startsWith('@') ? q.substring(1) : q;
      const users = await this.rankingService.searchUsers(searchTerm);
      if (users.length > 0) {
        this.searchedUsers.set(users);
      } else {
        this.searchedUsers.set([]);
        this.searchError.set('RANKING.NO_USERS_FOUND');
      }
    } catch (e) {
      this.searchError.set('RANKING.SEARCH_ERROR');
    } finally {
      this.isSearching.set(false);
    }
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchedUsers.set(null);
    this.searchError.set('');
  }

  getScoreForPeriod(user: UserProfile): number {
    switch(this.period()) {
      case 'daily': return user.stats?.daily?.score || 0;
      case 'weekly': return user.stats?.weekly?.score || 0;
      case 'monthly': return user.stats?.monthly?.score || 0;
      case 'allTime': 
      default: return user.stats?.totalScore || 0;
    }
  }
}
