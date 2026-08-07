import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot } from '@angular/fire/firestore';
import { UserProfile } from '../interfaces/user-profile.interface';
import { getDailyString, getMonthlyString, getWeeklyString } from '../utils/date.util';

export type RankingPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private firestore = inject(Firestore);
  private PAGE_SIZE = 20;

  private lastVisible: any = null;
  private currentPeriod: RankingPeriod = 'allTime';

  async getRankingPage(period: RankingPeriod, reset: boolean = false): Promise<{ users: UserProfile[], hasMore: boolean }> {
    if (reset) {
      this.lastVisible = null;
      this.currentPeriod = period;
    }

    const usersRef = collection(this.firestore, 'users');
    let q: any;

    const today = getDailyString();
    const thisWeek = getWeeklyString();
    const thisMonth = getMonthlyString();

    switch (period) {
      case 'daily':
        q = query(usersRef, where('stats.daily.date', '==', today), orderBy('stats.daily.score', 'desc'), limit(this.PAGE_SIZE));
        break;
      case 'weekly':
        q = query(usersRef, where('stats.weekly.date', '==', thisWeek), orderBy('stats.weekly.score', 'desc'), limit(this.PAGE_SIZE));
        break;
      case 'monthly':
        q = query(usersRef, where('stats.monthly.date', '==', thisMonth), orderBy('stats.monthly.score', 'desc'), limit(this.PAGE_SIZE));
        break;
      case 'allTime':
      default:
        q = query(usersRef, orderBy('stats.totalScore', 'desc'), limit(this.PAGE_SIZE));
        break;
    }

    if (this.lastVisible) {
      q = query(q, startAfter(this.lastVisible));
    }

    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      this.lastVisible = snapshot.docs[snapshot.docs.length - 1];
    }

    return {
      users: snapshot.docs.map(doc => doc.data() as UserProfile),
      hasMore: snapshot.docs.length === this.PAGE_SIZE
    };
  }

  async searchUsers(queryText: string): Promise<UserProfile[]> {
    if (!queryText.trim()) return [];
    
    const term = queryText.trim().toLowerCase();
    const usersRef = collection(this.firestore, 'users');
    
    // Buscar en el array searchPrefixes
    const q = query(usersRef, where('searchPrefixes', 'array-contains', term), limit(20));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  }
}
