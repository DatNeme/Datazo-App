export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  language: 'es' | 'en';
}

export interface UserStats {
  totalScore: number;
  gamesPlayed: number;
  daily: { date: string; score: number };
  weekly: { date: string; score: number };
  monthly: { date: string; score: number };
}

export interface UserProfile {
  uid: string;
  username: string | null;
  displayName: string | null;
  photoURL?: string;
  searchPrefixes?: string[];
  preferences: UserPreferences;
  stats: UserStats;
}
