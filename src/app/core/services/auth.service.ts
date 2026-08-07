import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User, signInAnonymously } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';

import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private userService = inject(UserService);
  private googleProvider = new GoogleAuthProvider();

  currentUser = signal<User | null | undefined>(undefined);
  isLoggedIn = computed(() => !!this.currentUser());
  isLoading = computed(() => this.currentUser() === undefined);

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        await this.userService.syncUserProfile(user);
      }
      this.currentUser.set(user);
    });
  }

  loginWithGoogle(): Observable<any> {
    return from(signInWithPopup(this.auth, this.googleProvider));
  }

  loginWithEmail(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  registerWithEmail(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  loginAnonymously(): Observable<any> {
    return from(signInAnonymously(this.auth));
  }

  get displayName(): string {
    const user = this.currentUser();
    if (!user) return '';
    if (user.isAnonymous) return 'Invitado';
    return user.displayName || user.email?.split('@')[0] || 'Usuario';
  }

  get photoURL(): string | null {
    return this.currentUser()?.photoURL ?? null;
  }
}
