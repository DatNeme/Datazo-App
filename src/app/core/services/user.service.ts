import { Injectable, inject, signal } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, updateDoc, increment, writeBatch } from '@angular/fire/firestore';
import { UserProfile, UserPreferences } from '../interfaces/user-profile.interface';
import { User } from '@angular/fire/auth';

import { getDailyString, getWeeklyString, getMonthlyString } from '../utils/date.util';

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);
  
  // Guardamos el perfil cargado para acceso síncrono en componentes
  userProfile = signal<UserProfile | null>(null);

  /**
   * Carga o crea el perfil del usuario en Firestore.
   */
  async syncUserProfile(user: User): Promise<void> {
    if (user.isAnonymous) {
      this.userProfile.set(null); 
      return;
    }

    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    const snapshot = await getDoc(userDocRef);

    if (snapshot.exists()) {
      this.userProfile.set(snapshot.data() as UserProfile);
    } else {
      // Crear perfil por primera vez
      // Generamos un username temporal basado en el correo o uid
      const defaultUsername = (user.email ? user.email.split('@')[0] : 'user') + '_' + Math.floor(Math.random() * 10000);
      
      const displayName = user.displayName || defaultUsername;
      const searchPrefixes = this.generateSearchPrefixes(defaultUsername, displayName);
      
      const newProfile: UserProfile = {
        uid: user.uid,
        username: defaultUsername, // El usuario podrá cambiarlo luego
        displayName,
        photoURL: user.photoURL || undefined,
        searchPrefixes,
        preferences: {
          theme: 'dark',
          language: 'es'
        },
        stats: {
          totalScore: 0,
          gamesPlayed: 0,
          daily: { date: getDailyString(), score: 0 },
          weekly: { date: getWeeklyString(), score: 0 },
          monthly: { date: getMonthlyString(), score: 0 }
        }
      };
      
      // Guardar perfil y reservar el username en un batch
      const batch = writeBatch(this.firestore);
      batch.set(userDocRef, newProfile);
      batch.set(doc(this.firestore, `usernames/${defaultUsername}`), { uid: user.uid });
      await batch.commit();
      
      this.userProfile.set(newProfile);
    }
  }

  async updatePreferences(uid: string, preferences: Partial<UserPreferences>): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const currentProfile = this.userProfile();
    
    if (currentProfile) {
      this.userProfile.update(profile => ({
        ...profile!,
        preferences: { ...profile!.preferences, ...preferences }
      }));
    }

    await updateDoc(userDocRef, {
      ...(preferences.theme && { 'preferences.theme': preferences.theme }),
      ...(preferences.language && { 'preferences.language': preferences.language })
    });
  }

  /**
   * Intenta cambiar el nombre de usuario verificando que esté libre.
   */
  async changeUsername(uid: string, newUsername: string): Promise<boolean> {
    const currentProfile = this.userProfile();
    if (!currentProfile) return false;
    
    const oldUsername = currentProfile.username;
    if (oldUsername === newUsername) return true;

    // Verificar si está libre
    const newUsernameRef = doc(this.firestore, `usernames/${newUsername}`);
    const snap = await getDoc(newUsernameRef);
    if (snap.exists()) return false; // Ocupado

    const newPrefixes = this.generateSearchPrefixes(newUsername, currentProfile.displayName || '');

    // Hacer el cambio en batch
    const batch = writeBatch(this.firestore);
    batch.set(newUsernameRef, { uid }); // Reservar nuevo
    if (oldUsername) {
      batch.delete(doc(this.firestore, `usernames/${oldUsername}`)); // Liberar viejo
    }
    batch.update(doc(this.firestore, `users/${uid}`), { username: newUsername, searchPrefixes: newPrefixes }); // Actualizar perfil
    
    await batch.commit();

    this.userProfile.update(p => ({ ...p!, username: newUsername, searchPrefixes: newPrefixes }));
    return true;
  }
  
  async updateDisplayName(uid: string, newName: string): Promise<void> {
    const profile = this.userProfile();
    const newPrefixes = this.generateSearchPrefixes(profile?.username || '', newName);
    await updateDoc(doc(this.firestore, `users/${uid}`), { displayName: newName, searchPrefixes: newPrefixes });
    this.userProfile.update(p => ({ ...p!, displayName: newName, searchPrefixes: newPrefixes }));
  }

  /**
   * Incrementa el puntaje del usuario. Reinicia los contadores diarios/semanales/mensuales si cambió el periodo.
   */
  async addScore(uid: string, score: number): Promise<void> {
    const profile = this.userProfile();
    if (!profile) return;

    const today = getDailyString();
    const thisWeek = getWeeklyString();
    const thisMonth = getMonthlyString();

    const updates: any = {
      'stats.totalScore': increment(score),
      'stats.gamesPlayed': increment(1)
    };

    // Si cambió el día, reseteamos el score sumando el actual, sino incrementamos
    if (profile.stats.daily?.date !== today) {
      updates['stats.daily'] = { date: today, score: score };
    } else {
      updates['stats.daily.score'] = increment(score);
    }

    if (profile.stats.weekly?.date !== thisWeek) {
      updates['stats.weekly'] = { date: thisWeek, score: score };
    } else {
      updates['stats.weekly.score'] = increment(score);
    }

    if (profile.stats.monthly?.date !== thisMonth) {
      updates['stats.monthly'] = { date: thisMonth, score: score };
    } else {
      updates['stats.monthly.score'] = increment(score);
    }

    await updateDoc(doc(this.firestore, `users/${uid}`), updates);
    
    // Recargar perfil completo para mantener sincronicidad en el objeto anidado localmente
    const snap = await getDoc(doc(this.firestore, `users/${uid}`));
    if (snap.exists()) this.userProfile.set(snap.data() as UserProfile);
  }

  /**
   * Genera un array de todos los prefijos posibles para los nombres dados, en minúsculas.
   */
  private generateSearchPrefixes(username: string, displayName: string): string[] {
    const prefixes = new Set<string>();
    
    const u = username.trim().toLowerCase();
    const d = displayName.trim().toLowerCase();

    for (let i = 1; i <= u.length; i++) {
      prefixes.add(u.substring(0, i));
    }
    
    for (let i = 1; i <= d.length; i++) {
      prefixes.add(d.substring(0, i));
    }
    
    // También agregar palabras individuales del displayName
    d.split(/\s+/).forEach(word => {
      for (let i = 1; i <= word.length; i++) {
        prefixes.add(word.substring(0, i));
      }
    });

    return Array.from(prefixes);
  }
}
